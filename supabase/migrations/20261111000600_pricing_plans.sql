-- ============================================================================
-- PassoMed — tabela de preços (11/11/2026)
-- ----------------------------------------------------------------------------
--   • R$ 29,90 por leito/mês (antes R$ 25,00 como padrão)
--   • Plano anual à vista: paga 10 meses, usa 12
--   • Mínimo de 10 leitos faturados por contrato
--   • Implantação de R$ 990,00 por unidade, isenta no plano anual
-- Contratos já existentes NÃO mudam de preço: só os padrões para novos.
-- ============================================================================

ALTER TABLE public.bed_contracts
  ADD COLUMN IF NOT EXISTS billing_cycle text NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS min_billable_beds integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS annual_paid_months smallint NOT NULL DEFAULT 10;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bed_contracts_billing_cycle_check') THEN
    ALTER TABLE public.bed_contracts
      ADD CONSTRAINT bed_contracts_billing_cycle_check CHECK (billing_cycle IN ('monthly', 'annual'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bed_contracts_min_billable_check') THEN
    ALTER TABLE public.bed_contracts
      ADD CONSTRAINT bed_contracts_min_billable_check CHECK (min_billable_beds >= 0 AND annual_paid_months BETWEEN 1 AND 12);
  END IF;
END $$;

ALTER TABLE public.bed_contracts ALTER COLUMN price_per_bed_cents SET DEFAULT 2990;
ALTER TABLE public.bed_contracts ALTER COLUMN setup_fee_cents SET DEFAULT 99000;

ALTER TABLE public.billing_invoices
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'subscription';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_invoices_kind_check') THEN
    ALTER TABLE public.billing_invoices
      ADD CONSTRAINT billing_invoices_kind_check CHECK (kind IN ('subscription', 'setup'));
  END IF;
END $$;

-- Uma fatura de assinatura e, no máximo, uma de implantação por unidade/mês.
ALTER TABLE public.billing_invoices
  DROP CONSTRAINT IF EXISTS billing_invoices_hospital_unit_id_reference_month_key;
CREATE UNIQUE INDEX IF NOT EXISTS billing_invoices_unit_month_kind_key
  ON public.billing_invoices (hospital_unit_id, reference_month, kind);

-- Leitos faturados: o contratado, respeitando o mínimo (0 leitos = nada a faturar).
CREATE OR REPLACE FUNCTION public.contract_billable_beds(_contracted integer, _min integer)
RETURNS integer
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE WHEN coalesce(_contracted, 0) <= 0 THEN 0
              ELSE greatest(_contracted, coalesce(_min, 0)) END;
$$;

-- Resumo de cobrança da unidade --------------------------------------------------
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
  v_billable integer;
  v_cycle text;
  v_setup integer;
BEGIN
  IF NOT public.is_unit_admin(auth.uid(), _hospital_unit_id) THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_contract FROM public.bed_contracts WHERE hospital_unit_id = _hospital_unit_id;
  v_price := coalesce(v_contract.price_per_bed_cents, 2990);
  v_cycle := coalesce(v_contract.billing_cycle, 'monthly');

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

  v_billable := public.contract_billable_beds(
    coalesce(v_contract.contracted_beds, v_total),
    coalesce(v_contract.min_billable_beds, 10));
  -- Implantação: isenta no plano anual.
  v_setup := CASE WHEN v_cycle = 'annual' THEN 0 ELSE coalesce(v_contract.setup_fee_cents, 99000) END;

  RETURN jsonb_build_object(
    'hospital_unit_id', _hospital_unit_id,
    'has_contract', v_contract.id IS NOT NULL,
    'status', v_contract.status,
    'contracted_beds', v_contract.contracted_beds,
    'configured_beds', v_total,
    'billable_beds', v_billable,
    'min_billable_beds', coalesce(v_contract.min_billable_beds, 10),
    'price_per_bed_cents', v_price,
    'billing_cycle', v_cycle,
    'monthly_cents', v_total * v_price,
    'contracted_monthly_cents', v_billable * v_price,
    'annual_cents', v_billable * v_price * coalesce(v_contract.annual_paid_months, 10),
    'setup_fee_cents', v_setup,
    'billing_day', v_contract.billing_day,
    'started_on', v_contract.started_on,
    'items', v_items
  );
END;
$$;

-- Faturas: mensal todo mês; anual só no mês de aniversário do contrato;
-- implantação uma vez, no mês de início (planos mensais).
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
  v_billable integer;
  v_amount integer;
  v_start_month date;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;

  FOR c IN
    SELECT * FROM public.bed_contracts WHERE status = 'active'
  LOOP
    v_billable := public.contract_billable_beds(c.contracted_beds, c.min_billable_beds);
    CONTINUE WHEN v_billable = 0;
    v_start_month := date_trunc('month', coalesce(c.started_on, v_month))::date;
    CONTINUE WHEN v_month < v_start_month;

    SELECT coalesce(jsonb_agg(jsonb_build_object(
             'department', d.department, 'sector', d.sector, 'label', d.sector_label,
             'beds', coalesce(s.fixed_bed_count, d.fixed_bed_count)
           ) ORDER BY d.department, d.sector), '[]'::jsonb)
      INTO v_breakdown
    FROM public.default_bed_layout() d
    LEFT JOIN public.sector_bed_capacities s
      ON s.hospital_unit_id = c.hospital_unit_id
     AND s.department = d.department AND s.sector = d.sector;

    IF c.billing_cycle = 'annual' THEN
      -- Só no mês de aniversário.
      CONTINUE WHEN extract(month FROM v_month) <> extract(month FROM v_start_month);
      v_amount := v_billable * c.price_per_bed_cents * c.annual_paid_months;
    ELSE
      v_amount := v_billable * c.price_per_bed_cents;
    END IF;

    INSERT INTO public.billing_invoices
      (hospital_unit_id, reference_month, kind, beds, price_per_bed_cents, amount_cents, breakdown, due_date)
    VALUES
      (c.hospital_unit_id, v_month, 'subscription', v_billable, c.price_per_bed_cents, v_amount,
       v_breakdown || jsonb_build_array(jsonb_build_object('billing_cycle', c.billing_cycle)),
       (v_month + (c.billing_day - 1))::date)
    ON CONFLICT (hospital_unit_id, reference_month, kind) DO UPDATE
      SET beds = EXCLUDED.beds,
          price_per_bed_cents = EXCLUDED.price_per_bed_cents,
          amount_cents = EXCLUDED.amount_cents,
          breakdown = EXCLUDED.breakdown,
          due_date = EXCLUDED.due_date
      WHERE public.billing_invoices.status = 'open';
    v_count := v_count + 1;

    -- Implantação: uma vez, no mês de início, e só no plano mensal.
    IF c.billing_cycle = 'monthly' AND c.setup_fee_cents > 0 AND v_month = v_start_month THEN
      INSERT INTO public.billing_invoices
        (hospital_unit_id, reference_month, kind, beds, price_per_bed_cents, amount_cents, breakdown, due_date)
      VALUES
        (c.hospital_unit_id, v_month, 'setup', 0, 0, c.setup_fee_cents,
         jsonb_build_array(jsonb_build_object('label', 'Implantação')),
         (v_month + (c.billing_day - 1))::date)
      ON CONFLICT (hospital_unit_id, reference_month, kind) DO NOTHING;
    END IF;
  END LOOP;
  RETURN v_count;
END;
$$;

-- Painel do operador: receita mensal recorrente (anual entra como 1/12).
DROP FUNCTION IF EXISTS public.platform_billing_overview();
CREATE FUNCTION public.platform_billing_overview()
RETURNS TABLE (
  hospital_unit_id uuid, hospital_name text, state_abbreviation text, slug text,
  status text, contracted_beds integer, configured_beds integer,
  price_per_bed_cents integer, monthly_cents integer, started_on date,
  billing_cycle text, billable_beds integer, setup_fee_cents integer
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
         coalesce(bc.price_per_bed_cents, 2990),
         CASE
           WHEN bc.id IS NULL THEN 0
           WHEN bc.billing_cycle = 'annual' THEN
             (public.contract_billable_beds(bc.contracted_beds, bc.min_billable_beds)
               * bc.price_per_bed_cents * bc.annual_paid_months) / 12
           ELSE public.contract_billable_beds(bc.contracted_beds, bc.min_billable_beds) * bc.price_per_bed_cents
         END,
         bc.started_on,
         coalesce(bc.billing_cycle, 'monthly'),
         public.contract_billable_beds(bc.contracted_beds, bc.min_billable_beds),
         CASE WHEN bc.billing_cycle = 'annual' THEN 0 ELSE coalesce(bc.setup_fee_cents, 99000) END
  FROM public.hospital_units hu
  LEFT JOIN public.states st ON st.id = hu.state_id
  LEFT JOIN public.bed_contracts bc ON bc.hospital_unit_id = hu.id
  LEFT JOIN public.institution_branding b ON b.hospital_unit_id = hu.id
  ORDER BY hu.name;
END;
$$;
REVOKE ALL ON FUNCTION public.platform_billing_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.platform_billing_overview() TO authenticated, service_role;

-- Implantação de contrato: agora com ciclo de cobrança; preço padrão R$ 29,90.
DROP FUNCTION IF EXISTS public.provision_unit_beds(uuid, jsonb, text, integer);
CREATE FUNCTION public.provision_unit_beds(
  p_hospital_unit_id uuid,
  p_beds jsonb,
  p_status text DEFAULT 'trial',
  p_price_per_bed_cents integer DEFAULT 2990,
  p_billing_cycle text DEFAULT 'monthly'
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_state uuid;
  v_total integer;
  v_billable integer;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;
  IF p_billing_cycle NOT IN ('monthly', 'annual') THEN
    RAISE EXCEPTION 'Ciclo de cobrança inválido';
  END IF;

  SELECT state_id INTO v_state FROM public.hospital_units WHERE id = p_hospital_unit_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Unidade não encontrada';
  END IF;

  SELECT coalesce(sum(greatest(coalesce((e->>'beds')::integer, 0), 0)), 0)::integer
    INTO v_total
  FROM jsonb_array_elements(coalesce(p_beds, '[]'::jsonb)) e;

  -- Contrato primeiro (ampliando), para a trava aceitar o novo quantitativo.
  INSERT INTO public.bed_contracts (hospital_unit_id, status, contracted_beds, price_per_bed_cents, billing_cycle, started_on)
  VALUES (p_hospital_unit_id, p_status, v_total, p_price_per_bed_cents, p_billing_cycle, current_date)
  ON CONFLICT (hospital_unit_id) DO UPDATE
    SET status = EXCLUDED.status,
        contracted_beds = EXCLUDED.contracted_beds,
        price_per_bed_cents = EXCLUDED.price_per_bed_cents,
        billing_cycle = EXCLUDED.billing_cycle;

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

  SELECT public.contract_billable_beds(v_total, bc.min_billable_beds) INTO v_billable
  FROM public.bed_contracts bc WHERE bc.hospital_unit_id = p_hospital_unit_id;

  RETURN jsonb_build_object(
    'contracted_beds', v_total,
    'billable_beds', v_billable,
    'monthly_cents', v_billable * p_price_per_bed_cents,
    'billing_cycle', p_billing_cycle);
END;
$$;
REVOKE ALL ON FUNCTION public.provision_unit_beds(uuid, jsonb, text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.provision_unit_beds(uuid, jsonb, text, integer, text) TO authenticated, service_role;
