
-- Seed fictional state, hospital unit, and an admin (COORDENADOR) user for exploring PassoMed

DO $$
DECLARE
  v_state_id uuid;
  v_unit_id uuid;
  v_user_id uuid := gen_random_uuid();
  v_email text := 'coordenador@sistema.local';
  v_password text := 'ADMIN1';
BEGIN
  -- State
  INSERT INTO public.states (name, abbreviation)
  VALUES ('Estado Demonstração', 'DM')
  RETURNING id INTO v_state_id;

  -- Hospital unit
  INSERT INTO public.hospital_units (name, state_id, address)
  VALUES ('Hospital PassoMed Demo', v_state_id, 'Av. Demonstração, 100 - Centro')
  RETURNING id INTO v_unit_id;

  -- Create admin auth user only if it doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(),
      jsonb_build_object('provider','email','providers', jsonb_build_array('email')),
      jsonb_build_object('username','COORDENADOR','full_name','Administrador Demo'),
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_user_id, v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email', now(), now(), now()
    );

    -- Assign admin to the demo unit
    INSERT INTO public.user_hospital_assignments (user_id, hospital_unit_id)
    VALUES (v_user_id, v_unit_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
