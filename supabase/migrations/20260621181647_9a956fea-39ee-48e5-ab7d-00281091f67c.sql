
-- Fix: restrict INSERT on bed_lifecycle_events and shift_handovers to user's hospital unit
DROP POLICY IF EXISTS "Auth users can create bed lifecycle events" ON public.bed_lifecycle_events;
CREATE POLICY "Auth users can create bed lifecycle events"
ON public.bed_lifecycle_events
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = registered_by
  AND hospital_unit_id IS NOT NULL
  AND public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id)
);

DROP POLICY IF EXISTS "Usuários autenticados podem criar passagens" ON public.shift_handovers;
CREATE POLICY "Usuários autenticados podem criar passagens"
ON public.shift_handovers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND hospital_unit_id IS NOT NULL
  AND public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id)
);
