-- patients.clinical_status existe no banco de produção e é lido/gravado pelo
-- front (usePatients), mas nunca teve migração no git. Idempotente.
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS clinical_status text;
