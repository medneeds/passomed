/**
 * Configuração White-Label Centralizada
 *
 * Este arquivo guarda os valores PADRÃO da plataforma. Em tempo de execução,
 * a marca de cada instituição (tabela `institution_branding`) é aplicada por
 * cima deles através de `applyInstitutionBranding` — ver
 * `src/contexts/BrandingContext.tsx`. Assim uma única publicação atende
 * todas as instituições, cada uma com seu nome, logo e cores.
 *
 * Nenhum componente deve ter referências hardcoded a nomes de hospitais,
 * logos ou textos institucionais: leia sempre de `whitelabel`.
 */
import { brandCssVars, brandHexTones, DEFAULT_BRAND, isHexColor } from "@/lib/brandColors";

// ─── LOGOS ────────────────────────────────────────────────────────────────────
// Importe os assets de logo aqui. Para white-label, substitua os imports.
import platformFullLogo from "@/assets/passomed-full-logo.png";
import platformIconLogo from "@/assets/passomed-icon.png";

// ─── CONFIGURAÇÃO PRINCIPAL ──────────────────────────────────────────────────

export const whitelabel = {
  // ── Identidade da Plataforma ──
  platform: {
    /** Nome principal da plataforma (ex: "PassoMed") */
    name: "PassoMed",
    /** Versão exibida ao lado do nome */
    version: "1.0",
    /** Nome completo para documentos e títulos */
    fullName: "PassoMed 1.0",
    /** Slogan principal exibido na tela de login e loading */
    slogan: "Tecnologia que valoriza seu tempo. Inteligência que salva vidas.",
    /** Texto de carregamento */
    loadingText: "Carregando",
  },

  // ── Identidade da Rede/Instituição ──
  institution: {
    /** Nome da rede hospitalar */
    networkName: "Instituição",
    /** Nome abreviado da rede */
    networkShortName: "Instituição",
    /** Nome do hospital padrão (usado como placeholder e em documentos) */
    hospitalName: "Hospital",
    /** Alt text para o logo da rede */
    networkLogoAlt: "Logotipo da Instituição",
    /** Alt text para o logo do hospital */
    hospitalLogoAlt: "Logotipo do Hospital",
  },

  // ── Logos ──
  logos: {
    /** Logo completo da rede (usado em loading, login, impressão) */
    networkFull: platformFullLogo,
    /** Logo compacto da rede (usado na sidebar) */
    networkCompact: platformIconLogo,
    /** Logo do hospital (usado em cabeçalhos de documentos) */
    hospital: platformIconLogo,
    /** Logo da plataforma PassoMed (usado na sidebar) */
    platform: platformIconLogo,
  },

  // ── Cores do Tema (gradiente principal) ──
  theme: {
    /** Cor primária do gradiente (from) */
    gradientFrom: "#064e3b",
    /** Cor intermediária do gradiente (via) */
    gradientVia: "#0a5f44",
    /** Cor final do gradiente (to) */
    gradientTo: "#0d7a5f",
    /** Classe Tailwind do gradiente de fundo principal */
    bgGradient: "bg-gradient-to-br from-brand-deep via-brand-mid to-brand-bright",
  },

  // ── Créditos / Rodapé ──
  credits: {
    /** Nome do desenvolvedor/empresa */
    developerName: "PassoMed",
    /** Texto completo do rodapé de desenvolvimento */
    developerLabel: "Plataforma",
    /** Assinatura do autor (usada em documentos impressos) */
    authorSignature: "PassoMed",
    /** Texto curto para footer fixo */
    footerText: "PassoMed",
  },

  // ── Conformidade / Legal ──
  compliance: {
    /** Referências legais exibidas na tela de login */
    legalReferences: "Lei 13.709/2018 (LGPD) • CFM 1.821/2007",
    /** Nome do sistema em termos de consentimento */
    systemNameInTerms: "PassoMed",
    /** Texto do badge de conformidade */
    complianceBadgeTitle: "Em Conformidade",
  },

  // ── Funcionalidades da Tela de Login ──
  loginFeatures: [
    "Gestão inteligente de leitos em tempo real",
    "Visão completa do paciente em um clique",
    "Documentação clínica padronizada e auditável",
    "Conformidade LGPD e CFM 1.821/2007",
  ],

  // ── Senha do Painel Admin ──
  admin: {
    /**
     * @deprecated O painel administrativo não usa mais senha compartilhada:
     * o acesso é dado pelo papel do usuário (coordenador da unidade), checado
     * no banco. Mantido vazio só para compatibilidade de tipos.
     */
    panelPassword: "",
  },

  // ── Documentos Impressos ──
  print: {
    /** Texto do rodapé de documentos */
    documentFooter: (date: string, time: string) =>
      `Documento gerado automaticamente • ${date} às ${time}`,
    /** Texto de confidencialidade */
    confidentialityText: "Documento Confidencial",
    /** Nome do sistema para geração de documentos */
    systemLabel: "PassoMed - Sistema de Gestão Hospitalar",
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Retorna o título da página principal com nome do hospital */
export function getMainPageTitle(hospitalName?: string): string {
  return `Mapa de Pacientes - ${hospitalName || whitelabel.institution.hospitalName}`;
}

/** Retorna o título de um documento impresso */
export function getPrintTitle(sectionName: string, hospitalName?: string): string {
  return `${sectionName} - ${hospitalName || whitelabel.institution.hospitalName}`;
}

/** Retorna o texto de confidencialidade com nome do hospital */
export function getConfidentialityFooter(hospitalName?: string): string {
  return `${hospitalName || whitelabel.institution.hospitalName} • ${whitelabel.print.confidentialityText}`;
}

// ─── MARCA POR INSTITUIÇÃO (tempo de execução) ───────────────────────────────

/** Linha de `institution_branding` (ou o retorno de `get_public_branding`). */
export interface InstitutionBranding {
  hospital_unit_id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  network_name?: string | null;
  platform_name?: string | null;
  abbreviation?: string | null;
  tagline?: string | null;
  logo_url?: string | null;
  logo_compact_url?: string | null;
  logo_print_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  footer_text?: string | null;
}

const DEFAULTS = {
  platform: { ...whitelabel.platform },
  institution: { ...whitelabel.institution },
  logos: { ...whitelabel.logos },
  theme: { ...whitelabel.theme },
  credits: { ...whitelabel.credits },
  compliance: { ...whitelabel.compliance },
  print: { ...whitelabel.print },
};

/** Tons da marca em hexadecimal — para impressão/PDF, onde variável CSS não chega. */
export const brandHex = { ...brandHexTones(null) };

/** Marca atualmente aplicada (null = padrão da plataforma). */
let activeBranding: InstitutionBranding | null = null;
export const getActiveBranding = () => activeBranding;

const BRAND_VAR_NAMES = ["--brand-h", "--brand-s", "--brand-l", "--brand-s-soft", "--tint-h", "--gold"];

/**
 * Aplica (ou, com null, remove) a marca de uma instituição:
 * nomes, logos, textos e as variáveis CSS de cor.
 */
export function applyInstitutionBranding(branding: InstitutionBranding | null): void {
  activeBranding = branding;
  const b = branding ?? {};

  const platformName = b.platform_name?.trim() || DEFAULTS.platform.name;
  whitelabel.platform.name = platformName;
  whitelabel.platform.fullName = b.platform_name?.trim()
    ? platformName
    : DEFAULTS.platform.fullName;
  whitelabel.platform.slogan = b.tagline?.trim() || DEFAULTS.platform.slogan;

  const hospitalName = b.display_name?.trim() || DEFAULTS.institution.hospitalName;
  const networkName = b.network_name?.trim() || b.display_name?.trim() || DEFAULTS.institution.networkName;
  whitelabel.institution.hospitalName = hospitalName;
  whitelabel.institution.networkName = networkName;
  whitelabel.institution.networkShortName = b.abbreviation?.trim() || networkName;
  whitelabel.institution.networkLogoAlt = b.display_name ? `Logotipo — ${networkName}` : DEFAULTS.institution.networkLogoAlt;
  whitelabel.institution.hospitalLogoAlt = b.display_name ? `Logotipo — ${hospitalName}` : DEFAULTS.institution.hospitalLogoAlt;

  const fullLogo = b.logo_url || DEFAULTS.logos.networkFull;
  const compactLogo = b.logo_compact_url || b.logo_url || DEFAULTS.logos.networkCompact;
  whitelabel.logos.networkFull = fullLogo;
  whitelabel.logos.networkCompact = compactLogo;
  whitelabel.logos.hospital = b.logo_print_url || b.logo_url || DEFAULTS.logos.hospital;
  // O símbolo do produto permanece o da plataforma (assinatura discreta).
  whitelabel.logos.platform = DEFAULTS.logos.platform;

  const tones = brandHexTones(b.primary_color);
  Object.assign(brandHex, tones);
  whitelabel.theme.gradientFrom = tones.deep;
  whitelabel.theme.gradientVia = tones.mid;
  whitelabel.theme.gradientTo = tones.bright;

  whitelabel.credits.footerText = b.footer_text?.trim() || DEFAULTS.credits.footerText;
  whitelabel.compliance.systemNameInTerms = platformName;
  whitelabel.print.systemLabel = `${platformName} - Sistema de Gestão Hospitalar`;

  if (typeof document !== "undefined") {
    const root = document.documentElement;
    BRAND_VAR_NAMES.forEach((name) => root.style.removeProperty(name));
    if (isHexColor(b.primary_color) || isHexColor(b.accent_color)) {
      const vars = brandCssVars(b.primary_color, b.accent_color);
      Object.entries(vars).forEach(([name, value]) => {
        // Só grava o que difere do padrão; o restante vem do index.css.
        if (value !== (DEFAULT_BRAND.vars as unknown as Record<string, string | undefined>)[name]) {
          root.style.setProperty(name, value);
        }
      });
    }
    if (b.platform_name?.trim() || b.display_name?.trim()) {
      document.title = b.display_name?.trim()
        ? `${platformName} · ${b.display_name.trim()}`
        : platformName;
    }
  }
}
