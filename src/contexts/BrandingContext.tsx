import { createContext, Fragment, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { applyInstitutionBranding, InstitutionBranding } from "@/config/whitelabel";
import { remember, resolveInstitutionSlug } from "@/lib/institutionSlug";

/**
 * Marca por instituição em tempo de execução.
 *
 * - Antes do login: usa o endereço (`?i=slug` ou subdomínio) para buscar a
 *   marca pública e vestir a tela de entrada.
 * - Depois do login: usa a unidade selecionada do usuário.
 * - A última marca fica em cache local para a próxima abertura já sair certa.
 *
 * Os componentes continuam lendo `whitelabel.*`; quando a marca muda, a árvore
 * é remontada uma vez (key) para todos relerem os valores.
 */

const CACHE_KEY = "passomed.branding-cache.v1";

interface BrandingContextType {
  branding: InstitutionBranding | null;
  /** Recarrega a marca da unidade atual (após salvar no painel). */
  refreshBranding: () => Promise<void>;
  /** Aplica uma marca só para pré-visualização, sem gravar. */
  previewBranding: (branding: InstitutionBranding | null) => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

function readCache(): InstitutionBranding | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as InstitutionBranding) : null;
  } catch {
    return null;
  }
}

function writeCache(branding: InstitutionBranding | null) {
  try {
    if (branding) localStorage.setItem(CACHE_KEY, JSON.stringify(branding));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    /* sem localStorage: sem cache */
  }
}

/** Só os campos que mudam a aparência, em ordem estável, para comparar marcas. */
function fingerprint(b: InstitutionBranding | null): string {
  if (!b) return "default";
  return JSON.stringify([
    b.hospital_unit_id ?? null, b.display_name ?? null, b.network_name ?? null, b.platform_name ?? null,
    b.abbreviation ?? null, b.tagline ?? null, b.logo_url ?? null, b.logo_compact_url ?? null,
    b.logo_print_url ?? null, b.primary_color ?? null, b.secondary_color ?? null, b.accent_color ?? null,
    b.footer_text ?? null,
  ]);
}

/**
 * Chamado em main.tsx antes do primeiro render: aplica a marca em cache para
 * não piscar a marca padrão enquanto a rede responde.
 */
export function bootstrapBrandingFromCache(): void {
  const slug = resolveInstitutionSlug();
  const cached = readCache();
  // Endereço de outra instituição: o cache não vale.
  if (cached && slug && cached.slug && cached.slug !== slug) return;
  if (cached) applyInstitutionBranding(cached);
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentHospital } = useHospital();
  const [branding, setBranding] = useState<InstitutionBranding | null>(() => readCache());
  const [version, setVersion] = useState(0);
  const appliedRef = useRef(fingerprint(readCache()));

  const commit = useCallback((next: InstitutionBranding | null, persist: boolean) => {
    const fp = fingerprint(next);
    if (persist) {
      writeCache(next);
      if (next?.slug) remember(next.slug);
    }
    if (fp === appliedRef.current) return;
    appliedRef.current = fp;
    applyInstitutionBranding(next);
    setBranding(next);
    setVersion((v) => v + 1);
  }, []);

  const loadForUnit = useCallback(async (hospitalUnitId: string) => {
    const { data, error } = await db
      .from("institution_branding")
      .select("*")
      .eq("hospital_unit_id", hospitalUnitId)
      .maybeSingle();
    if (error) {
      // Falha de rede/permissão: mantém o que já está na tela.
      if (import.meta.env.DEV) console.error("[branding] falha ao carregar marca:", error);
      return;
    }
    commit((data as InstitutionBranding | null) ?? null, true);
  }, [commit]);

  // Antes do login: marca pública pelo endereço.
  useEffect(() => {
    if (user) return;
    const slug = resolveInstitutionSlug();
    if (!slug) return;
    let cancelled = false;
    db.rpc("get_public_branding", { p_slug: slug }).then(({ data, error }: { data: InstitutionBranding | null; error: unknown }) => {
      if (cancelled || error || !data) return;
      commit(data, true);
    });
    return () => { cancelled = true; };
  }, [user, commit]);

  // Depois do login: marca da unidade selecionada.
  useEffect(() => {
    if (!user || !currentHospital?.id) return;
    loadForUnit(currentHospital.id);
  }, [user, currentHospital?.id, loadForUnit]);

  const refreshBranding = useCallback(async () => {
    if (currentHospital?.id) await loadForUnit(currentHospital.id);
  }, [currentHospital?.id, loadForUnit]);

  const previewBranding = useCallback((next: InstitutionBranding | null) => {
    // Pré-visualização: muda só as cores/nomes aplicados, sem cache e sem remontar.
    applyInstitutionBranding(next);
    appliedRef.current = `preview:${fingerprint(next)}`;
  }, []);

  const value = useMemo(
    () => ({ branding, refreshBranding, previewBranding }),
    [branding, refreshBranding, previewBranding],
  );

  return (
    <BrandingContext.Provider value={value}>
      <Fragment key={version}>{children}</Fragment>
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}
