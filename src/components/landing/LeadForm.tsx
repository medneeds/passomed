import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import {
  EMPTY_LEAD, LEAD_CYCLES, LEAD_SECTORS, LeadCycle, LeadErrors, LeadFormValues, LeadSector,
  formatPhone, leadServerError, onlyDigits, validateLead,
} from "@/lib/leads";

/** Evento usado pela calculadora para levar leitos e plano já preenchidos. */
export const LEAD_PREFILL_EVENT = "passomed:lead-prefill";
export interface LeadPrefill {
  beds?: number;
  cycle?: LeadCycle;
  sectors?: LeadSector[];
}

const fieldClass =
  "mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-3.5 text-base text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
const errorClass = "mt-1 text-xs font-medium text-red-700";

export function LeadForm({ whatsappHref }: { whatsappHref: string }) {
  const [values, setValues] = useState<LeadFormValues>(EMPTY_LEAD);
  const [errors, setErrors] = useState<LeadErrors>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [trap, setTrap] = useState(""); // campo-isca: gente não vê, robô preenche
  const formRef = useRef<HTMLFormElement>(null);
  const id = useId();

  useEffect(() => {
    const onPrefill = (event: Event) => {
      const detail = (event as CustomEvent<LeadPrefill>).detail ?? {};
      setValues((current) => ({
        ...current,
        bedsEstimate: detail.beds ? String(detail.beds) : current.bedsEstimate,
        billingCycle: detail.cycle ?? current.billingCycle,
        sectors: detail.sectors?.length ? detail.sectors : current.sectors,
      }));
    };
    window.addEventListener(LEAD_PREFILL_EVENT, onPrefill);
    return () => window.removeEventListener(LEAD_PREFILL_EVENT, onPrefill);
  }, []);

  const set = <K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const toggleSector = (sector: LeadSector) =>
    set("sectors", values.sectors.includes(sector) ? values.sectors.filter((s) => s !== sector) : [...values.sectors, sector]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (state === "sending") return;
    const found = validateLead(values);
    setErrors(found);
    setServerError(null);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[data-field="${firstInvalid}"]`)?.focus();
      return;
    }
    if (trap) {
      setState("sent"); // robô: finge sucesso e não grava nada
      return;
    }
    setState("sending");
    const { data, error } = await db.rpc("submit_sales_lead", {
      p_institution_name: values.institutionName,
      p_contact_name: values.contactName,
      p_email: values.email,
      p_whatsapp: onlyDigits(values.whatsapp),
      p_sectors: values.sectors,
      p_beds_estimate: values.bedsEstimate ? Number(values.bedsEstimate) : null,
      p_billing_cycle: values.billingCycle,
      p_contact_role: values.contactRole || null,
      p_city_state: values.cityState || null,
      p_message: values.message || null,
      p_source: "landing",
    });
    if (error || !data?.ok) {
      setServerError(leadServerError(data?.error));
      setState("idle");
      return;
    }
    setState("sent");
  };

  if (state === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" aria-hidden />
        <h3 className="mt-4 font-landing-display text-2xl text-foreground">Cadastro recebido</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Obrigado, {values.contactName.split(" ")[0] || "tudo certo"}. Vamos entrar em contato pelo WhatsApp informado para
          combinar a demonstração. Se preferir adiantar, é só chamar.
        </p>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-background px-6 text-sm font-medium text-foreground hover:border-primary/40"
        >
          <MessageCircle className="h-4 w-4" aria-hidden /> Chamar no WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-inst`} className="text-sm font-medium text-foreground">Instituição</label>
          <input
            id={`${id}-inst`} data-field="institutionName" type="text" autoComplete="organization" maxLength={160}
            placeholder="Hospital Municipal de Exemplo" value={values.institutionName}
            onChange={(e) => set("institutionName", e.target.value)}
            aria-invalid={!!errors.institutionName} className={fieldClass}
          />
          {errors.institutionName && <p className={errorClass}>{errors.institutionName}</p>}
        </div>

        <div>
          <label htmlFor={`${id}-name`} className="text-sm font-medium text-foreground">Responsável</label>
          <input
            id={`${id}-name`} data-field="contactName" type="text" autoComplete="name" maxLength={120}
            placeholder="Seu nome" value={values.contactName}
            onChange={(e) => set("contactName", e.target.value)}
            aria-invalid={!!errors.contactName} className={fieldClass}
          />
          {errors.contactName && <p className={errorClass}>{errors.contactName}</p>}
        </div>
        <div>
          <label htmlFor={`${id}-role`} className="text-sm font-medium text-foreground">
            Cargo <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input
            id={`${id}-role`} type="text" autoComplete="organization-title" maxLength={80}
            placeholder="Coordenação da UTI, direção técnica…" value={values.contactRole}
            onChange={(e) => set("contactRole", e.target.value)} className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor={`${id}-email`} className="text-sm font-medium text-foreground">E-mail</label>
          <input
            id={`${id}-email`} data-field="email" type="email" inputMode="email" autoComplete="email" maxLength={200}
            placeholder="nome@hospital.com.br" value={values.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={!!errors.email} className={fieldClass}
          />
          {errors.email && <p className={errorClass}>{errors.email}</p>}
        </div>
        <div>
          <label htmlFor={`${id}-phone`} className="text-sm font-medium text-foreground">WhatsApp</label>
          <input
            id={`${id}-phone`} data-field="whatsapp" type="tel" inputMode="tel" autoComplete="tel-national"
            placeholder="(98) 98165-9576" value={values.whatsapp}
            onChange={(e) => set("whatsapp", formatPhone(e.target.value))}
            aria-invalid={!!errors.whatsapp} className={fieldClass}
          />
          {errors.whatsapp && <p className={errorClass}>{errors.whatsapp}</p>}
        </div>

        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium text-foreground">Setores de interesse</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {LEAD_SECTORS.map((sector, index) => {
              const on = values.sectors.includes(sector.key);
              return (
                <button
                  key={sector.key} type="button" aria-pressed={on}
                  data-field={index === 0 ? "sectors" : undefined}
                  onClick={() => toggleSector(sector.key)}
                  className={`min-h-11 rounded-full border px-5 text-sm font-medium transition-colors ${
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:border-primary/40"
                  }`}
                >
                  {sector.label}
                </button>
              );
            })}
          </div>
          {errors.sectors && <p className={errorClass}>{errors.sectors}</p>}
        </fieldset>

        <div>
          <label htmlFor={`${id}-beds`} className="text-sm font-medium text-foreground">
            Total de leitos <span className="font-normal text-muted-foreground">(estimativa)</span>
          </label>
          <input
            id={`${id}-beds`} data-field="bedsEstimate" type="text" inputMode="numeric" maxLength={4}
            placeholder="Ex.: 30" value={values.bedsEstimate}
            onChange={(e) => set("bedsEstimate", onlyDigits(e.target.value))}
            aria-invalid={!!errors.bedsEstimate} className={fieldClass}
          />
          {errors.bedsEstimate && <p className={errorClass}>{errors.bedsEstimate}</p>}
        </div>
        <div>
          <label htmlFor={`${id}-city`} className="text-sm font-medium text-foreground">
            Cidade e estado <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input
            id={`${id}-city`} type="text" autoComplete="address-level2" maxLength={80}
            placeholder="São Luís, MA" value={values.cityState}
            onChange={(e) => set("cityState", e.target.value)} className={fieldClass}
          />
        </div>

        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium text-foreground">Plano de interesse</legend>
          <div role="radiogroup" className="mt-2 grid gap-2 sm:grid-cols-3">
            {LEAD_CYCLES.map((cycle) => {
              const on = values.billingCycle === cycle.key;
              return (
                <button
                  key={cycle.key} type="button" role="radio" aria-checked={on}
                  onClick={() => set("billingCycle", cycle.key)}
                  className={`min-h-14 rounded-xl border px-4 py-2 text-left transition-colors ${
                    on ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <span className="block text-sm font-semibold text-foreground">{cycle.label}</span>
                  <span className="block text-xs text-muted-foreground">{cycle.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="sm:col-span-2">
          <label htmlFor={`${id}-msg`} className="text-sm font-medium text-foreground">
            Quer contar mais alguma coisa? <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            id={`${id}-msg`} rows={3} maxLength={1000}
            placeholder="Como é a passagem de plantão hoje, prazo, dúvidas…" value={values.message}
            onChange={(e) => set("message", e.target.value)}
            className={`${fieldClass} h-auto py-3`}
          />
        </div>
      </div>

      {/* Campo-isca contra robôs: fora da tela e fora da ordem de foco */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Site
          <input type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
        </label>
      </div>

      {serverError && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{serverError}</p>
      )}

      <button
        type="submit" disabled={state === "sending"}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-medium text-primary-foreground shadow-md transition-all hover:shadow-glow disabled:opacity-70"
      >
        {state === "sending" ? (
          <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Enviando…</>
        ) : (
          <>Solicitar demonstração <ArrowRight className="h-4 w-4" aria-hidden /></>
        )}
      </button>
      <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
        Ao enviar, você concorda em ser contatado pela equipe do PassoMed sobre esta solicitação. Seus dados são
        usados só para isso, conforme a{" "}
        <Link to="/privacidade" className="font-medium text-foreground underline underline-offset-4">
          Política de Privacidade
        </Link>{" "}
        e a LGPD.
      </p>
    </form>
  );
}
