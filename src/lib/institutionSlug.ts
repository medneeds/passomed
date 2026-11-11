/**
 * Descobre de qual instituição é o endereço aberto, ANTES do login, para a
 * tela de entrada já sair com a marca certa.
 *
 * Ordem: parâmetro `?i=slug` → subdomínio (slug.dominio-base) → slug usado
 * nesta aba. A lembrança vale só para a aba (sessionStorage): abrir o endereço
 * puro de novo mostra a marca padrão da plataforma, e não a do último hospital
 * visitado.
 */
const STORAGE_KEY = "passomed.institution-slug";
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
const RESERVED = new Set(["www", "app", "api", "admin", "login", "painel", "staging", "homolog"]);

export function isValidSlug(value: string | null | undefined): value is string {
  return !!value && SLUG_RE.test(value);
}

export function slugFromHostname(hostname: string, baseDomain?: string | null): string | null {
  const base = (baseDomain || "").trim().toLowerCase().replace(/^\./, "");
  const host = hostname.toLowerCase();
  if (!base || host === base || !host.endsWith(`.${base}`)) return null;
  const label = host.slice(0, -(base.length + 1));
  if (label.includes(".") || RESERVED.has(label) || !isValidSlug(label)) return null;
  return label;
}

export function resolveInstitutionSlug(
  location: Pick<Location, "search" | "hostname"> = window.location,
  baseDomain: string | undefined = import.meta.env.VITE_BASE_DOMAIN,
): string | null {
  const fromQuery = new URLSearchParams(location.search).get("i")?.trim().toLowerCase();
  if (isValidSlug(fromQuery)) {
    remember(fromQuery);
    return fromQuery;
  }
  const fromHost = slugFromHostname(location.hostname, baseDomain);
  if (fromHost) return fromHost;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return isValidSlug(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function remember(slug: string | null): void {
  try {
    if (slug && isValidSlug(slug)) sessionStorage.setItem(STORAGE_KEY, slug);
    else sessionStorage.removeItem(STORAGE_KEY);
    // versões anteriores guardavam no localStorage; limpa o resíduo
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* navegador sem armazenamento: segue sem lembrar */
  }
}
