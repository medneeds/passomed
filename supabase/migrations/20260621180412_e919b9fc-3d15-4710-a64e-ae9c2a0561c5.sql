
-- patient_versions: exigir pertencimento à unidade ao inserir snapshot clínico.
DROP POLICY IF EXISTS "Usuários autenticados podem criar versões" ON public.patient_versions;
CREATE POLICY "Usuários autenticados podem criar versões"
  ON public.patient_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id)
  );

-- sepsis_protocols: remover policy ampla; manter as policies específicas já existentes
-- ("Usuários podem atualizar próprios protocolos" e a policy de visão por unidade).
DROP POLICY IF EXISTS "Profissionais podem atualizar protocolos de sepse" ON public.sepsis_protocols;
