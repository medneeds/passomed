-- ============================================================================
-- PassoMed white label — quantitativo de leitos por setor e cobrança por leito
-- ----------------------------------------------------------------------------
-- 1) sector_bed_capacities: quantos leitos FIXOS cada setor tem (antes era
--    fixo no código: V01–V07, A01–A06, Z01–Z06, U01–U10).
-- 2) bed_contracts: quantos leitos a instituição contratou e a que preço.
--    O quantitativo configurado nunca pode passar do contratado.
-- 3) billing_invoices: fotografia mensal (leitos × preço) para faturar.
-- ============================================================================

-- 1. Quantitativo de leitos fixos ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.sector_bed_capacities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_unit_id uuid NOT NULL REFERENCES public.hospital_units(id) ON DELETE CASCADE,
  state_id uuid NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  department text NOT NULL,
  sector text NOT NULL,
  bed_prefix text NOT NULL,
  fixed_bed_count integer NOT NULL DEFAULT 0 CHECK (fixed_bed_count >= 0 AND fixed_bed_count <= 60),
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hospital_unit_id, state_id, department, sector)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sector_bed_capacities TO authenticated;
GRANT ALL ON public.sector_bed_capacities TO service_role;
ALTER TABLE public.sector_bed_capacities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Membros veem o quantitativo da própria unidade" ON public.sector_bed_capacities;
CREATE POLICY "Membros veem o quantitativo da própria unidade"
  ON public.sector_bed_capacities FOR SELECT TO authenticated
  USING (public.can_access_unit_row(hospital_unit_id));

DROP POLICY IF EXISTS "Coordenador define o quantitativo da própria unidade" ON public.sector_bed_capacities;
CREATE POLICY "Coordenador define o quantitativo da própria unidade"
  ON public.sector_bed_capacities FOR INSERT TO authenticated
  WITH CHECK (public.is_unit_admin(auth.uid(), hospital_unit_id));

DROP POLICY IF EXISTS "Coordenador ajusta o quantitativo da própria unidade" ON public.sector_bed_capacities;
CREATE POLICY "Coordenador ajusta o quantitativo da própria unidade"
  ON public.sector_bed_capacities FOR UPDATE TO authenticated
  USING (public.is_unit_admin(auth.uid(), hospital_unit_id))
  WITH CHECK (public.is_unit_admin(auth.uid(), hospital_unit_id));

DROP POLICY IF EXISTS "Operador remove quantitativo" ON public.sector_bed_capacities;
CREATE POLICY "Operador remove quantitativo"
  ON public.sector_bed_capacities FOR DELETE TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_sector_bed_capacities_updated_at ON public.sector_bed_capacities;
CREATE TRIGGER trg_sector_bed_capacities_updated_at
  BEFORE UPDATE ON public.sector_bed_capacities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Setores configuráveis e os padrões históricos (usados quando a unidade ainda
-- não tem linha própria). Fonte única para banco e relatórios.
CREATE OR REPLACE FUNCTION public.default_bed_layout()
RETURNS TABLE (department text, sector text, bed_prefix text, fixed_bed_count integer, sector_label text, kind text)
LANGUAGE sql IMMUTABLE
AS $$
  VALUES
    ('URGÊNCIA E EMERGÊNCIA ADULTO',     'red',    'V', 7,  'Sala Vermelha',       'emergencia'),
    ('URGÊNCIA E EMERGÊNCIA ADULTO',     'yellow', 'A', 6,  'Observação Amarela',  'emergencia'),
    ('URGÊNCIA E EMERGÊNCIA ADULTO',     'blue',   'Z', 6,  'Observação Azul',     'emergencia'),
    ('URGÊNCIA E EMERGÊNCIA PEDIÁTRICA', 'red',    'V', 7,  'Sala Vermelha',       'emergencia'),
    ('URGÊNCIA E EMERGÊNCIA PEDIÁTRICA', 'yellow', 'A', 6,  'Observação Amarela',  'emergencia'),
    ('URGÊNCIA E EMERGÊNCIA PEDIÁTRICA', 'blue',   'Z', 6,  'Observação Azul',     'emergencia'),
    ('UTI',                              'blue',   'U', 10, 'UTI 1',               'uti'),
    ('UTI',                              'yellow', 'U', 10, 'UTI 2',               'uti');
