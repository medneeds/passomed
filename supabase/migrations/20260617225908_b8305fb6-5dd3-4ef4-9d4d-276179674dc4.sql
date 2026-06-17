
-- Helper: checa se o usuário tem acesso à unidade hospitalar (admins sempre)
CREATE OR REPLACE FUNCTION public.user_can_access_hospital_unit(_user_id uuid, _hospital_unit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _user_id IS NOT NULL
    AND (
      _hospital_unit_id IS NULL
      OR public.has_role(_user_id, 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.user_hospital_assignments uha
        WHERE uha.user_id = _user_id
          AND uha.hospital_unit_id = _hospital_unit_id
      )
    )
$$;

REVOKE EXECUTE ON FUNCTION public.user_can_access_hospital_unit(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_can_access_hospital_unit(uuid, uuid) TO authenticated, service_role;

-- ============================================================
-- patients: SELECT restrito por unidade
-- ============================================================
DROP POLICY IF EXISTS "Médicos podem visualizar todos os pacientes" ON public.patients;
CREATE POLICY "Usuários veem pacientes da própria unidade"
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

-- ============================================================
-- chest_pain_protocols: SELECT/UPDATE restritos por unidade
-- ============================================================
DROP POLICY IF EXISTS "Auth users can view chest pain protocols" ON public.chest_pain_protocols;
CREATE POLICY "Usuários veem protocolos de dor torácica da própria unidade"
  ON public.chest_pain_protocols
  FOR SELECT
  TO authenticated
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

DROP POLICY IF EXISTS "Auth users can update chest pain protocols" ON public.chest_pain_protocols;
CREATE POLICY "Usuários atualizam protocolos de dor torácica da própria unidade"
  ON public.chest_pain_protocols
  FOR UPDATE
  TO authenticated
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id))
  WITH CHECK (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

-- ============================================================
-- sepsis_protocols: SELECT restrito por unidade
-- ============================================================
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar protocolos" ON public.sepsis_protocols;
CREATE POLICY "Usuários veem protocolos de sepse da própria unidade"
  ON public.sepsis_protocols
  FOR SELECT
  TO authenticated
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

-- ============================================================
-- stroke_protocols: SELECT/UPDATE restritos por unidade
-- ============================================================
DROP POLICY IF EXISTS "Auth users can view stroke protocols" ON public.stroke_protocols;
CREATE POLICY "Usuários veem protocolos de AVC da própria unidade"
  ON public.stroke_protocols
  FOR SELECT
  TO authenticated
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

DROP POLICY IF EXISTS "Auth users can update stroke protocols" ON public.stroke_protocols;
CREATE POLICY "Usuários atualizam protocolos de AVC da própria unidade"
  ON public.stroke_protocols
  FOR UPDATE
  TO authenticated
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id))
  WITH CHECK (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

-- ============================================================
-- password_reset_requests: remove INSERT anônimo
-- ============================================================
DROP POLICY IF EXISTS "Anon can request password reset without user_id" ON public.password_reset_requests;
CREATE POLICY "Usuários autenticados podem solicitar reset"
  ON public.password_reset_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Garante que anon não consiga mais inserir/ler nesta tabela
REVOKE INSERT, SELECT, UPDATE, DELETE ON public.password_reset_requests FROM anon;
