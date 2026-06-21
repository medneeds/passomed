
DO $$
DECLARE
  v_uti_id uuid;
  v_urg_id uuid;
  v_hospital RECORD;
BEGIN
  -- ============ DEMO.UTI ============
  SELECT id INTO v_uti_id FROM auth.users WHERE email = 'demo.uti@sistema.local';
  IF v_uti_id IS NULL THEN
    v_uti_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, raw_app_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_uti_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'demo.uti@sistema.local',
      extensions.crypt('UTI001', extensions.gen_salt('bf')),
      now(),
      jsonb_build_object('username','DEMO.UTI','full_name','Demonstração UTI'),
      '{"provider":"email","providers":["email"]}'::jsonb,
      now(), now(), '', '', '', ''
    );
  ELSE
    UPDATE auth.users
       SET encrypted_password = extensions.crypt('UTI001', extensions.gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = v_uti_id;
  END IF;

  INSERT INTO public.profiles (id, full_name, email, status)
  VALUES (v_uti_id, 'Demonstração UTI', NULL, 'approved')
  ON CONFLICT (id) DO UPDATE SET status = 'approved', full_name = 'Demonstração UTI';

  DELETE FROM public.user_roles WHERE user_id = v_uti_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uti_id, 'medico');

  DELETE FROM public.user_departments WHERE user_id = v_uti_id;
  INSERT INTO public.user_departments (user_id, department) VALUES (v_uti_id, 'UTI');

  -- ============ DEMO.URG ============
  SELECT id INTO v_urg_id FROM auth.users WHERE email = 'demo.urg@sistema.local';
  IF v_urg_id IS NULL THEN
    v_urg_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, raw_app_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_urg_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'demo.urg@sistema.local',
      extensions.crypt('URG001', extensions.gen_salt('bf')),
      now(),
      jsonb_build_object('username','DEMO.URG','full_name','Demonstração Urgência'),
      '{"provider":"email","providers":["email"]}'::jsonb,
      now(), now(), '', '', '', ''
    );
  ELSE
    UPDATE auth.users
       SET encrypted_password = extensions.crypt('URG001', extensions.gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = v_urg_id;
  END IF;

  INSERT INTO public.profiles (id, full_name, email, status)
  VALUES (v_urg_id, 'Demonstração Urgência', NULL, 'approved')
  ON CONFLICT (id) DO UPDATE SET status = 'approved', full_name = 'Demonstração Urgência';

  DELETE FROM public.user_roles WHERE user_id = v_urg_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_urg_id, 'medico');

  DELETE FROM public.user_departments WHERE user_id = v_urg_id;
  INSERT INTO public.user_departments (user_id, department) VALUES (v_urg_id, 'URGÊNCIA E EMERGÊNCIA ADULTO');

  -- ============ Hospital assignments (todas as unidades existentes) ============
  FOR v_hospital IN SELECT id FROM public.hospital_units LOOP
    INSERT INTO public.user_hospital_assignments (user_id, hospital_unit_id)
    VALUES (v_uti_id, v_hospital.id)
    ON CONFLICT DO NOTHING;
    INSERT INTO public.user_hospital_assignments (user_id, hospital_unit_id)
    VALUES (v_urg_id, v_hospital.id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
