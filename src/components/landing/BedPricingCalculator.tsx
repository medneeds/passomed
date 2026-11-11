import { LEAD_PREFILL_EVENT, LeadPrefill } from "@/components/landing/LeadForm";
import { useMemo, useState } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";
import {
  ANNUAL_PAID_MONTHS, annualCents, billableBeds, BillingCycle, firstYearCents, formatBRL,
  MIN_BILLABLE_BEDS, monthlyCents, PRICE_PER_BED_CENTS, SETUP_FEE_CENTS,
} from "@/lib/billing";

/**
 * Calculadora de preço da landing: leitos × R$ 29,90, plano mensal ou anual.
 * Usa a mesma regra de `src/lib/billing.ts` que o painel do hospital usa.
 */

interface Field {
  key: "uti" | "red" | "observation" | "ward";
  label: string;
  hint: string;
  initial: number;
}

const FIELDS: Field[] = [
  { key: "uti", label: "Leitos de UTI", hint: "Geral ou especializada", initial: 10 },
  { key: "red", label: "Sala vermelha", hint: "Emergência / estabilização", initial: 0 },
  { key: "observation", label: "Observação", hint: "Salas amarela e azul", initial: 0 },
  { key: "ward", label: "Enfermaria", hint: "Clínica, cirúrgica ou mista", initial: 0 },
];

const MAX_BEDS = 200;
const WHATSAPP = "5598981659576";

