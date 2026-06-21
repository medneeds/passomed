
-- Reforça INSERT em 3 tabelas para exigir que o usuário pertença à unidade hospitalar de destino.

-- dhd_patients
DROP POLICY IF EXISTS "Authenticated users can create DHD patients" ON public.dhd_patients;
CREATE POLICY "Authenticated users can create DHD patients"
  ON public.dhd_patients FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id)
  );

-- medical_reports
DROP POLICY IF EXISTS "Authenticated users can create medical reports" ON public.medical_reports;
CREATE POLICY "Authenticated users can create medical reports"
  ON public.medical_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id)
  );

-- patient_movements
DROP POLICY IF EXISTS "Usuários autenticados podem criar movimentações" ON public.patient_movements;
CREATE POLICY "Usuários autenticados podem criar movimentações"
  ON public.patient_movements FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id)
  );