$$;

-- Quantitativo efetivo de uma unidade: linha própria ou, na falta, o padrão.
CREATE OR REPLACE FUNCTION public.unit_bed_layout(_hospital_unit_id uuid)
RETURNS TABLE (department text, sector text, bed_prefix text, fixed_bed_count integer, sector_label text, kind text, is_default boolean)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT d.department, d.sector,
         coalesce(c.bed_prefix, d.bed_prefix),
         coalesce(c.fixed_bed_count, d.fixed_bed_count),
         d.sector_label, d.kind,
         c.id IS NULL
  FROM public.default_bed_layout() d
  LEFT JOIN public.sector_bed_capacities c
    ON c.hospital_unit_id = _hospital_unit_id
   AND c.department = d.department
   AND c.sector = d.sector
  WHERE public.can_access_unit_row(_hospital_unit_id)
     OR auth.uid() IS NULL; -- chamadas internas (gatilhos, service role)
$$;
REVOKE ALL ON FUNCTION public.unit_bed_layout(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unit_bed_layout(uuid) TO authenticated, service_role;

-- Um leito é "fixo" quando está dentro do quantitativo configurado do setor.
CREATE OR REPLACE FUNCTION public.is_fixed_bed(_hospital_unit_id uuid, _department text, _sector text, _bed_number text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prefix text;
  v_count integer;
  v_n integer;
BEGIN
  IF _bed_number IS NULL OR _sector IS NULL THEN RETURN false; END IF;

  SELECT coalesce(c.bed_prefix, d.bed_prefix), coalesce(c.fixed_bed_count, d.fixed_bed_count)
    INTO v_prefix, v_count
  FROM public.default_bed_layout() d
  LEFT JOIN public.sector_bed_capacities c
    ON c.hospital_unit_id = _hospital_unit_id
   AND c.department = d.department
   AND c.sector = d.sector
  WHERE d.sector = _sector
    AND d.department = CASE
          WHEN _department = 'UTI' THEN 'UTI'
          WHEN _department = 'URGÊNCIA E EMERGÊNCIA PEDIÁTRICA' THEN _department
          ELSE 'URGÊNCIA E EMERGÊNCIA ADULTO'
        END
  LIMIT 1;

  IF v_prefix IS NULL OR _bed_number !~ ('^' || v_prefix || '[0-9]{2}$') THEN
    RETURN false;
  END IF;
  v_n := substring(_bed_number from length(v_prefix) + 1)::integer;
  RETURN v_n >= 1 AND v_n <= v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.is_fixed_bed(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_fixed_bed(uuid, text, text, text) TO authenticated, service_role;

-- Proteção dos leitos fixos passa a seguir o quantitativo configurado.
CREATE OR REPLACE FUNCTION public.protect_fixed_uti_beds()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.department = 'UTI'
     AND OLD.sector IN ('blue', 'yellow')
     AND public.is_fixed_bed(OLD.hospital_unit_id, OLD.department, OLD.sector, OLD.bed_number) THEN
    IF TG_OP = 'DELETE' THEN
      IF COALESCE(OLD.is_vacant, false) = true THEN
        RETURN OLD; -- permite reciclar slot vago
      END IF;
      RAISE EXCEPTION 'Leitos fixos da UTI ocupados não podem ser excluídos; libere como vago.';
    END IF;
    IF TG_OP = 'UPDATE' THEN
      IF NEW.department IS DISTINCT FROM OLD.department
         OR NEW.sector IS DISTINCT FROM OLD.sector
         OR NEW.bed_number IS DISTINCT FROM OLD.bed_number THEN
        RAISE EXCEPTION 'Número/setor de leitos fixos da UTI não podem ser alterados; use realocação por leito vago.';
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_fixed_urgencia_beds()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.department <> 'UTI'
     AND OLD.sector IN ('red', 'yellow', 'blue')
     AND public.is_fixed_bed(OLD.hospital_unit_id, OLD.department, OLD.sector, OLD.bed_number) THEN
    IF TG_OP = 'DELETE' THEN
      IF COALESCE(OLD.is_vacant, false) = true THEN
        RETURN OLD; -- permite reciclar slot vago durante aprovação/realocação
      END IF;
      RAISE EXCEPTION 'Leitos fixos da Urgência (V/A/Z) ocupados não podem ser excluídos; libere como vago.';
    END IF;
    IF TG_OP = 'UPDATE' THEN
      IF NEW.department IS DISTINCT FROM OLD.department
         OR NEW.sector IS DISTINCT FROM OLD.sector
         OR NEW.bed_number IS DISTINCT FROM OLD.bed_number THEN
        RAISE EXCEPTION 'Número/setor de leitos fixos da Urgência não podem ser alterados; use realocação por leito vago.';
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 2. Contrato por leito ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bed_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_unit_id uuid NOT NULL UNIQUE REFERENCES public.hospital_units(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'trial'
    CHECK (status IN ('demo', 'trial', 'active', 'suspended', 'cancelled')),
  contracted_beds integer NOT NULL CHECK (contracted_beds >= 0 AND contracted_beds <= 2000),
  price_per_bed_cents integer NOT NULL DEFAULT 2500 CHECK (price_per_bed_cents >= 0),
  setup_fee_cents integer NOT NULL DEFAULT 0 CHECK (setup_fee_cents >= 0),
  billing_day smallint NOT NULL DEFAULT 10 CHECK (billing_day BETWEEN 1 AND 28),
  min_term_months smallint NOT NULL DEFAULT 12 CHECK (min_term_months >= 0),
  started_on date,
  legal_name text,
  tax_id text,
  billing_email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bed_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coordenador vê o contrato da própria unidade" ON public.bed_contracts;
CREATE POLICY "Coordenador vê o contrato da própria unidade"
  ON public.bed_contracts FOR SELECT TO authenticated
  USING (public.is_unit_admin(auth.uid(), hospital_unit_id));

DROP POLICY IF EXISTS "Operador gerencia contratos" ON public.bed_contracts;
CREATE POLICY "Operador gerencia contratos"
  ON public.bed_contracts FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_bed_contracts_updated_at ON public.bed_contracts;
CREATE TRIGGER trg_bed_contracts_updated_at
  BEFORE UPDATE ON public.bed_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Total de leitos fixos configurados na unidade (com os padrões onde não há linha).
CREATE OR REPLACE FUNCTION public.unit_configured_beds(_hospital_unit_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT coalesce(sum(coalesce(c.fixed_bed_count, d.fixed_bed_count)), 0)::integer
  FROM public.default_bed_layout() d
  LEFT JOIN public.sector_bed_capacities c
    ON c.hospital_unit_id = _hospital_unit_id
   AND c.department = d.department
   AND c.sector = d.sector;
$$;
REVOKE ALL ON FUNCTION public.unit_configured_beds(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unit_configured_beds(uuid) TO service_role;

-- Trava: o quantitativo configurado nunca passa do contratado.
CREATE OR REPLACE FUNCTION public.enforce_contracted_beds()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contracted integer;
  v_total integer;
BEGIN
  SELECT bc.contracted_beds INTO v_contracted
  FROM public.bed_contracts bc
  WHERE bc.hospital_unit_id = NEW.hospital_unit_id
    AND bc.status IN ('demo', 'trial', 'active');

  IF v_contracted IS NULL THEN
    RETURN NEW; -- sem contrato vigente: sem trava (compatibilidade)
  END IF;

  v_total := public.unit_configured_beds(NEW.hospital_unit_id);
  IF v_total > v_contracted THEN
    RAISE EXCEPTION 'Limite de leitos contratados atingido: % configurados para % contratados. Solicite a ampliação do contrato.',
      v_total, v_contracted
      USING ERRCODE = 'P0001', HINT = 'BED_CONTRACT_LIMIT';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_contracted_beds() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_contracted_beds ON public.sector_bed_capacities;
CREATE CONSTRAINT TRIGGER trg_enforce_contracted_beds
  AFTER INSERT OR UPDATE ON public.sector_bed_capacities
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.enforce_contracted_beds();

-- Resumo de cobrança da unidade (coordenador da unidade ou operador).
CREATE OR REPLACE FUNCTION public.unit_billing_summary(_hospital_unit_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contract public.bed_contracts%ROWTYPE;
  v_items jsonb;
  v_total integer;
  v_price integer;
BEGIN
  IF NOT public.is_unit_admin(auth.uid(), _hospital_unit_id) THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_contract FROM public.bed_contracts WHERE hospital_unit_id = _hospital_unit_id;
  v_price := coalesce(v_contract.price_per_bed_cents, 2500);

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'department', l.department, 'sector', l.sector, 'label', l.sector_label,
           'kind', l.kind, 'beds', l.fixed_bed_count,
           'amount_cents', l.fixed_bed_count * v_price
         ) ORDER BY l.department, l.sector), '[]'::jsonb),
         coalesce(sum(l.fixed_bed_count), 0)::integer
    INTO v_items, v_total
  FROM (
    SELECT d.department, d.sector, d.sector_label, d.kind,
           coalesce(c.fixed_bed_count, d.fixed_bed_count) AS fixed_bed_count
    FROM public.default_bed_layout() d
    LEFT JOIN public.sector_bed_capacities c
      ON c.hospital_unit_id = _hospital_unit_id
     AND c.department = d.department AND c.sector = d.sector
  ) l;

  RETURN jsonb_build_object(
    'hospital_unit_id', _hospital_unit_id,
    'has_contract', v_contract.id IS NOT NULL,
    'status', v_contract.status,
    'contracted_beds', v_contract.contracted_beds,
    'configured_beds', v_total,
    'price_per_bed_cents', v_price,
    'monthly_cents', v_total * v_price,
    'contracted_monthly_cents', coalesce(v_contract.contracted_beds, v_total) * v_price,
    'billing_day', v_contract.billing_day,
    'started_on', v_contract.started_on,
    'items', v_items
  );
END;
$$;
REVOKE ALL ON FUNCTION public.unit_billing_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unit_billing_summary(uuid) TO authenticated, service_role;

-- 3. Fatura mensal (fotografia) ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_unit_id uuid NOT NULL REFERENCES public.hospital_units(id) ON DELETE CASCADE,
  reference_month date NOT NULL CHECK (extract(day from reference_month) = 1),
  beds integer NOT NULL,
  price_per_bed_cents integer NOT NULL,
  amount_cents integer NOT NULL,
  breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'sent', 'paid', 'void')),
  due_date date,
  external_provider text,
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hospital_unit_id, reference_month)
);
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coordenador vê as faturas da própria unidade" ON public.billing_invoices;
CREATE POLICY "Coordenador vê as faturas da própria unidade"
  ON public.billing_invoices FOR SELECT TO authenticated
  USING (public.is_unit_admin(auth.uid(), hospital_unit_id));

