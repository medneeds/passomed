-- ============================================================================
-- PassoMed — ambiente de DEMONSTRAÇÃO (não é migração; não roda em produção)
-- ----------------------------------------------------------------------------
-- Cria a função demo.reset(), que deixa o ambiente no estado inicial:
--   • duas instituições fictícias, cada uma com marca, leitos e contrato;
--   • usuários de demonstração por perfil;
--   • pacientes 100% fictícios.
-- As senhas NÃO ficam neste arquivo: são lidas de demo.settings.
-- Rodar demo.reset() apaga tudo o que foi digitado na demonstração.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS demo;
REVOKE ALL ON SCHEMA demo FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS demo.settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

CREATE OR REPLACE FUNCTION demo.ensure_user(
  p_username text, p_full_name text, p_password text,
  p_role public.app_role, p_unit uuid, p_departments text[]
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_email text := lower(p_username) || '@sistema.local';
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE email = v_email;
  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email,
      extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('username', upper(p_username), 'full_name', p_full_name),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_id, v_id::text,
            jsonb_build_object('sub', v_id::text, 'email', v_email), 'email', now(), now(), now());
  ELSE
    UPDATE auth.users
       SET encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = v_id;
  END IF;

  INSERT INTO public.profiles (id, full_name, email, status)
  VALUES (v_id, p_full_name, NULL, 'approved')
  ON CONFLICT (id) DO UPDATE SET status = 'approved', full_name = EXCLUDED.full_name;

  DELETE FROM public.user_roles WHERE user_id = v_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_id, p_role);

  DELETE FROM public.user_departments WHERE user_id = v_id;
  INSERT INTO public.user_departments (user_id, department)
  SELECT v_id, d FROM unnest(coalesce(p_departments, ARRAY[]::text[])) d;

  DELETE FROM public.user_hospital_assignments WHERE user_id = v_id;
  IF p_unit IS NOT NULL THEN
    INSERT INTO public.user_hospital_assignments (user_id, hospital_unit_id) VALUES (v_id, p_unit);
  END IF;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION demo.reset()
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_state uuid;
  v_a uuid;  -- Hospital Demonstração (emergência + UTI)
  v_b uuid;  -- Hospital São Lucas (só UTI) — prova de isolamento e de troca de marca
  -- Plantonistas de demonstração: senha conhecida (vai no link ?demo=uti).
  v_pw text := coalesce((SELECT value FROM demo.settings WHERE key = 'demo_password'), 'DEMO26');
  -- Coordenadores de demonstração: senha própria, fora do link público.
  v_admin_pw text := coalesce(
    (SELECT value FROM demo.settings WHERE key = 'demo_admin_password'),
    'G' || upper(substr(md5(random()::text), 1, 2)) || lpad(floor(random() * 1000)::int::text, 3, '0'));
  UE constant text := 'URGÊNCIA E EMERGÊNCIA ADULTO';
