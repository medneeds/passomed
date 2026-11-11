/**
 * Setores de internação que usam o mesmo formato de mapa: leitos fixos em até
 * duas unidades (1 e 2), com o cartão completo do paciente.
 * A enfermaria reaproveita o fluxo da UTI, adaptado nos nomes.
 */
export const WARD_DEPARTMENT = "ENFERMARIA";

export function isWardDepartment(department: string | null | undefined): boolean {
  return department === WARD_DEPARTMENT;
}

/** UTI ou enfermaria: departamentos no formato de internação. */
export function isInpatientDepartment(department: string | null | undefined): boolean {
  return department === "UTI" || department === WARD_DEPARTMENT;
}

/** "UTI" ou "Enfermaria". */
export function inpatientNoun(department: string | null | undefined): string {
  return isWardDepartment(department) ? "Enfermaria" : "UTI";
}

/** "Unidade de Terapia Intensiva" ou "Enfermaria". */
export function inpatientLongName(department: string | null | undefined): string {
  return isWardDepartment(department) ? "Enfermaria" : "Unidade de Terapia Intensiva";
}

/**
 * Rótulo da unidade. Internamente as duas unidades continuam se chamando
 * "UTI 1" e "UTI 2"; na tela da enfermaria viram "Enfermaria 1" e "Enfermaria 2".
 */
export function inpatientUnitLabel(department: string | null | undefined, unit: string): string {
  return isWardDepartment(department) ? unit.replace(/^UTI/, "Enfermaria") : unit;
}

/** Rótulo do setor (blue = unidade 1, yellow = unidade 2). */
export function inpatientSectorLabel(department: string | null | undefined, sector: string): string {
  return inpatientUnitLabel(department, sector === "yellow" ? "UTI 2" : "UTI 1");
}