DROP POLICY IF EXISTS "Operador gerencia faturas" ON public.billing_invoices;
CREATE POLICY "Operador gerencia faturas"
  ON public.billing_invoices FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_billing_invoices_updated_at ON public.billing_invoices;
CREATE TRIGGER trg_billing_invoices_updated_at
  BEFORE UPDATE ON public.billing_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Gera (ou atualiza, se ainda aberta) a fatura do mês para todo contrato ativo.
-- Cobra o que foi CONTRATADO; o configurado nunca passa disso por causa da trava.
CREATE OR REPLACE FUNCTION public.generate_monthly_invoices(p_month date DEFAULT date_trunc('month', now())::date)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_month date := date_trunc('month', p_month)::date;
  v_count integer := 0;
  c record;
  v_breakdown jsonb;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;

  FOR c IN
    SELECT * FROM public.bed_contracts WHERE status = 'active'
  LOOP
    SELECT coalesce(jsonb_agg(jsonb_build_object(
             'department', d.department, 'sector', d.sector, 'label', d.sector_label,
             'beds', coalesce(s.fixed_bed_count, d.fixed_bed_count)
           ) ORDER BY d.department, d.sector), '[]'::jsonb)
      INTO v_breakdown
    FROM public.default_bed_layout() d
    LEFT JOIN public.sector_bed_capacities s
      ON s.hospital_unit_id = c.hospital_unit_id
     AND s.department = d.department AND s.sector = d.sector;

    INSERT INTO public.billing_invoices
      (hospital_unit_id, reference_month, beds, price_per_bed_cents, amount_cents, breakdown, due_date)
    VALUES
      (c.hospital_unit_id, v_month, c.contracted_beds, c.price_per_bed_cents,
       c.contracted_beds * c.price_per_bed_cents, v_breakdown,
       (v_month + (c.billing_day - 1))::date)
    ON CONFLICT (hospital_unit_id, reference_month) DO UPDATE
      SET beds = EXCLUDED.beds,
          price_per_bed_cents = EXCLUDED.price_per_bed_cents,
          amount_cents = EXCLUDED.amount_cents,
          breakdown = EXCLUDED.breakdown,
          due_date = EXCLUDED.due_date
      WHERE public.billing_invoices.status = 'open';
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.generate_monthly_invoices(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_monthly_invoices(date) TO authenticated, service_role;

-- Painel do operador: todas as instituições, leitos e receita mensal.
CREATE OR REPLACE FUNCTION public.platform_billing_overview()
RETURNS TABLE (
  hospital_unit_id uuid, hospital_name text, state_abbreviation text, slug text,
  status text, contracted_beds integer, configured_beds integer,
  price_per_bed_cents integer, monthly_cents integer, started_on date
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT hu.id, hu.name, st.abbreviation, b.slug,
         bc.status, bc.contracted_beds, public.unit_configured_beds(hu.id),
         coalesce(bc.price_per_bed_cents, 2500),
         coalesce(bc.contracted_beds, 0) * coalesce(bc.price_per_bed_cents, 2500),
         bc.started_on
  FROM public.hospital_units hu
  LEFT JOIN public.states st ON st.id = hu.state_id
  LEFT JOIN public.bed_contracts bc ON bc.hospital_unit_id = hu.id
  LEFT JOIN public.institution_branding b ON b.hospital_unit_id = hu.id
  ORDER BY hu.name;
END;
$$;
REVOKE ALL ON FUNCTION public.platform_billing_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.platform_billing_overview() TO authenticated, service_role;

-- Implantação de uma instituição em uma chamada: quantitativo por setor +
-- contrato. p_beds: [{"department":"UTI","sector":"blue","beds":10}, ...];
-- setores não citados ficam com 0 leitos.
CREATE OR REPLACE FUNCTION public.provision_unit_beds(
  p_hospital_unit_id uuid,
  p_beds jsonb,
  p_status text DEFAULT 'trial',
  p_price_per_bed_cents integer DEFAULT 2500
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_state uuid;
  v_total integer;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;

  SELECT state_id INTO v_state FROM public.hospital_units WHERE id = p_hospital_unit_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Unidade não encontrada';
  END IF;

  SELECT coalesce(sum(greatest(coalesce((e->>'beds')::integer, 0), 0)), 0)::integer
    INTO v_total
  FROM jsonb_array_elements(coalesce(p_beds, '[]'::jsonb)) e;

  -- Contrato primeiro (ampliando), para a trava aceitar o novo quantitativo.
  INSERT INTO public.bed_contracts (hospital_unit_id, status, contracted_beds, price_per_bed_cents, started_on)
  VALUES (p_hospital_unit_id, p_status, v_total, p_price_per_bed_cents, current_date)
  ON CONFLICT (hospital_unit_id) DO UPDATE
    SET status = EXCLUDED.status,
        contracted_beds = EXCLUDED.contracted_beds,
        price_per_bed_cents = EXCLUDED.price_per_bed_cents;

  INSERT INTO public.sector_bed_capacities (hospital_unit_id, state_id, department, sector, bed_prefix, fixed_bed_count, updated_by)
  SELECT p_hospital_unit_id, v_state, d.department, d.sector, d.bed_prefix,
         coalesce((
           SELECT greatest((e->>'beds')::integer, 0)
           FROM jsonb_array_elements(coalesce(p_beds, '[]'::jsonb)) e
           WHERE e->>'department' = d.department AND e->>'sector' = d.sector
           LIMIT 1
         ), 0),
         auth.uid()
  FROM public.default_bed_layout() d
  ON CONFLICT (hospital_unit_id, state_id, department, sector) DO UPDATE
    SET fixed_bed_count = EXCLUDED.fixed_bed_count,
        updated_by = EXCLUDED.updated_by;

  RETURN jsonb_build_object('contracted_beds', v_total, 'monthly_cents', v_total * p_price_per_bed_cents);
END;
$$;
REVOKE ALL ON FUNCTION public.provision_unit_beds(uuid, jsonb, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.provision_unit_beds(uuid, jsonb, text, integer) TO authenticated, service_role;
