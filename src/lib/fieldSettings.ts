/**
 * Campos do leito que a gestão de cada unidade pode ligar ou desligar.
 *
 * A configuração é por unidade e por departamento (UE Adulto, UE Pediátrica,
 * UTI, Enfermaria) e guarda só o que foi DESLIGADO: campo novo nasce visível.
 * Desligar um campo só o esconde do mapa; o que já foi registrado continua
 * guardado e volta a aparecer se o campo for religado.
 */
import { isInpatientDepartment } from "@/utils/departments";

export interface FieldOption {
  key: string;
  label: string;
  hint?: string;
  /** Campo essencial: sempre visível. */
  locked?: boolean;
}

const EMERGENCY_FIELDS: FieldOption[] = [
  { key: "diagnoses", label: "Hipóteses / Diagnósticos", locked: true },
  { key: "medicalHistory", label: "Antecedentes / Comorbidades" },
  { key: "relevantExams", label: "Exames" },
  { key: "pendencies", label: "Programações / Pendências" },
];

const INPATIENT_FIELDS: FieldOption[] = [
  { key: "diagnoses", label: "Hipóteses / Diagnósticos", locked: true },
  { key: "medicalHistory", label: "Antecedentes / Comorbidades" },
  { key: "dailyConducts", label: "Plano Terapêutico" },
  { key: "pendencies", label: "Programações / Pendências" },
  { key: "dischargePrediction", label: "Previsão de alta" },
  { key: "devices", label: "Dispositivos", hint: "Tubo, cateteres, sondas" },
  { key: "allergies", label: "Alergias" },
  { key: "cultures", label: "Culturas / ATB" },
  { key: "diet", label: "Dieta" },
  { key: "originSector", label: "Setor de origem" },
  { key: "specialties", label: "Especialidades envolvidas" },
  { key: "relevantExams", label: "Exames" },
];

export function fieldCatalog(department: string | null | undefined): FieldOption[] {
  return isInpatientDepartment(department) ? INPATIENT_FIELDS : EMERGENCY_FIELDS;
}

export type HiddenFieldsByDepartment = Record<string, string[]>;

/** Remove chaves desconhecidas ou travadas antes de salvar. */
export function sanitizeHiddenFields(department: string, hidden: string[]): string[] {
  const allowed = new Set(fieldCatalog(department).filter((f) => !f.locked).map((f) => f.key));
  return Array.from(new Set(hidden.filter((key) => allowed.has(key)))).sort();
}

export function isFieldVisible(
  settings: HiddenFieldsByDepartment,
  department: string | null | undefined,
  key: string,
): boolean {
  if (!department) return true;
  const option = fieldCatalog(department).find((f) => f.key === key);
  if (!option || option.locked) return true;
  return !(settings[department] ?? []).includes(key);
}
