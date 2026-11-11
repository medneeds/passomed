-- ============================================================================
-- Teste de isolamento entre instituições (rodar no ambiente de demonstração,
-- depois de demo.reset()). Cada linha deve retornar ok = true.
-- Simula usuários reais trocando o papel e o JWT da sessão, então exercita as
-- mesmas políticas RLS que o aplicativo usa.
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS _test;

CREATE OR REPLACE FUNCTION _test.as_user(p_email text, p_sql text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE v_id uuid; v_out text;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE email = p_email;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_id, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_id::text, true);
  EXECUTE 'set local role authenticated';
  BEGIN
    EXECUTE p_sql INTO v_out;
  EXCEPTION WHEN others THEN
    v_out := 'ERRO: ' || sqlerrm;
  END;
  EXECUTE 'reset role';
  RETURN v_out;
END $$;
GRANT USAGE ON SCHEMA _test TO authenticated;

WITH u AS (
  SELECT (SELECT hospital_unit_id FROM public.institution_branding WHERE slug = 'demo')     AS a,
         (SELECT hospital_unit_id FROM public.institution_branding WHERE slug = 'saolucas') AS b
), r(caso, obtido, esperado) AS (
  SELECT 'médico de A vê pacientes de A',
         _test.as_user('demo.uti@sistema.local', format('select (count(*) > 0)::text from patients where hospital_unit_id = %L', a)), 'true' FROM u
  UNION ALL SELECT 'médico de A não vê pacientes de B',
         _test.as_user('demo.uti@sistema.local', format('select count(*)::text from patients where hospital_unit_id = %L', b)), '0' FROM u
  UNION ALL SELECT 'médico não vê contrato',
         _test.as_user('demo.uti@sistema.local', 'select count(*)::text from bed_contracts'), '0' FROM u
  UNION ALL SELECT 'coordenador de B não vê pacientes de A',
         _test.as_user('saolucas.gestor@sistema.local', format('select count(*)::text from patients where hospital_unit_id = %L', a)), '0' FROM u
  UNION ALL SELECT 'coordenador de B não altera pacientes de A',
         _test.as_user('saolucas.gestor@sistema.local', format('with x as (update patients set name = ''X'' where hospital_unit_id = %L returning 1) select count(*)::text from x', a)), '0' FROM u
  UNION ALL SELECT 'coordenador de B só vê usuários de B',
         _test.as_user('saolucas.gestor@sistema.local', 'select count(*)::text from profiles'), '2' FROM u
  UNION ALL SELECT 'coordenador de B não se vincula a A',
         left(_test.as_user('saolucas.gestor@sistema.local', format('with x as (insert into user_hospital_assignments(user_id, hospital_unit_id) values (auth.uid(), %L) returning 1) select count(*)::text from x', a)), 4), 'ERRO' FROM u
  UNION ALL SELECT 'coordenador não vira operador da plataforma',
         left(_test.as_user('saolucas.gestor@sistema.local', 'with x as (insert into platform_admins(user_id) values (auth.uid()) returning 1) select count(*)::text from x'), 4), 'ERRO' FROM u
  UNION ALL SELECT 'coordenador de B não altera a marca de A',
         _test.as_user('saolucas.gestor@sistema.local', format('with x as (update institution_branding set primary_color = ''#000000'' where hospital_unit_id = %L returning 1) select count(*)::text from x', a)), '0' FROM u
  UNION ALL SELECT 'coordenador de B altera a própria marca',
         _test.as_user('saolucas.gestor@sistema.local', format('with x as (update institution_branding set tagline = tagline where hospital_unit_id = %L returning 1) select count(*)::text from x', b)), '1' FROM u
  UNION ALL SELECT 'coordenador de B não lê a cobrança de A',
         left(_test.as_user('saolucas.gestor@sistema.local', format('select unit_billing_summary(%L)::text', a)), 4), 'ERRO' FROM u
  UNION ALL SELECT 'cobrança de B: 10 leitos = R$ 250',
         _test.as_user('saolucas.gestor@sistema.local', format('select unit_billing_summary(%L)->>''contracted_monthly_cents''', b)), '25000' FROM u
  UNION ALL SELECT 'coordenador não renomeia unidades',
         _test.as_user('saolucas.gestor@sistema.local', 'with x as (update hospital_units set name = name returning 1) select count(*)::text from x'), '0' FROM u
  UNION ALL SELECT 'coordenador não altera o próprio contrato',
         _test.as_user('saolucas.gestor@sistema.local', 'with x as (update bed_contracts set contracted_beds = 999 returning 1) select count(*)::text from x'), '0' FROM u
  UNION ALL SELECT 'operador vê as duas instituições',
         _test.as_user('coordenador@sistema.local', 'select count(distinct hospital_unit_id)::text from patients'), '2' FROM u
)
SELECT caso, obtido, esperado, (obtido = esperado) AS ok FROM r;
