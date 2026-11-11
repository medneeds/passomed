/** Regras de cobrança por leito — fonte única para telas e landing. */

/** Preço de tabela: R$ 29,90 por leito fixo, por mês. */
export const PRICE_PER_BED_CENTS = 2990;

/** Contrato mínimo: unidades menores pagam por 10 leitos. */
export const MIN_BILLABLE_BEDS = 10;

/** Plano anual à vista: paga 10 meses, usa 12 ("2 meses grátis"). */
export const ANNUAL_PAID_MONTHS = 10;

/** Implantação: valor único por unidade, isento no plano anual. */
export const SETUP_FEE_CENTS = 99000;

export type BillingCycle = "monthly" | "annual";

const safeBeds = (beds: number) => (Number.isFinite(beds) ? Math.max(0, Math.floor(beds)) : 0);

/** Leitos faturados: o contratado, respeitando o mínimo (0 leitos = nada a faturar). */
export function billableBeds(beds: number, minBeds: number = MIN_BILLABLE_BEDS): number {
  const count = safeBeds(beds);
  return count === 0 ? 0 : Math.max(count, minBeds);
}

/** Leitos × preço, sem aplicar o mínimo (use `billableBeds` antes, quando couber). */
export function monthlyCents(beds: number, pricePerBedCents: number = PRICE_PER_BED_CENTS): number {
  return safeBeds(beds) * pricePerBedCents;
}

/** Anuidade à vista: 10 mensalidades. */
export function annualCents(beds: number, pricePerBedCents: number = PRICE_PER_BED_CENTS): number {
  return monthlyCents(beds, pricePerBedCents) * ANNUAL_PAID_MONTHS;
}

/** Implantação devida conforme o plano. */
export function setupFeeCents(cycle: BillingCycle, feeCents: number = SETUP_FEE_CENTS): number {
  return cycle === "annual" ? 0 : feeCents;
}

/** Total do primeiro ano (mensalidades ou anuidade + implantação). */
export function firstYearCents(beds: number, cycle: BillingCycle, pricePerBedCents: number = PRICE_PER_BED_CENTS): number {
  const billable = billableBeds(beds);
  return cycle === "annual"
    ? annualCents(billable, pricePerBedCents)
    : monthlyCents(billable, pricePerBedCents) * 12 + (billable > 0 ? setupFeeCents("monthly") : 0);
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

export interface BillingItem {
  department: string;
  sector: string;
  label: string;
  kind: "emergencia" | "uti" | string;
  beds: number;
  amount_cents: number;
}

export interface BillingSummary {
  hospital_unit_id: string;
  has_contract: boolean;
  status: "demo" | "trial" | "active" | "suspended" | "cancelled" | null;
  contracted_beds: number | null;
  configured_beds: number;
  price_per_bed_cents: number;
  monthly_cents: number;
  contracted_monthly_cents: number;
  billing_day: number | null;
  started_on: string | null;
  billing_cycle?: BillingCycle | null;
  billable_beds?: number | null;
  min_billable_beds?: number | null;
  annual_cents?: number | null;
  setup_fee_cents?: number | null;
  items: BillingItem[];
}

export const CONTRACT_STATUS_LABEL: Record<string, string> = {
  demo: "Demonstração",
  trial: "Período de teste",
  active: "Ativo",
  suspended: "Suspenso",
  cancelled: "Encerrado",
};

/** Mensagem amigável para o erro da trava de leitos contratados. */
export function friendlyCapacityError(message: string | undefined | null): string {
  if (message && message.includes("Limite de leitos contratados")) {
    return message.replace(/^.*?(Limite de leitos contratados)/, "$1");
  }
  return message || "Erro desconhecido";
}
