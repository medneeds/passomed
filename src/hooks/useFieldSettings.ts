import { useCallback, useEffect, useSyncExternalStore } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useHospital } from "@/contexts/HospitalContext";
import { useAuth } from "@/contexts/AuthContext";
import { HiddenFieldsByDepartment, isFieldVisible, sanitizeHiddenFields } from "@/lib/fieldSettings";

/**
 * Configuração de campos da unidade selecionada. Fica num armazenamento único
 * do módulo: cada cartão de leito lê daqui, e a busca ao banco acontece uma vez
 * por unidade (não uma por cartão).
 */
let loadedUnitId: string | null = null;
let loadingUnitId: string | null = null;
let settings: HiddenFieldsByDepartment = {};
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => settings;

async function load(unitId: string, force = false) {
  if (!force && (loadedUnitId === unitId || loadingUnitId === unitId)) return;
  loadingUnitId = unitId;
  const { data, error } = await db
    .from("unit_field_settings")
    .select("department, hidden_fields")
    .eq("hospital_unit_id", unitId);
  if (loadingUnitId !== unitId) return; // a unidade mudou no meio do caminho
  loadingUnitId = null;
  if (error) {
    // Falha de rede/permissão: mantém tudo visível em vez de esconder dados.
    if (import.meta.env.DEV) console.error("[fieldSettings]", error);
    return;
  }
  const next: HiddenFieldsByDepartment = {};
  for (const row of (data ?? []) as { department: string; hidden_fields: string[] | null }[]) {
    next[row.department] = row.hidden_fields ?? [];
  }
  loadedUnitId = unitId;
  settings = next;
  emit();
}

export function useFieldSettings() {
  const { currentHospital } = useHospital();
  const { user } = useAuth();
  const unitId = currentHospital?.id ?? null;
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!unitId) return;
    if (loadedUnitId && loadedUnitId !== unitId) {
      // trocou de unidade: não mostra a configuração da anterior
      loadedUnitId = null;
      settings = {};
      emit();
    }
    load(unitId);
  }, [unitId]);

  const showField = useCallback(
    (department: string | null | undefined, key: string) => isFieldVisible(current, department, key),
    [current],
  );

  const saveHiddenFields = useCallback(
    async (department: string, hidden: string[]) => {
      if (!unitId) return { error: "Unidade ainda não carregada." };
      const clean = sanitizeHiddenFields(department, hidden);
      const { error } = await db.from("unit_field_settings").upsert(
        { hospital_unit_id: unitId, department, hidden_fields: clean, updated_by: user?.id ?? null },
        { onConflict: "hospital_unit_id,department" },
      );
      if (error) return { error: error.message as string };
      settings = { ...settings, [department]: clean };
      loadedUnitId = unitId;
      emit();
      return { error: null };
    },
    [unitId, user?.id],
  );

  return { hiddenByDepartment: current, showField, saveHiddenFields };
}
