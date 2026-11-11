-- Cadastros de interesse vindos da landing (funil comercial do operador da plataforma).
-- O visitante NÃO lê nem escreve na tabela: envia por uma função que valida e limita.

CREATE TABLE IF NOT EXISTS public.sales_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  institution_name text NOT NULL,
  contact_name text NOT NULL,
  contact_role text,
  email text NOT NULL,
  whatsapp text NOT NULL,
  city_state text,
  sectors text[] NOT NULL DEFAULT '{}',
  beds_estimate integer,
  billing_cycle text NOT NULL DEFAULT 'undecided' CHECK (billing_cycle IN ('annual', 'monthly', 'undecided')),
  message text,
  consent_at timestamptz NOT NULL DEFAULT now(),
  source text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'demo_scheduled', 'proposal', 'won', 'lost')),
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
CREATE INDEX IF NOT EXISTS idx_sales_leads_created_at ON public.sales_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON public.sales_leads (status);

ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Operador lê os cadastros" ON public.sales_leads;
CREATE POLICY "Operador lê os cadastros" ON public.sales_leads
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Operador atualiza os cadastros" ON public.sales_leads;
CREATE POLICY "Operador atualiza os cadastros" ON public.sales_leads
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Operador exclui os cadastros" ON public.sales_leads;
CREATE POLICY "Operador exclui os cadastros" ON public.sales_leads
  FOR DELETE TO authenticated USING (public.is_platform_admin(auth.uid()));

REVOKE ALL ON public.sales_leads FROM anon;
GRANT SELECT, UPDATE, DELETE ON public.sales_leads TO authenticated;

DROP TRIGGER IF EXISTS trg_sales_leads_updated_at ON public.sales_leads;
CREATE TRIGGER trg_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Envio público do formulário. Valida, normaliza e limita abuso:
-- no máximo 3 cadastros por e-mail ou WhatsApp em 24h e 200 no total por hora.
CREATE OR REPLACE FUNCTION public.submit_sales_lead(
  p_institution_name text,
  p_contact_name text,
  p_email text,
  p_whatsapp text,
  p_sectors text[] DEFAULT '{}',
  p_beds_estimate integer DEFAULT NULL,
  p_billing_cycle text DEFAULT 'undecided',
  p_contact_role text DEFAULT NULL,
  p_city_state text DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_source text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_institution text := btrim(coalesce(p_institution_name, ''));
  v_contact text := btrim(coalesce(p_contact_name, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_phone text := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
  v_sectors text[];
  v_cycle text := coalesce(p_billing_cycle, 'undecided');
BEGIN
  IF length(v_institution) < 2 OR length(v_institution) > 160 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'institution');
  END IF;
  IF length(v_contact) < 2 OR length(v_contact) > 120 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'contact');
  END IF;
  IF length(v_email) > 200 OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'email');
  END IF;
  IF length(v_phone) < 10 OR length(v_phone) > 13 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'whatsapp');
  END IF;
  IF v_cycle NOT IN ('annual', 'monthly', 'undecided') THEN v_cycle := 'undecided'; END IF;

  SELECT coalesce(array_agg(DISTINCT s), '{}') INTO v_sectors
  FROM unnest(coalesce(p_sectors, '{}')) s
  WHERE s IN ('emergencia', 'uti', 'enfermaria');

  IF (SELECT count(*) FROM public.sales_leads
      WHERE created_at > now() - interval '24 hours' AND (email = v_email OR whatsapp = v_phone)) >= 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_limit');
  END IF;
  IF (SELECT count(*) FROM public.sales_leads WHERE created_at > now() - interval '1 hour') >= 200 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'busy');
  END IF;

  INSERT INTO public.sales_leads (institution_name, contact_name, contact_role, email, whatsapp, city_state,
                                  sectors, beds_estimate, billing_cycle, message, source)
  VALUES (v_institution, v_contact, nullif(left(btrim(coalesce(p_contact_role, '')), 80), ''), v_email, v_phone,
          nullif(left(btrim(coalesce(p_city_state, '')), 80), ''), v_sectors,
          CASE WHEN p_beds_estimate BETWEEN 1 AND 2000 THEN p_beds_estimate END,
          v_cycle, nullif(left(btrim(coalesce(p_message, '')), 1000), ''),
          nullif(left(btrim(coalesce(p_source, '')), 60), ''));

  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.submit_sales_lead(text, text, text, text, text[], integer, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_sales_lead(text, text, text, text, text[], integer, text, text, text, text, text) TO anon, authenticated;

-- Resumo para o painel e para consultas rápidas ("quantos cadastros hoje?").
-- Dia contado no fuso de Brasília.
CREATE OR REPLACE FUNCTION public.sales_leads_summary()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE WHEN auth.uid() IS NOT NULL AND NOT public.is_platform_admin(auth.uid()) THEN NULL ELSE
    jsonb_build_object(
      'total', count(*),
      'new', count(*) FILTER (WHERE status = 'new'),
      'today', count(*) FILTER (WHERE (created_at AT TIME ZONE 'America/Sao_Paulo')::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date),
      'last_7_days', count(*) FILTER (WHERE created_at > now() - interval '7 days'),
      'beds_in_pipeline', coalesce(sum(beds_estimate) FILTER (WHERE status NOT IN ('won', 'lost')), 0)
    ) END
  FROM public.sales_leads;
$$;
REVOKE ALL ON FUNCTION public.sales_leads_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sales_leads_summary() TO authenticated, service_role;