BEGIN
  -- Estado e unidades -------------------------------------------------------
  SELECT id INTO v_state FROM public.states ORDER BY name LIMIT 1;
  IF v_state IS NULL THEN
    INSERT INTO public.states (name, abbreviation) VALUES ('Estado Demonstração', 'DM') RETURNING id INTO v_state;
  END IF;
  UPDATE public.states SET name = 'Estado Demonstração', abbreviation = 'DM' WHERE id = v_state;

  SELECT hospital_unit_id INTO v_a FROM public.institution_branding WHERE slug = 'demo';
  IF v_a IS NULL THEN
    SELECT id INTO v_a FROM public.hospital_units ORDER BY created_at LIMIT 1;
  END IF;
  IF v_a IS NULL THEN
    INSERT INTO public.hospital_units (name, state_id, address)
    VALUES ('Hospital Demonstração', v_state, 'Av. Demonstração, 100 — Centro') RETURNING id INTO v_a;
  END IF;
  UPDATE public.hospital_units
     SET name = 'Hospital Demonstração', address = 'Av. Demonstração, 100 — Centro', state_id = v_state
   WHERE id = v_a;

  SELECT hospital_unit_id INTO v_b FROM public.institution_branding WHERE slug = 'saolucas';
  IF v_b IS NULL THEN
    INSERT INTO public.hospital_units (name, state_id, address)
    VALUES ('Hospital São Lucas', v_state, 'Rua Exemplo, 250 — Jardim Fictício') RETURNING id INTO v_b;
  END IF;
  UPDATE public.hospital_units SET name = 'Hospital São Lucas', state_id = v_state WHERE id = v_b;

  -- Limpa o que foi digitado na demonstração --------------------------------
  DELETE FROM public.patient_movements WHERE hospital_unit_id IN (v_a, v_b);
  DELETE FROM public.patient_versions  WHERE hospital_unit_id IN (v_a, v_b);
  DELETE FROM public.patient_evolutions WHERE hospital_unit_id IN (v_a, v_b);
  DELETE FROM public.conduct_history   WHERE hospital_unit_id IN (v_a, v_b);
  DELETE FROM public.shift_handovers   WHERE hospital_unit_id IN (v_a, v_b);
  DELETE FROM public.sepsis_protocols  WHERE hospital_unit_id IN (v_a, v_b);
  DELETE FROM public.bed_allocation_requests WHERE hospital_unit_id IN (v_a, v_b);
  ALTER TABLE public.patients DISABLE TRIGGER USER;
  DELETE FROM public.patients WHERE hospital_unit_id IN (v_a, v_b);
  ALTER TABLE public.patients ENABLE TRIGGER USER;
  DELETE FROM public.audit_logs WHERE hospital_unit_id IN (v_a, v_b) OR hospital_unit_id IS NULL;

  -- Marca de cada instituição ------------------------------------------------
  INSERT INTO public.institution_branding
    (hospital_unit_id, slug, abbreviation, display_name, network_name, tagline,
     primary_color, secondary_color, accent_color, footer_text)
  VALUES
    (v_a, 'demo', 'HD', 'Hospital Demonstração', 'Rede Demonstração',
     'Ambiente de demonstração — dados fictícios', NULL, NULL, NULL, NULL),
    (v_b, 'saolucas', 'HSL', 'Hospital São Lucas', 'Rede São Lucas',
     'Cuidado intensivo com precisão', '#064E3B', '#0D7A5F', '#C9A227', NULL)
  ON CONFLICT (hospital_unit_id) DO UPDATE
    SET slug = EXCLUDED.slug, abbreviation = EXCLUDED.abbreviation,
        display_name = EXCLUDED.display_name, network_name = EXCLUDED.network_name,
        tagline = EXCLUDED.tagline, primary_color = EXCLUDED.primary_color,
        secondary_color = EXCLUDED.secondary_color, accent_color = EXCLUDED.accent_color,
        platform_name = NULL, logo_url = NULL, logo_compact_url = NULL, logo_print_url = NULL,
        footer_text = NULL;

  -- Leitos contratados (R$ 25/leito) ------------------------------------------
  PERFORM public.provision_unit_beds(v_a, jsonb_build_array(
    jsonb_build_object('department', UE,    'sector', 'red',    'beds', 5),
    jsonb_build_object('department', UE,    'sector', 'yellow', 'beds', 10),
    jsonb_build_object('department', UE,    'sector', 'blue',   'beds', 6),
    jsonb_build_object('department', 'UTI', 'sector', 'blue',   'beds', 10),
    jsonb_build_object('department', 'UTI', 'sector', 'yellow', 'beds', 10)
  ), 'demo', 2990);
  PERFORM public.provision_unit_beds(v_b, jsonb_build_array(
    jsonb_build_object('department', 'UTI', 'sector', 'blue', 'beds', 10)
  ), 'demo', 2990);

  -- Usuários de demonstração ---------------------------------------------------
  PERFORM demo.ensure_user('DEMO.GESTOR', 'Coordenação — Hospital Demonstração', v_admin_pw, 'admin', v_a,
                           ARRAY[UE, 'URGÊNCIA E EMERGÊNCIA PEDIÁTRICA', 'UTI']);
  PERFORM demo.ensure_user('DEMO.UTI', 'Plantonista UTI — Demonstração', v_pw, 'medico', v_a, ARRAY['UTI']);
  PERFORM demo.ensure_user('DEMO.URG', 'Plantonista Emergência — Demonstração', v_pw, 'medico', v_a, ARRAY[UE]);
  PERFORM demo.ensure_user('SAOLUCAS.GESTOR', 'Coordenação — Hospital São Lucas', v_admin_pw, 'admin', v_b, ARRAY['UTI']);
  PERFORM demo.ensure_user('SAOLUCAS.UTI', 'Plantonista UTI — São Lucas', v_pw, 'medico', v_b, ARRAY['UTI']);

  -- Pacientes fictícios ----------------------------------------------------------
  ALTER TABLE public.patients DISABLE TRIGGER USER;

  -- Hospital Demonstração · Sala Vermelha (5)
  INSERT INTO public.patients (bed_number, name, age, sector, department, state_id, hospital_unit_id,
                               diagnoses, medical_history, pendencies, relevant_exams, admission_date, display_order, is_vacant)
  VALUES
   ('V01','ANTÔNIO EXEMPLO DE SOUZA','67 ANOS','red',UE,v_state,v_a,
    E'IAM COM SUPRA DE ST — PAREDE ANTERIOR\nKILLIP II', E'HAS\nDM2\nTABAGISMO',
    E'AGUARDA HEMODINÂMICA\nECG SERIADO 6/6H', E'TROPONINA 2.340 ng/L\nECG: SUPRA V1–V4', now() - interval '3 hours', 1, false),
   ('V02','MARIA FICTÍCIA DOS SANTOS','74 ANOS','red',UE,v_state,v_a,
    E'SEPSE DE FOCO PULMONAR\nINSUFICIÊNCIA RESPIRATÓRIA AGUDA', E'DPOC\nICC FE REDUZIDA',
    E'SOLICITADA VAGA DE UTI\nHEMOCULTURAS COLHIDAS', E'LACTATO 4,1 mmol/L\nRX: CONSOLIDAÇÃO EM BASE DIREITA', now() - interval '5 hours', 2, false),
   ('V03','JOSÉ DEMONSTRAÇÃO LIMA','58 ANOS','red',UE,v_state,v_a,
    E'AVC ISQUÊMICO — ACM ESQUERDA\nNIHSS 11', E'FA SEM ANTICOAGULAÇÃO\nHAS',
    E'TC DE CONTROLE EM 24H\nAVALIAÇÃO DA NEUROLOGIA', E'TC CRÂNIO SEM SANGRAMENTO', now() - interval '90 minutes', 3, false),
   ('V04','',NULL,'red',UE,v_state,v_a,NULL,NULL,NULL,NULL,NULL,4,true),
   ('V05','',NULL,'red',UE,v_state,v_a,NULL,NULL,NULL,NULL,NULL,5,true);

  -- Hospital Demonstração · Observação Amarela (10)
  INSERT INTO public.patients (bed_number, name, age, sector, department, state_id, hospital_unit_id,
                               diagnoses, medical_history, pendencies, admission_date, display_order, is_vacant)
  VALUES
   ('A01','FRANCISCA EXEMPLO PEREIRA','81 ANOS','yellow',UE,v_state,v_a,
    E'ITU COMPLICADA\nDELIRIUM HIPOATIVO', E'DEMÊNCIA\nHAS', E'UROCULTURA EM ANDAMENTO\nREAVALIAR DIURESE', now() - interval '14 hours', 1, false),
   ('A02','CARLOS FICTÍCIO ALMEIDA','45 ANOS','yellow',UE,v_state,v_a,
    E'PANCREATITE AGUDA LEVE', E'ETILISMO', E'USG DE ABDOME\nJEJUM + HIDRATAÇÃO', now() - interval '9 hours', 2, false),
   ('A03','LÚCIA DEMONSTRAÇÃO ROCHA','63 ANOS','yellow',UE,v_state,v_a,
    E'ICC DESCOMPENSADA — PERFIL B', E'IAM PRÉVIO\nDRC ESTÁGIO 3', E'BALANÇO HÍDRICO\nECOCARDIOGRAMA', now() - interval '20 hours', 3, false),
   ('A04','PEDRO EXEMPLO BARBOSA','29 ANOS','yellow',UE,v_state,v_a,
    E'CRISE ASMÁTICA MODERADA', E'ASMA', E'REAVALIAR APÓS 3ª NEBULIZAÇÃO', now() - interval '2 hours', 4, false),
   ('A05','RITA FICTÍCIA MOURA','70 ANOS','yellow',UE,v_state,v_a,
    E'HDA — MELENA\nANEMIA (Hb 7,2)', E'USO DE AINE\nCIRROSE CHILD A', E'EDA HOJE\n2 CH RESERVADOS', now() - interval '7 hours', 5, false),
   ('A06','',NULL,'yellow',UE,v_state,v_a,NULL,NULL,NULL,NULL,6,true),
   ('A07','',NULL,'yellow',UE,v_state,v_a,NULL,NULL,NULL,NULL,7,true),
   ('A08','',NULL,'yellow',UE,v_state,v_a,NULL,NULL,NULL,NULL,8,true),
   ('A09','',NULL,'yellow',UE,v_state,v_a,NULL,NULL,NULL,NULL,9,true),
   ('A10','',NULL,'yellow',UE,v_state,v_a,NULL,NULL,NULL,NULL,10,true);

  -- Hospital Demonstração · Observação Azul (6)
  INSERT INTO public.patients (bed_number, name, age, sector, department, state_id, hospital_unit_id,
                               diagnoses, pendencies, admission_date, display_order, is_vacant)
  VALUES
   ('Z01','JOANA EXEMPLO TEIXEIRA','34 ANOS','blue',UE,v_state,v_a, E'CÓLICA NEFRÉTICA', E'TC SEM CONTRASTE\nALTA SE ANALGESIA EFETIVA', now() - interval '4 hours', 1, false),
   ('Z02','MARCOS FICTÍCIO NUNES','52 ANOS','blue',UE,v_state,v_a, E'CELULITE EM MID', E'ATB EV — 2ª DOSE\nREAVALIAR PARA ALTA', now() - interval '11 hours', 2, false),
   ('Z03','',NULL,'blue',UE,v_state,v_a,NULL,NULL,NULL,3,true),
   ('Z04','',NULL,'blue',UE,v_state,v_a,NULL,NULL,NULL,4,true),
   ('Z05','',NULL,'blue',UE,v_state,v_a,NULL,NULL,NULL,5,true),
   ('Z06','',NULL,'blue',UE,v_state,v_a,NULL,NULL,NULL,6,true);

  -- Hospital Demonstração · UTI 1 (blue) e UTI 2 (yellow)
  INSERT INTO public.patients (bed_number, name, age, sector, department, state_id, hospital_unit_id,
                               diagnoses, medical_history, uti_admission_date, uti_admission_reason, uti_current_status,
                               uti_devices, uti_cultures_antibiotics, uti_daily_conducts, pendencies, display_order, is_vacant)
  SELECT 'U' || lpad(n::text, 2, '0'), coalesce(d.name, ''), d.age, s.sector, 'UTI', v_state, v_a,
         d.dx, d.hx, d.adm, d.reason, d.status, d.devices, d.atb, d.conducts, d.pend, n, d.name IS NULL
  FROM (VALUES ('blue'), ('yellow')) s(sector)
  CROSS JOIN generate_series(1, 10) n
  LEFT JOIN (VALUES
    ('blue', 1, 'HELENA EXEMPLO CARDOSO', '69 ANOS', E'CHOQUE SÉPTICO — FOCO ABDOMINAL\nPO DE LAPAROTOMIA', E'DM2\nHAS',
       now() - interval '3 days', 'PO IMEDIATO + CHOQUE', E'NORADRENALINA 0,12 mcg/kg/min\nVM — PSV', E'TOT D3\nCVC JUGULAR D D3\nSVD',
       E'MEROPENEM D3\nHEMOCULTURA: E. COLI', E'DESMAME DE VASOPRESSOR\nTRE AMANHÃ', E'TC DE CONTROLE'),
    ('blue', 2, 'RAIMUNDO FICTÍCIO GOMES', '77 ANOS', E'PNEUMONIA GRAVE\nSDRA MODERADA', E'DPOC',
       now() - interval '6 days', 'INSUFICIÊNCIA RESPIRATÓRIA', E'VM PROTETORA — P/F 180\nSEDAÇÃO RASS -3', E'TOT D6\nPAI RADIAL\nSNE',
       E'PIPERACILINA-TAZOBACTAM D6', E'AVALIAR PRONA\nNEGATIVAR BALANÇO', E'DISCUTIR TQT'),
    ('blue', 3, 'SEBASTIANA DEMONSTRAÇÃO REIS', '55 ANOS', E'CETOACIDOSE DIABÉTICA GRAVE', E'DM1',
       now() - interval '1 day', 'DISTÚRBIO METABÓLICO', E'INSULINA EV EM BOMBA\nSEM DVA', E'AVP',
       NULL, E'TRANSIÇÃO PARA INSULINA SC', E'ALTA PARA ENFERMARIA'),
    ('blue', 5, 'JOAQUIM EXEMPLO VIEIRA', '61 ANOS', E'PO DE REVASCULARIZAÇÃO MIOCÁRDICA', E'DAC TRIARTERIAL\nHAS',
       now() - interval '2 days', 'PO CIRURGIA CARDÍACA', E'EXTUBADO — CN 2 L/min\nDOBUTAMINA EM DESMAME', E'DRENO MEDIASTINAL\nCVC SUBCLÁVIA\nMP EPICÁRDICO',
       E'CEFUROXIMA PROFILÁTICA', E'RETIRAR DRENO SE < 100 mL/24H', E'ECO DE CONTROLE'),
    ('yellow', 1, 'TEREZA FICTÍCIA MACHADO', '48 ANOS', E'HSA — FISHER III\nPO DE CLIPAGEM', E'HAS',
       now() - interval '4 days', 'NEUROCRÍTICO', E'GLASGOW 13\nNIMODIPINO', E'DVE\nPAI',
       NULL, E'DOPPLER TRANSCRANIANO DIÁRIO', E'ANGIO-TC SE DÉFICIT NOVO'),
    ('yellow', 2, 'BENEDITO DEMONSTRAÇÃO PIRES', '72 ANOS', E'CHOQUE CARDIOGÊNICO\nIAM SEM SUPRA', E'ICC\nDRC',
       now() - interval '2 days', 'CHOQUE', E'DOBUTAMINA 5 mcg/kg/min\nVNI INTERMITENTE', E'CVC FEMORAL\nSVD',
       NULL, E'OTIMIZAR VOLEMIA\nDISCUTIR CATE', E'PARECER DA NEFROLOGIA'),
    ('yellow', 4, 'ISABEL EXEMPLO FARIAS', '39 ANOS', E'POLITRAUMA\nCONTUSÃO PULMONAR BILATERAL', NULL,
       now() - interval '5 days', 'TRAUMA', E'VM — DESMAME\nANALGESIA MULTIMODAL', E'TOT D5\nDRENO DE TÓRAX E',
       E'CEFTRIAXONA D4', E'TRE HOJE\nFISIOTERAPIA MOTORA', E'RETIRAR DRENO')
  ) AS d(sector, bed, name, age, dx, hx, adm, reason, status, devices, atb, conducts, pend)
    ON d.sector = s.sector AND d.bed = n;

  -- Hospital São Lucas · UTI (10) — instituição separada, marca própria
  INSERT INTO public.patients (bed_number, name, age, sector, department, state_id, hospital_unit_id,
                               diagnoses, uti_admission_date, uti_admission_reason, uti_current_status, display_order, is_vacant)
  SELECT 'U' || lpad(n::text, 2, '0'), coalesce(d.name, ''), d.age, 'blue', 'UTI', v_state, v_b,
         d.dx, d.adm, d.reason, d.status, n, d.name IS NULL
  FROM generate_series(1, 10) n
  LEFT JOIN (VALUES
    (1, 'OTÁVIO EXEMPLO SÃO LUCAS', '66 ANOS', E'PANCREATITE NECRO-HEMORRÁGICA', now() - interval '8 days', 'ABDOME AGUDO', E'VM\nNORADRENALINA 0,2 mcg/kg/min'),
    (2, 'CECÍLIA FICTÍCIA SÃO LUCAS', '59 ANOS', E'MENINGITE BACTERIANA', now() - interval '2 days', 'NEUROINFECÇÃO', E'GLASGOW 14\nCEFTRIAXONA D2'),
    (3, 'ALFREDO DEMONSTRAÇÃO SÃO LUCAS', '80 ANOS', E'EDEMA AGUDO DE PULMÃO', now() - interval '1 day', 'INSUFICIÊNCIA RESPIRATÓRIA', E'VNI\nNITROGLICERINA EV')
  ) AS d(bed, name, age, dx, adm, reason, status) ON d.bed = n;

  ALTER TABLE public.patients ENABLE TRIGGER USER;

  RETURN format('Demo pronta: %s (%s leitos) e %s (%s leitos).',
    'Hospital Demonstração', public.unit_configured_beds(v_a),
    'Hospital São Lucas', public.unit_configured_beds(v_b));
END;
$$;

REVOKE ALL ON FUNCTION demo.reset() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION demo.ensure_user(text, text, text, public.app_role, uuid, text[]) FROM PUBLIC, anon, authenticated;
