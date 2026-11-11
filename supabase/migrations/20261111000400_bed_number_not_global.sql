-- O número do leito (U01, V01…) se repete entre setores e entre instituições.
-- A restrição UNIQUE global em patients.bed_number vinha da primeira migração
-- e já não existe no banco de produção (foi removida fora do git); aqui a
-- remoção passa a constar no histórico, de forma idempotente.
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_bed_number_key;

CREATE INDEX IF NOT EXISTS patients_unit_department_sector_idx
  ON public.patients (hospital_unit_id, department, sector);
