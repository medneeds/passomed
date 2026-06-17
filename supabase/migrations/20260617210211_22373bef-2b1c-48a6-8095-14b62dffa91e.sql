-- ============================================================================
-- PassoMed: Wipe completo de dados operacionais e usuários (preserva schema)
-- ============================================================================
-- Schema é mantido para que a plataforma esteja pronta para uso.
-- Apenas DADOS são removidos para começar do zero.

-- 1. Dados clínicos e operacionais
TRUNCATE TABLE
  public.patients,
  public.patient_movements,
  public.patient_evolutions,
  public.patient_versions,
  public.conduct_history,
  public.sepsis_protocols,
  public.stroke_protocols,
  public.chest_pain_protocols,
  public.death_reviews,
  public.shift_handovers,
  public.notes_reminders,
  public.transport_requests,
  public.transport_assignments,
  public.dhd_patients,
  public.medical_reports,
  public.therapeutic_templates,
  public.hospital_files,
  public.bed_allocation_requests,
  public.bed_requests,
  public.managed_beds,
  public.bed_lifecycle_events,
  public.bed_sla_configs,
  public.internment_requests,
  public.medical_codes,
  public.audit_logs,
  public.data_requests,
  public.user_consents,
  public.password_reset_requests,
  public.clinicus_access,
  public.institution_branding,
  public.data_retention_policies
RESTART IDENTITY CASCADE;

-- 2. Estados e Unidades (cascade limpa user_hospital_assignments / user_departments)
TRUNCATE TABLE public.hospital_units RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.states RESTART IDENTITY CASCADE;

-- 3. Usuários: deletar todos de auth.users (cascade limpa profiles/user_roles/etc.)
DELETE FROM auth.users;
