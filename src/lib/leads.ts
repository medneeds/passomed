/** Cadastro de interesse da landing: opções, validação e rótulos do funil. */

export const LEAD_SECTORS = [
  { key: "emergencia", label: "Emergência" },
  { key: "uti", label: "UTI" },
  { key: "enfermaria", label: "Enfermaria" },
] as const;
export type LeadSector = (typeof LEAD_SECTORS)[number]["key"];

export const LEAD_CYCLES = [
  { key: "annual", label: "Anual", hint: "10 mensalidades, implantação isenta" },
  { key: "monthly", label: "Mensal", hint: "Sem fidelidade" },
  { key: "undecided", label: "Ainda não sei", hint: "Quero entender melhor" },
] as const;
export type LeadCycle = (typeof LEAD_CYCLES)[number]["key"];

export const LEAD_STATUSES = [
  { key: "new", label: "Novo" },
  { key: "contacted", label: "Em contato" },
  { key: "demo_scheduled", label: "Demonstração marcada" },
  { key: "proposal", label: "Proposta enviada" },
  { key: "won", label: "Fechado" },
  { key: "lost", label: "Perdido" },
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number]["key"];

export interface LeadFormValues {
  institutionName: string;
  contactName: string;
  contactRole: string;
  email: string;
  whatsapp: string;
  cityState: string;
  sectors: LeadSector[];
  bedsEstimate: string;
  billingCycle: LeadCycle;
  message: string;
}

export const EMPTY_LEAD: LeadFormValues = {
  institutionName: "",
  contactName: "",
  contactRole: "",
  email: "",
  whatsapp: "",
  cityState: "",
  sectors: [],
  bedsEstimate: "",
  billingCycle: "undecided",
  message: "",
};

export const onlyDigits = (value: string) => value.replace(/\D/g, "");

/** (98) 98165-9576 enquanto digita. */
export function formatPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export type LeadErrors = Partial<Record<keyof LeadFormValues, string>>;

export function validateLead(values: LeadFormValues): LeadErrors {
  const errors: LeadErrors = {};
  if (values.institutionName.trim().length < 2) errors.institutionName = "Informe o nome da instituição.";
  if (values.contactName.trim().length < 2) errors.contactName = "Informe o nome do responsável.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(values.email.trim())) errors.email = "Informe um e-mail válido, como nome@hospital.com.br.";
  const phone = onlyDigits(values.whatsapp);
  if (phone.length < 10 || phone.length > 11) errors.whatsapp = "Informe o WhatsApp com DDD, como (98) 98165-9576.";
  if (values.sectors.length === 0) errors.sectors = "Marque pelo menos um setor.";
  if (values.bedsEstimate.trim()) {
    const beds = Number(values.bedsEstimate);
    if (!Number.isInteger(beds) || beds < 1 || beds > 2000) errors.bedsEstimate = "Informe um número de leitos entre 1 e 2000.";
  }
  return errors;
}

const SERVER_ERRORS: Record<string, string> = {
  institution: "Confira o nome da instituição.",
  contact: "Confira o nome do responsável.",
  email: "Confira o e-mail informado.",
  whatsapp: "Confira o WhatsApp informado.",
  rate_limit: "Já recebemos o seu cadastro. Se precisar, fale com a gente pelo WhatsApp.",
  busy: "Estamos recebendo muitos cadastros agora. Tente de novo em alguns minutos ou chame no WhatsApp.",
};
export const leadServerError = (code: string | undefined) =>
  SERVER_ERRORS[code ?? ""] ?? "Não foi possível enviar agora. Tente de novo ou chame no WhatsApp.";

export const sectorLabel = (key: string) => LEAD_SECTORS.find((s) => s.key === key)?.label ?? key;
export const cycleLabel = (key: string) => LEAD_CYCLES.find((c) => c.key === key)?.label ?? key;
export const statusLabel = (key: string) => LEAD_STATUSES.find((s) => s.key === key)?.label ?? key;

/** Link de WhatsApp para falar com quem se cadastrou (número brasileiro). */
export function whatsappLink(phoneDigits: string, text?: string): string {
  const digits = onlyDigits(phoneDigits);
  const full = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
