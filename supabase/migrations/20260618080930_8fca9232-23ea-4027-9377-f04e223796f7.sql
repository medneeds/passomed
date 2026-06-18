-- Harden audit_logs: audit trail is generated only by trusted triggers/functions, not direct client inserts.
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated sessions can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can only insert own audit logs" ON public.audit_logs;
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- Scope conduct history to the authenticated user's assigned hospital unit.
DROP POLICY IF EXISTS "Authenticated users can view conduct history" ON public.conduct_history;
DROP POLICY IF EXISTS "Authenticated users can insert conduct history" ON public.conduct_history;

CREATE POLICY "Hospital members can view conduct history"
  ON public.conduct_history
  FOR SELECT
  TO authenticated
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

CREATE POLICY "Hospital members can insert conduct history"
  ON public.conduct_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id)
    AND (changed_by IS NULL OR changed_by = auth.uid())
  );

-- Scope death review records to the authenticated user's assigned hospital unit.
DROP POLICY IF EXISTS "Auth users can view death reviews" ON public.death_reviews;
DROP POLICY IF EXISTS "Auth users can update death reviews" ON public.death_reviews;
DROP POLICY IF EXISTS "Auth users can create death reviews" ON public.death_reviews;

CREATE POLICY "Hospital members can view death reviews"
  ON public.death_reviews
  FOR SELECT
  TO authenticated
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));

CREATE POLICY "Hospital members can create death reviews"
  ON public.death_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id)
    AND (created_by IS NULL OR created_by = auth.uid())
  );

CREATE POLICY "Hospital members can update death reviews"
  ON public.death_reviews
  FOR UPDATE
  TO authenticated
  USING (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id))
  WITH CHECK (public.user_can_access_hospital_unit(auth.uid(), hospital_unit_id));