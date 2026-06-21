
-- 1) Remove NULL bypass in hospital unit access check
CREATE OR REPLACE FUNCTION public.user_can_access_hospital_unit(_user_id uuid, _hospital_unit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    _user_id IS NOT NULL
    AND _hospital_unit_id IS NOT NULL
    AND (
      public.has_role(_user_id, 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.user_hospital_assignments uha
        WHERE uha.user_id = _user_id
          AND uha.hospital_unit_id = _hospital_unit_id
      )
    )
$$;

-- 2) Tighten INSERT policies that lacked hospital_unit_id scope
DROP POLICY IF EXISTS "Auth can create bed requests" ON public.bed_requests;
CREATE POLICY "Auth can create bed requests"
ON public.bed_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = requested_by
  AND hospital_unit_id IS NOT NULL
  AND public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id)
);

DROP POLICY IF EXISTS "Usuários autenticados podem criar solicitações" ON public.bed_allocation_requests;
CREATE POLICY "Usuários autenticados podem criar solicitações"
ON public.bed_allocation_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = requested_by
  AND hospital_unit_id IS NOT NULL
  AND public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id)
);

-- 3) Move sensitive policies from {public} to {authenticated}
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND 'public' = ANY(roles)
      AND tablename IN (
        'profiles','user_roles','user_departments','user_hospital_assignments',
        'managed_beds','bed_lifecycle_events','patient_movements','patient_versions',
        'dhd_patients','bed_requests','transport_requests','shift_handovers',
        'bed_allocation_requests','patients','notes_reminders','conduct_history',
        'chest_pain_protocols','sepsis_protocols','stroke_protocols',
        'internment_requests','death_reviews','patient_evolutions','medical_reports',
        'medical_codes','therapeutic_templates','transport_assignments',
        'user_consents','data_requests','password_reset_requests','audit_logs',
        'hospital_files','bed_sla_configs','clinicus_access','data_retention_policies'
      )
  LOOP
    EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 4) Revoke EXECUTE on internal/admin SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.setup_medicouti_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.setup_medicoporta_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.setup_visitante_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_password(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_auth_user_id_by_email(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_trigger_function() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_fixed_urgencia_beds() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_fixed_uti_beds() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Keep RLS helper functions executable by authenticated (used inside policies)
-- has_role and user_can_access_hospital_unit must remain callable by authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_can_access_hospital_unit(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_hospital_unit(uuid, uuid) TO authenticated;
