/** Regras de cobrança por leito — fonte única para telas e landing. */

/** Preço de tabela: R$ 25,00 por leito fixo, por mês. */
export const PRICE_PER_BED_CENTS = 2500;

export function monthlyCents(beds: number, pricePerBedCents: number = PRICE_PER_BED_CENTS): number {
  const safeBeds = Number.isFinite(beds) ? Math.max(0, Math.floor(beds)) : 0;
  return safeBeds * pricePerBedCents;
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
