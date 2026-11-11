/**
 * Matemática de cor da marca.
 *
 * A interface inteira é pintada a partir de poucas variáveis CSS
 * (`--brand-h`, `--brand-s`, `--brand-l`, `--brand-s-soft`, `--tint-h` e,
 * opcionalmente, `--gold`). Este módulo converte a cor escolhida pela
 * instituição nessas variáveis, sempre garantindo contraste de leitura.
 *
 * As cores de setor (vermelha, amarela, azul) e de alerta NÃO passam por aqui:
 * são semântica clínica e ficam iguais em qualquer instituição.
 */

export interface Hsl {
  h: number; // 0–360
  s: number; // 0–100
  l: number; // 0–100
}

export interface BrandCssVars {
  "--brand-h": string;
  "--brand-s": string;
  "--brand-l": string;
  "--brand-s-soft": string;
  "--tint-h": string;
  "--gold"?: string;
}

/** Padrão PassoMed (esmeralda). Deve espelhar os valores de `:root` no index.css. */
export const DEFAULT_BRAND = {
  primary: "#064e3b",
  mid: "#0a5f44",
  bright: "#0d7a5f",
  vars: {
    "--brand-h": "160",
    "--brand-s": "84%",
    "--brand-l": "16%",
    "--brand-s-soft": "70%",
    "--tint-h": "150",
  } as BrandCssVars,
};

const HEX_RE = /^#?([0-9a-f]{6})$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value.trim());
}

export function normalizeHex(value: string): string {
  const match = HEX_RE.exec(value.trim());
  if (!match) throw new Error(`Cor inválida: ${value}`);
  return `#${match[1].toLowerCase()}`;
}

export function hexToHsl(hex: string): Hsl {
  const clean = normalizeHex(hex).slice(1);
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h) % 360, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const sat = Math.min(100, Math.max(0, s)) / 100;
  const lig = Math.min(100, Math.max(0, l)) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Cor primária "de trabalho": mesmo matiz da marca, mas com luminosidade e
 * saturação limitadas para o texto branco por cima continuar legível
 * (a primária original do PassoMed tem L = 16%).
 */
export function workingPrimary(primaryHex: string): Hsl {
  const { h, s, l } = hexToHsl(primaryHex);
  const sat = clamp(s, 30, 90);
  let lig = clamp(l, 12, 30);
  // Amarelos, verdes-limão e cianos são claros mesmo com L baixo: escurece até
  // o tom mais claro do gradiente (L + 10) passar em AA (4,5:1) com branco.
  while (lig > 6 && contrastRatio(hslToHex({ h, s: sat, l: lig + BRIGHT_STEP }), "#ffffff") < 4.5) {
    lig -= 1;
  }
  return { h, s: sat, l: lig };
}

/** Quanto o tom "bright" é mais claro que a primária (espelha --brand-bright no CSS). */
const BRIGHT_STEP = 10;

/** Variáveis CSS para a cor primária (e, se houver, a cor de destaque). */
export function brandCssVars(primaryHex?: string | null, accentHex?: string | null): BrandCssVars {
  if (!isHexColor(primaryHex)) {
    return isHexColor(accentHex)
      ? { ...DEFAULT_BRAND.vars, "--gold": hslTriplet(accentTone(accentHex)) }
      : { ...DEFAULT_BRAND.vars };
  }
  const p = workingPrimary(primaryHex);
  const vars: BrandCssVars = {
    "--brand-h": String(p.h),
    "--brand-s": `${p.s}%`,
    "--brand-l": `${p.l}%`,
    "--brand-s-soft": `${Math.min(p.s, 70)}%`,
    // Neutros (fundo, bordas) levemente tingidos com o matiz da marca.
    "--tint-h": String(p.h),
  };
  if (isHexColor(accentHex)) vars["--gold"] = hslTriplet(accentTone(accentHex));
  return vars;
}

/** Destaque (selos, divisores): mantém o matiz, limita para não brigar com o fundo. */
function accentTone(accentHex: string): Hsl {
  const { h, s, l } = hexToHsl(accentHex);
  return { h, s: clamp(s, 35, 80), l: clamp(l, 38, 58) };
}

function hslTriplet({ h, s, l }: Hsl): string {
  return `${h} ${s}% ${l}%`;
}

/**
 * Tons em hexadecimal para lugares onde variável CSS não chega
 * (janelas de impressão, PDFs, e-mails).
 */
export function brandHexTones(primaryHex?: string | null): { deep: string; mid: string; bright: string } {
  if (!isHexColor(primaryHex)) {
    return { deep: DEFAULT_BRAND.primary, mid: DEFAULT_BRAND.mid, bright: DEFAULT_BRAND.bright };
  }
  const p = workingPrimary(primaryHex);
  return {
    deep: hslToHex(p),
    mid: hslToHex({ ...p, l: p.l + BRIGHT_STEP / 2 }),
    bright: hslToHex({ ...p, l: p.l + BRIGHT_STEP }),
  };
}

/** Razão de contraste WCAG entre duas cores hexadecimais. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lum = (hex: string) => {
    const c = normalizeHex(hex).slice(1);
    const channel = (i: number) => {
      const v = parseInt(c.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  };
  const a = lum(hexA);
  const b = lum(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
