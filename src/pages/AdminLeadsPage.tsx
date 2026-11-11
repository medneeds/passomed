import { useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, Inbox, Loader2, Mail, MessageCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { useLeadsSummary } from "@/hooks/useLeadsSummary";
import { LEAD_STATUSES, LeadStatus, cycleLabel, formatPhone, sectorLabel, statusLabel, whatsappLink } from "@/lib/leads";
import { PRICE_PER_BED_CENTS, formatBRL } from "@/lib/billing";

interface Lead {
  id: string;
  created_at: string;
  institution_name: string;
  contact_name: string;
  contact_role: string | null;
  email: string;
  whatsapp: string;
  city_state: string | null;
  sectors: string[];
  beds_estimate: number | null;
  billing_cycle: string;
  message: string | null;
  status: LeadStatus;
  notes: string | null;
}

const STATUS_TONE: Record<string, string> = {
  new: "bg-amber-100 text-amber-900 border-amber-200",
  contacted: "bg-sky-100 text-sky-900 border-sky-200",
  demo_scheduled: "bg-indigo-100 text-indigo-900 border-indigo-200",
  proposal: "bg-violet-100 text-violet-900 border-violet-200",
  won: "bg-emerald-100 text-emerald-900 border-emerald-200",
  lost: "bg-slate-100 text-slate-600 border-slate-200",
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Funil comercial: cadastros que chegam pela landing. Só o operador da plataforma vê. */
export default function AdminLeadsPage() {
  const { user } = useAuth();
  const { summary, refresh: refreshSummary } = useLeadsSummary();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "all" | LeadStatus>("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await db.from("sales_leads").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) toast.error("Não foi possível carregar os cadastros.");
    else setLeads((data ?? []) as Lead[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    if (filter === "all") return leads;
    if (filter === "open") return leads.filter((l) => l.status !== "won" && l.status !== "lost");
    return leads.filter((l) => l.status === filter);
  }, [leads, filter]);

  const update = async (lead: Lead, patch: Partial<Pick<Lead, "status" | "notes">>) => {
    setSavingId(lead.id);
    const { error } = await db.from("sales_leads").update({ ...patch, updated_by: user?.id ?? null }).eq("id", lead.id);
    setSavingId(null);
    if (error) {
      toast.error("Não foi possível salvar. Tente novamente.");
      return;
    }
    setLeads((current) => current.map((l) => (l.id === lead.id ? { ...l, ...patch } : l)));
    refreshSummary();
    toast.success("Cadastro atualizado.");
  };

  const stats: [string, string | number][] = [
    ["Hoje", summary?.today ?? "–"],
    ["Últimos 7 dias", summary?.last_7_days ?? "–"],
    ["Aguardando contato", summary?.new ?? "–"],
    ["Leitos em negociação", summary?.beds_in_pipeline ?? "–"],
  ];

  return (
    <MainLayout>
      <div className="container mx-auto max-w-5xl space-y-5 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Inbox className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Cadastros da landing</h1>
              <p className="text-sm text-muted-foreground">Instituições que pediram demonstração pelo site.</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => { load(); refreshSummary(); }} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map(([label, value]) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-2xl font-bold tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="h-11 w-64" aria-label="Filtrar por situação">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Em aberto</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{visible.length} cadastro(s)</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando cadastros...
          </div>
        ) : visible.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Nenhum cadastro nesta situação. Quando alguém preencher o formulário da landing, aparece aqui.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {visible.map((lead) => {
              const open = openId === lead.id;
              const monthly = lead.beds_estimate ? formatBRL(Math.max(lead.beds_estimate, 10) * PRICE_PER_BED_CENTS) : null;
              const draft = noteDrafts[lead.id] ?? lead.notes ?? "";
              return (
                <li key={lead.id}>
                  <Card>
                    <CardContent className="p-0">
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpenId(open ? null : lead.id)}
                        className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 p-4 text-left"
                      >
                        <span className="min-w-0 flex-1 basis-56">
                          <span className="block truncate font-semibold">{lead.institution_name}</span>
                          <span className="block truncate text-sm text-muted-foreground">
                            {lead.contact_name}
                            {lead.contact_role ? ` · ${lead.contact_role}` : ""}
                            {lead.city_state ? ` · ${lead.city_state}` : ""}
                          </span>
                        </span>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {lead.beds_estimate ? `${lead.beds_estimate} leitos` : "Leitos a definir"} · {cycleLabel(lead.billing_cycle)}
                        </span>
                        <Badge variant="outline" className={`whitespace-nowrap ${STATUS_TONE[lead.status] ?? ""}`}>
                          {statusLabel(lead.status)}
                        </Badge>
                        <span className="text-xs tabular-nums text-muted-foreground">{when(lead.created_at)}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                      </button>

                      {open && (
                        <div className="space-y-4 border-t p-4">
                          <div className="flex flex-wrap gap-2">
                            {lead.sectors.map((s) => (
                              <Badge key={s} variant="secondary">{sectorLabel(s)}</Badge>
                            ))}
                            {monthly && <Badge variant="secondary">≈ {monthly}/mês</Badge>}
                          </div>
                          {lead.message && (
                            <p className="rounded-lg bg-muted/50 p-3 text-sm leading-relaxed">{lead.message}</p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <Button asChild className="min-h-11">
                              <a
                                href={whatsappLink(lead.whatsapp, `Olá, ${lead.contact_name.split(" ")[0]}! Aqui é o Artur, do PassoMed. Recebi o cadastro do ${lead.institution_name}. Podemos marcar a demonstração?`)}
                                target="_blank" rel="noopener noreferrer"
                              >
                                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp {formatPhone(lead.whatsapp)}
                              </a>
                            </Button>
                            <Button asChild variant="outline" className="min-h-11">
                              <a href={`mailto:${lead.email}`}><Mail className="mr-2 h-4 w-4" /> {lead.email}</a>
                            </Button>
                          </div>
                          <div className="grid gap-3 md:grid-cols-[240px_1fr]">
                            <div>
                              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Situação</p>
                              <Select value={lead.status} onValueChange={(v) => update(lead, { status: v as LeadStatus })} disabled={savingId === lead.id}>
                                <SelectTrigger className="h-11" aria-label="Situação do cadastro">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {LEAD_STATUSES.map((s) => (
                                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Anotações internas</p>
                              <Textarea
                                rows={2}
                                value={draft}
                                placeholder="Ex.: ligou dia 12, quer demonstração para a coordenação da UTI"
                                onChange={(e) => setNoteDrafts((d) => ({ ...d, [lead.id]: e.target.value }))}
                              />
                              <Button
                                variant="outline" size="sm" className="mt-2"
                                disabled={savingId === lead.id || draft === (lead.notes ?? "")}
                                onClick={() => update(lead, { notes: draft.trim() || null })}
                              >
                                Salvar anotação
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </MainLayout>
  );
}
