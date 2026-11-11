-- Enfermaria como setor de internação + campos do leito configuráveis por unidade.

-- 1. Enfermaria ------------------------------------------------------------------
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS valid_department;
ALTER TABLE public.patients ADD CONSTRAINT valid_department CHECK (
  department IN (
    'URGÊNCIA E EMERGÊNCIA ADULTO',
    'URGÊNCIA E EMERGÊNCIA PEDIÁTRICA',
    'UTI',
    'ENFERMARIA',
    'POSTO INTERNAÇÃO'
  )
);

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS uti_diet text;

-- Layout padrão: a enfermaria nasce com zero leitos (não altera a contagem nem a
-- cobrança de quem não contratou); a unidade define o quantitativo.
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
    ('UTI',                              'yellow', 'U', 10, 'UTI 2',               'uti'),
    ('ENFERMARIA',                       'blue',   'E', 0,  'Enfermaria 1',        'enfermaria'),
    ('ENFERMARIA',                       'yellow', 'E', 0,  'Enfermaria 2',        'enfermaria');
$$;

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
          WHEN _department IN ('UTI', 'ENFERMARIA') THEN _department
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

-- Proteção dos leitos fixos: UTI e enfermaria seguem a mesma regra.
CREATE OR REPLACE FUNCTION public.protect_fixed_uti_beds()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.department IN ('UTI', 'ENFERMARIA')
     AND OLD.sector IN ('blue', 'yellow')
     AND public.is_fixed_bed(OLD.hospital_unit_id, OLD.department, OLD.sector, OLD.bed_number) THEN
    IF TG_OP = 'DELETE' THEN
      IF COALESCE(OLD.is_vacant, false) = true THEN
        RETURN OLD; -- permite reciclar slot vago
      END IF;
      RAISE EXCEPTION 'Leitos fixos ocupados não podem ser excluídos; libere como vago.';
    END IF;
    IF TG_OP = 'UPDATE' THEN
      IF NEW.department IS DISTINCT FROM OLD.department
         OR NEW.sector IS DISTINCT FROM OLD.sector
         OR NEW.bed_number IS DISTINCT FROM OLD.bed_number THEN
        RAISE EXCEPTION 'Número/setor de leitos fixos não podem ser alterados; use realocação por leito vago.';
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
  IF OLD.department NOT IN ('UTI', 'ENFERMARIA')
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

-- 2. Campos do leito por unidade ---------------------------------------------------
-- Guarda só o que a gestão DESLIGOU em cada departamento. Desligar esconde o
-- campo do mapa; o conteúdo já registrado permanece no banco.
CREATE TABLE IF NOT EXISTS public.unit_field_settings (
  hospital_unit_id uuid NOT NULL REFERENCES public.hospital_units(id) ON DELETE CASCADE,
  department text NOT NULL,
  hidden_fields text[] NOT NULL DEFAULT '{}',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (hospital_unit_id, department)
);

ALTER TABLE public.unit_field_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Equipe lê os campos da própria unidade" ON public.unit_field_settings;
CREATE POLICY "Equipe lê os campos da própria unidade"
  ON public.unit_field_settings FOR SELECT TO authenticated
  USING (public.can_access_unit_row(hospital_unit_id));

DROP POLICY IF EXISTS "Gestão define os campos da própria unidade" ON public.unit_field_settings;
CREATE POLICY "Gestão define os campos da própria unidade"
  ON public.unit_field_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_unit_admin(auth.uid(), hospital_unit_id));

DROP POLICY IF EXISTS "Gestão altera os campos da própria unidade" ON public.unit_field_settings;
CREATE POLICY "Gestão altera os campos da própria unidade"
  ON public.unit_field_settings FOR UPDATE TO authenticated
  USING (public.is_unit_admin(auth.uid(), hospital_unit_id))
  WITH CHECK (public.is_unit_admin(auth.uid(), hospital_unit_id));

DROP POLICY IF EXISTS "Operador remove configuração de campos" ON public.unit_field_settings;
CREATE POLICY "Operador remove configuração de campos"
  ON public.unit_field_settings FOR DELETE TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_unit_field_settings_updated_at ON public.unit_field_settings;
CREATE TRIGGER trg_unit_field_settings_updated_at
  BEFORE UPDATE ON public.unit_field_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_field_settings TO authenticated;