export function BedPricingCalculator() {
  const [beds, setBeds] = useState<Record<Field["key"], number>>(
    () => Object.fromEntries(FIELDS.map((f) => [f.key, f.initial])) as Record<Field["key"], number>,
  );

  const [cycle, setCycle] = useState<BillingCycle>("annual");

  const total = beds.uti + beds.red + beds.observation + beds.ward;
  const billable = billableBeds(total);
  const belowMinimum = total > 0 && total < MIN_BILLABLE_BEDS;
  const monthly = monthlyCents(billable);
  const annual = annualCents(billable);
  const price = cycle === "annual" ? annual : monthly;
  const savings = firstYearCents(total, "monthly") - firstYearCents(total, "annual");

  const update = (key: Field["key"], value: number) =>
    setBeds((current) => ({ ...current, [key]: Math.min(MAX_BEDS, Math.max(0, Number.isFinite(value) ? Math.floor(value) : 0)) }));

  // Leva leitos, setores e plano já preenchidos para o formulário de cadastro.
  const sendToForm = () => {
    const sectors: LeadPrefill["sectors"] = [];
    if (beds.red || beds.observation) sectors.push("emergencia");
    if (beds.uti) sectors.push("uti");
    if (beds.ward) sectors.push("enfermaria");
    window.dispatchEvent(
      new CustomEvent<LeadPrefill>(LEAD_PREFILL_EVENT, { detail: { beds: total || undefined, cycle, sectors } }),
    );
  };

  const contactHref = useMemo(() => {
    const parts = [
      beds.uti ? `${beds.uti} de UTI` : null,
      beds.red ? `${beds.red} de sala vermelha` : null,
      beds.observation ? `${beds.observation} de observação` : null,
      beds.ward ? `${beds.ward} de enfermaria` : null,
    ].filter(Boolean);
    const plan = cycle === "annual"
      ? `plano anual, ${formatBRL(annual)} à vista, implantação isenta`
      : `plano mensal, ${formatBRL(monthly)} por mês + implantação de ${formatBRL(SETUP_FEE_CENTS)}`;
    const text = total > 0
      ? `Olá, Artur! Quero o PassoMed para ${total} leitos (${parts.join(", ")}). Pela calculadora: ${plan}. Podemos conversar?`
      : "Olá, Artur! Gostaria de mais informações sobre o PassoMed.";
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  }, [beds, total, monthly, annual, cycle]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
      <div className="rounded-2xl border border-border bg-card p-6 xl:p-8">
        <h3 className="font-landing-display text-2xl text-foreground">Quantos leitos você quer acompanhar?</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Conte só os leitos fixos do setor. Maca de corredor e leito extra em dia de superlotação não entram na conta.
        </p>

        <div className="mt-6 space-y-4">
          {FIELDS.map((field) => (
            <div key={field.key} className="flex items-center justify-between gap-4">
              <label htmlFor={`beds-${field.key}`} className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{field.label}</span>
                <span className="block text-xs text-muted-foreground">{field.hint}</span>
              </label>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Diminuir ${field.label.toLowerCase()}`}
                  onClick={() => update(field.key, beds[field.key] - 1)}
                  disabled={beds[field.key] <= 0}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-primary/40 disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  id={`beds-${field.key}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={MAX_BEDS}
                  value={beds[field.key]}
                  onChange={(e) => update(field.key, parseInt(e.target.value, 10))}
                  className="h-11 w-16 rounded-lg border border-border bg-background text-center text-base font-semibold tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  aria-label={`Aumentar ${field.label.toLowerCase()}`}
                  onClick={() => update(field.key, beds[field.key] + 1)}
                  disabled={beds[field.key] >= MAX_BEDS}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-primary/40 disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { label: "UTI de 10 leitos", value: { uti: 10, red: 0, observation: 0, ward: 0 } },
            { label: "UTI de 20 leitos", value: { uti: 20, red: 0, observation: 0, ward: 0 } },
            { label: "Emergência: 5 vermelha + 10 observação", value: { uti: 0, red: 5, observation: 10, ward: 0 } },
            { label: "Enfermaria de 30 leitos", value: { uti: 0, red: 0, observation: 0, ward: 30 } },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setBeds(preset.value)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col rounded-2xl border border-gold/60 bg-card p-6 shadow-gold xl:p-8">
        <div role="radiogroup" aria-label="Forma de pagamento" className="grid grid-cols-2 gap-1 rounded-full border border-border bg-background p-1">
          {([
            { value: "annual", label: "Anual", tag: "2 meses grátis" },
            { value: "monthly", label: "Mensal", tag: null },
          ] as const).map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={cycle === option.value}
              onClick={() => setCycle(option.value)}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors ${
                cycle === option.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
              {option.tag && (
                <span className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold ${cycle === option.value ? "bg-white/20" : "bg-gold/15 text-foreground"}`}>
                  {option.tag}
                </span>
              )}
            </button>
          ))}
        </div>

        <span className="mt-6 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold">
          {cycle === "annual" ? "Anuidade à vista" : "Sua mensalidade"}
        </span>
        <p className="mt-3 font-landing-display text-5xl leading-none tracking-tight text-foreground tabular-nums" aria-live="polite">
          {formatBRL(price)}
          <span className="ml-1 font-landing-sans text-base font-normal text-muted-foreground">
            {cycle === "annual" ? "/ano" : "/mês"}
          </span>
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {billable} {billable === 1 ? "leito" : "leitos"} × {formatBRL(PRICE_PER_BED_CENTS)}
          {cycle === "annual" ? ` × ${ANNUAL_PAID_MONTHS} meses (você usa 12)` : " por mês"}
        </p>
        {belowMinimum && (
          <p className="mt-2 text-xs text-muted-foreground">
            O contrato mínimo é de {MIN_BILLABLE_BEDS} leitos: unidades menores pagam por {MIN_BILLABLE_BEDS}.
          </p>
        )}

        <div className="mt-5 rounded-xl border border-border bg-background/60 p-4 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-muted-foreground">Implantação (uma vez)</span>
            {cycle === "annual" ? (
              <span className="font-medium text-foreground">
                <s className="mr-1.5 font-normal text-muted-foreground">{formatBRL(SETUP_FEE_CENTS)}</s>Isenta
              </span>
            ) : (
              <span className="font-medium tabular-nums text-foreground">{formatBRL(SETUP_FEE_CENTS)}</span>
            )}
          </div>
          {total > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {cycle === "annual"
                ? `No primeiro ano você economiza ${formatBRL(savings)} em relação ao plano mensal.`
                : `No plano anual o primeiro ano sai ${formatBRL(savings)} mais barato.`}
            </p>
          )}
        </div>

        <ul className="mt-5 flex-1 space-y-2.5 text-sm text-foreground">
          {[
            "Sem cobrança por usuário: o preço é só por leito",
            "Plataforma com o nome, o logo e as cores do hospital",
            "Mapa de leitos, passagem de plantão e protocolos",
            "Implantação com cadastro, marca e treinamento remoto da equipe",
            "Atualizações contínuas incluídas",
          ].map((item) => (
            <li key={item} className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <a
          href="#cadastro"
          onClick={sendToForm}
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:shadow-glow md:text-base"
        >
          Solicitar proposta com estes números
          <ArrowRight className="h-4 w-4" />
        </a>
        <a
          href={contactHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center justify-center text-sm font-medium text-foreground underline decoration-gold/60 underline-offset-4 hover:decoration-gold"
        >
          Ou enviar pelo WhatsApp
        </a>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Boleto ou Pix, com nota fiscal. Treinamento presencial é orçado à parte.
        </p>
      </div>
    </div>
  );
}
