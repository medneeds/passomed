
-- bed_allocation_requests
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar solicitações do mesmo" ON public.bed_allocation_requests;
DROP POLICY IF EXISTS "Admins e médicos podem atualizar solicitações" ON public.bed_allocation_requests;
CREATE POLICY "Membros da unidade veem solicitações de alocação"
  ON public.bed_allocation_requests FOR SELECT
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));
CREATE POLICY "Membros da unidade atualizam solicitações de alocação"
  ON public.bed_allocation_requests FOR UPDATE
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id))
  WITH CHECK (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

-- bed_lifecycle_events
DROP POLICY IF EXISTS "Auth users can view bed lifecycle events" ON public.bed_lifecycle_events;
CREATE POLICY "Members view bed lifecycle events"
  ON public.bed_lifecycle_events FOR SELECT
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

-- bed_requests
DROP POLICY IF EXISTS "Auth can view bed requests" ON public.bed_requests;
DROP POLICY IF EXISTS "Auth can update bed requests" ON public.bed_requests;
CREATE POLICY "Members view bed requests" ON public.bed_requests FOR SELECT
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));
CREATE POLICY "Members update bed requests" ON public.bed_requests FOR UPDATE
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id))
  WITH CHECK (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

-- dhd_patients
DROP POLICY IF EXISTS "Authenticated users can view DHD patients" ON public.dhd_patients;
DROP POLICY IF EXISTS "Authenticated users can update DHD patients" ON public.dhd_patients;
DROP POLICY IF EXISTS "Authenticated users can delete DHD patients" ON public.dhd_patients;
CREATE POLICY "Members view DHD patients" ON public.dhd_patients FOR SELECT
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));
CREATE POLICY "Members update DHD patients" ON public.dhd_patients FOR UPDATE
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id))
  WITH CHECK (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));
CREATE POLICY "Members delete DHD patients" ON public.dhd_patients FOR DELETE
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

-- managed_beds
DROP POLICY IF EXISTS "Auth can view managed beds" ON public.managed_beds;
DROP POLICY IF EXISTS "Auth can update bed status" ON public.managed_beds;
CREATE POLICY "Members view managed beds" ON public.managed_beds FOR SELECT
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));
CREATE POLICY "Members update managed beds" ON public.managed_beds FOR UPDATE
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id))
  WITH CHECK (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

-- medical_reports
DROP POLICY IF EXISTS "Authenticated users can view medical reports" ON public.medical_reports;
CREATE POLICY "Members view medical reports" ON public.medical_reports FOR SELECT
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

-- password_reset_requests
DROP POLICY IF EXISTS "Usuários autenticados podem solicitar reset" ON public.password_reset_requests;
CREATE POLICY "Usuários solicitam reset apenas para si"
  ON public.password_reset_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- patient_evolutions
DROP POLICY IF EXISTS "Authenticated users can view evolutions" ON public.patient_evolutions;
CREATE POLICY "Members view evolutions" ON public.patient_evolutions FOR SELECT
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

-- patient_movements
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar movimentações" ON public.patient_movements;
CREATE POLICY "Membros veem movimentações da unidade" ON public.patient_movements FOR SELECT
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

-- patient_versions
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar versões" ON public.patient_versions;
CREATE POLICY "Membros veem versões de pacientes da unidade" ON public.patient_versions FOR SELECT
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

-- patients
DROP POLICY IF EXISTS "Médicos podem criar pacientes" ON public.patients;
DROP POLICY IF EXISTS "Médicos podem atualizar pacientes" ON public.patients;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar pacientes" ON public.patients;
CREATE POLICY "Membros criam pacientes na própria unidade"
  ON public.patients FOR INSERT
  WITH CHECK (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));
CREATE POLICY "Membros atualizam pacientes da própria unidade"
  ON public.patients FOR UPDATE
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id))
  WITH CHECK (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));
CREATE POLICY "Membros deletam pacientes da própria unidade"
  ON public.patients FOR DELETE
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

-- shift_handovers
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar passagens" ON public.shift_handovers;
CREATE POLICY "Membros veem passagens da unidade" ON public.shift_handovers FOR SELECT
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

-- transport_requests
DROP POLICY IF EXISTS "Auth users can view transport requests" ON public.transport_requests;
DROP POLICY IF EXISTS "Auth users can update transport requests" ON public.transport_requests;
CREATE POLICY "Members view transport requests" ON public.transport_requests FOR SELECT
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));
CREATE POLICY "Members update transport requests" ON public.transport_requests FOR UPDATE
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id))
  WITH CHECK (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

-- transport_assignments (scope via parent request)
DROP POLICY IF EXISTS "Auth view transport" ON public.transport_assignments;
DROP POLICY IF EXISTS "Auth update transport" ON public.transport_assignments;
DROP POLICY IF EXISTS "Auth create transport" ON public.transport_assignments;
CREATE POLICY "Members view transport assignments" ON public.transport_assignments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.transport_requests tr
    WHERE tr.id = transport_assignments.request_id
      AND public.user_can_access_hospital_unit(auth.uid(), tr.hospital_unit_id)
  ));
CREATE POLICY "Members create transport assignments" ON public.transport_assignments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.transport_requests tr
    WHERE tr.id = request_id
      AND public.user_can_access_hospital_unit(auth.uid(), tr.hospital_unit_id)
  ));
CREATE POLICY "Members update transport assignments" ON public.transport_assignments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.transport_requests tr
    WHERE tr.id = transport_assignments.request_id
      AND public.user_can_access_hospital_unit(auth.uid(), tr.hospital_unit_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.transport_requests tr
    WHERE tr.id = request_id
      AND public.user_can_access_hospital_unit(auth.uid(), tr.hospital_unit_id)
  ));
