import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight, ArrowRight, BarChart3, BedDouble, Bell, Check, ClipboardList, FileText, FolderOpen,
  LayoutGrid, LogOut, MoreVertical, Printer, StickyNote, Upload, UserPlus, Zap,
} from "lucide-react";
import logoP from "@/assets/logo-p-cross.png";

/**
 * Demonstração navegável da plataforma na landing.
 *
 * Em vez de uma tabela de colunas, mostra a EXPERIÊNCIA: a barra lateral é
 * clicável e cada item abre uma cena que reproduz a tela real — preencher um
 * leito, movimentar um paciente, passar o plantão, abrir os documentos da
 * unidade, anotar um lembrete e acompanhar a ocupação. Dados fictícios.
 */

type SceneId = "mapa" | "acoes" | "plantao" | "documentos" | "notas" | "gestao";

const SCENES: { id: SceneId; label: string; short: string; icon: typeof LayoutGrid; caption: string }[] = [
  { id: "mapa", label: "Mapa de leitos", short: "Mapa", icon: LayoutGrid, caption: "Cada leito é um cartão vivo: você preenche direto nele, sem abrir formulário." },
  { id: "acoes", label: "Movimentações", short: "Movimentar", icon: ArrowLeftRight, caption: "Transferência, realocação, alta e solicitação de vaga saem do próprio leito, e o histórico acompanha o paciente." },
  { id: "plantao", label: "Passagem de plantão", short: "Plantão", icon: ClipboardList, caption: "As pendências destacadas ao longo do turno viram a lista de quem entra." },
  { id: "documentos", label: "Documentos da unidade", short: "Documentos", icon: FolderOpen, caption: "Protocolos, termos e fichas da sua instituição em um lugar só, organizados por unidade." },
  { id: "notas", label: "Notas e lembretes", short: "Notas", icon: StickyNote, caption: "Lembretes com horário aparecem para o plantão certo, sem depender de recado no WhatsApp." },
  { id: "gestao", label: "Painel de gestão", short: "Gestão", icon: BarChart3, caption: "Ocupação por setor, permanência e movimentações do dia para a coordenação." },
];

const AUTO_ADVANCE_MS = 7000;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function ExperienceShowcase() {
  const [scene, setScene] = useState<SceneId>("mapa");
  const [auto, setAuto] = useState(true);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!auto || reduced) return;
    const timer = window.setTimeout(() => {
      const index = SCENES.findIndex((s) => s.id === scene);
      setScene(SCENES[(index + 1) % SCENES.length].id);
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [scene, auto, reduced]);

  const choose = (id: SceneId) => {
    setAuto(false);
    setScene(id);
  };
  const current = SCENES.find((s) => s.id === scene)!;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      {/* Barra superior da aplicação */}
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-brand-deep via-brand-mid to-brand-bright px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white">
            <img src={logoP} alt="" aria-hidden className="h-5 w-5 object-contain" />
          </span>
          <span className="truncate text-sm font-medium">Hospital de exemplo</span>
          <span className="hidden rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] sm:inline">UE Adulto</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[11px]">
          <span className="rounded-full bg-white/15 px-2.5 py-1 tabular-nums">19 pacientes</span>
          <Bell className="h-4 w-4 opacity-80" aria-hidden />
        </div>
      </div>

      <div className="grid md:grid-cols-[212px_1fr]">
        {/* Barra lateral: é a navegação da demonstração */}
        <div
          role="tablist"
          aria-label="Áreas da plataforma"
          aria-orientation="vertical"
          className="flex gap-1.5 overflow-x-auto border-b border-border bg-secondary/40 p-2 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-3"
        >
          {SCENES.map((item) => {
            const Icon = item.icon;
            const active = item.id === scene;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`exp-tab-${item.id}`}
                aria-selected={active}
                aria-controls="exp-panel"
                onClick={() => choose(item.id)}
                className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-3 text-left text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden md:inline">{item.label}</span>
                <span className="md:hidden">{item.short}</span>
              </button>
            );
          })}
        </div>

        <div id="exp-panel" role="tabpanel" aria-labelledby={`exp-tab-${scene}`} className="min-w-0">
          <div key={scene} className="min-h-[430px] p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500 sm:p-5">
            {scene === "mapa" && <MapScene reduced={reduced} />}
            {scene === "acoes" && <ActionsScene />}
            {scene === "plantao" && <HandoverScene />}
            {scene === "documentos" && <DocumentsScene />}
            {scene === "notas" && <NotesScene />}
            {scene === "gestao" && <ManagementScene />}
          </div>
          <p className="border-t border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground sm:px-5">
            <span className="mr-2 font-medium text-foreground">{current.label}.</span>
            {current.caption}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Peças compartilhadas ─────────────────────────────────────────────── */

const SECTOR = {
  red: { wrap: "border-red-200 bg-red-50", chip: "bg-red-100 text-red-800 border-red-200", bar: "border-l-red-500", text: "text-red-900" },
  yellow: { wrap: "border-amber-200 bg-amber-50", chip: "bg-amber-100 text-amber-900 border-amber-200", bar: "border-l-amber-500", text: "text-amber-950" },
  blue: { wrap: "border-sky-200 bg-sky-50", chip: "bg-sky-100 text-sky-900 border-sky-200", bar: "border-l-sky-500", text: "text-sky-950" },
} as const;

function SectorHeader({ tone, title, count }: { tone: keyof typeof SECTOR; title: string; count: string }) {
  const c = SECTOR[tone];
  return (
    <div className={`flex items-center justify-between rounded-xl border border-l-4 px-3 py-2 ${c.wrap} ${c.bar}`}>
      <span className={`flex items-center gap-2 text-sm font-semibold ${c.text}`}>
        <BedDouble className="h-4 w-4" aria-hidden /> {title}
      </span>
      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-700">{count}</span>
    </div>
  );
}

function BedChip({ tone, children }: { tone: keyof typeof SECTOR; children: string }) {
  return (
    <span className={`inline-flex h-8 min-w-[2.75rem] items-center justify-center rounded-md border px-1.5 text-xs font-bold tabular-nums ${SECTOR[tone].chip}`}>
      {children}
    </span>
  );
}

function FieldList({ title, items, highlight }: { title: string; items: string[]; highlight?: number }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-slate-500">{title}</p>
      <ol className="mt-1 space-y-0.5 text-xs text-slate-800">
        {items.map((item, index) => (
          <li key={item} className={`flex gap-1.5 rounded px-1 ${highlight === index ? "bg-amber-200/70 font-semibold" : ""}`}>
            <span className="tabular-nums text-slate-400">{index + 1}.</span>
            <span className="min-w-0 break-words">{item}</span>
            {highlight === index && <Zap className="ml-auto h-3.5 w-3.5 shrink-0 text-amber-600" aria-label="Pendência destacada" />}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ── Cena 1: preencher direto no leito ────────────────────────────────── */

const TYPED = "REAVALIAR LACTATO ÀS 18H";

function MapScene({ reduced }: { reduced: boolean }) {
  const [typed, setTyped] = useState(reduced ? TYPED.length : 0);
  useEffect(() => {
    if (reduced) {
      setTyped(TYPED.length);
      return;
    }
    setTyped(0);
    let n = 0;
    const timer = window.setInterval(() => {
      n += 1;
      setTyped(n);
      if (n >= TYPED.length) window.clearInterval(timer);
    }, 70);
    return () => window.clearInterval(timer);
  }, [reduced]);
  const done = typed >= TYPED.length;

  return (
    <div className="space-y-3">
      <SectorHeader tone="red" title="Sala Vermelha" count="2/5" />
      <div className={`rounded-xl border p-3 ${SECTOR.red.wrap}`}>
        <div className="flex flex-wrap items-start gap-3">
          <BedChip tone="red">V02</BedChip>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
              MARIA FICTÍCIA DOS SANTOS
              <span className="rounded-full border border-red-200 bg-white px-2 py-0.5 text-[10px] font-medium text-red-700">5h no leito</span>
            </p>
            <p className="text-xs text-slate-500">74 anos</p>
          </div>
          <MoreVertical className="h-4 w-4 text-slate-400" aria-hidden />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <FieldList title="Hipóteses / Diagnósticos" items={["SEPSE DE FOCO PULMONAR", "INSUFICIÊNCIA RESPIRATÓRIA AGUDA"]} />
          <div className="min-w-0">
            <FieldList title="Programações / Pendências" items={["SOLICITADA VAGA DE UTI", "HEMOCULTURAS COLHIDAS"]} highlight={0} />
            <div className="mt-1 flex items-center gap-1.5 rounded border border-dashed border-slate-400 bg-white px-1.5 py-1 text-xs text-slate-900">
              <span className="tabular-nums text-slate-400">3.</span>
              <span className="min-w-0 break-words">
                {TYPED.slice(0, typed)}
                {!done && <span className="ml-px inline-block h-3 w-px translate-y-0.5 bg-slate-900 motion-safe:animate-pulse" aria-hidden />}
              </span>
              {done && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-emerald-600" aria-label="Salvo" />}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">{done ? "Salvo. A equipe inteira já vê." : "Digitando direto no leito…"}</p>
          </div>
        </div>
      </div>
      <div className={`flex items-center justify-between rounded-xl border border-dashed p-3 ${SECTOR.red.wrap}`}>
        <span className="flex items-center gap-3 text-xs italic text-slate-600">
          <BedChip tone="red">V03</BedChip> Leito disponível
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-red-700">
          <UserPlus className="h-3.5 w-3.5" aria-hidden /> Alocar
        </span>
      </div>
      <SectorHeader tone="yellow" title="Observação Amarela" count="5/10" />
    </div>
  );
}

/* ── Cena 2: ações do paciente e movimentação ─────────────────────────── */

function ActionsScene() {
  const actions = [
    { icon: ArrowLeftRight, label: "Transferir de setor", active: true },
    { icon: BedDouble, label: "Realocar leito" },
    { icon: UserPlus, label: "Solicitar leito" },
    { icon: FileText, label: "Relatório médico" },
    { icon: Printer, label: "Imprimir caso" },
    { icon: LogOut, label: "Alta" },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_230px]">
      <div className="space-y-3">
        <div className={`rounded-xl border p-3 ${SECTOR.red.wrap}`}>
          <div className="flex items-center gap-3">
            <BedChip tone="red">V02</BedChip>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">MARIA FICTÍCIA DOS SANTOS</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Transferência entre setores</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-900">
              <BedChip tone="red">V02</BedChip> Sala Vermelha
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sky-950">
              <BedChip tone="blue">U04</BedChip> UTI 1
            </span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-foreground">
            {[
              "Diagnósticos, pendências e condutas vão junto com a paciente",
              "O leito V02 fica vago e limpo para o próximo",
              "A movimentação entra no histórico, com hora e responsável",
            ].map((line) => (
              <li key={line} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="h-fit rounded-xl border border-border bg-background p-1.5 shadow-md" aria-label="Ações do paciente">
        <p className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Ações do paciente</p>
        {actions.map(({ icon: Icon, label, active }) => (
          <div
            key={label}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${active ? "bg-primary text-primary-foreground" : "text-foreground"}`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden /> {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Cena 3: passagem de plantão ──────────────────────────────────────── */

function HandoverScene() {
  const pendencies: { bed: string; tone: keyof typeof SECTOR; name: string; text: string }[] = [
    { bed: "V01", tone: "red", name: "Antônio E.", text: "Aguarda hemodinâmica" },
    { bed: "V02", tone: "red", name: "Maria F.", text: "Solicitada vaga de UTI" },
    { bed: "A05", tone: "yellow", name: "Rita F.", text: "EDA hoje · 2 CH reservados" },
    { bed: "Z02", tone: "blue", name: "Marcos F.", text: "Reavaliar para alta" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background p-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Passagem · diurno → noturno</p>
          <p className="text-xs text-muted-foreground">19h00 · UE Adulto</p>
        </div>
        <div className="flex gap-2 text-center text-xs">
          {[["10", "pacientes"], ["4", "pendências em destaque"], ["11", "leitos vagos"]].map(([value, label]) => (
            <span key={label} className="rounded-lg border border-border px-2.5 py-1.5">
              <strong className="block text-base tabular-nums text-foreground">{value}</strong>
              <span className="text-muted-foreground">{label}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-background">
        <p className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          O que o próximo plantão precisa resolver
        </p>
        <ul className="divide-y divide-border">
          {pendencies.map((item) => (
            <li key={item.bed} className="flex items-center gap-3 px-3 py-2.5 text-sm">
              <BedChip tone={item.tone}>{item.bed}</BedChip>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">{item.text}</span>
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </span>
              <Zap className="h-4 w-4 shrink-0 text-gold" aria-hidden />
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground">
        <span>Registrar passagem e imprimir o mapa</span>
        <Printer className="h-4 w-4 shrink-0" aria-hidden />
      </div>
    </div>
  );
}

/* ── Cena 4: documentos da unidade ────────────────────────────────────── */

function DocumentsScene() {
  const docs = [
    ["Protocolo de sepse", "Protocolo"],
    ["Protocolo de AVC", "Protocolo"],
    ["Dor torácica", "Protocolo"],
    ["Solicitação de hemoderivados", "Ficha"],
    ["SADT", "Ficha"],
    ["OPME", "Ficha"],
    ["Medicação de alto custo", "Ficha"],
    ["Cuidados paliativos", "Fluxo"],
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Documentos · Hospital de exemplo</p>
        <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-foreground">
          <Upload className="h-3.5 w-3.5" aria-hidden /> Enviar arquivo da unidade
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {docs.map(([name, kind]) => (
          <div key={name} className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3">
            <FileText className="h-5 w-5 text-primary" aria-hidden />
            <p className="text-sm font-medium leading-snug text-foreground">{name}</p>
            <span className="mt-auto w-fit rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground">{kind}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Cada unidade enxerga os próprios documentos. O plantonista para de procurar ficha em pasta de rede e grupo de mensagens.
      </p>
    </div>
  );
}

/* ── Cena 5: notas e lembretes ────────────────────────────────────────── */

function NotesScene() {
  const notes = [
    { time: "18:00", text: "Reavaliar lactato da paciente do V02", who: "Plantão diurno", due: true },
    { time: "20:00", text: "Confirmar hemodinâmica do V01 com a cardiologia", who: "Plantão diurno" },
    { time: "07:00", text: "Família do A01 vem conversar com a equipe", who: "Coordenação" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-background px-3 py-2.5 text-sm text-muted-foreground">
        <StickyNote className="h-4 w-4 shrink-0" aria-hidden /> Escreva uma nota ou lembrete para o plantão…
      </div>
      <ul className="space-y-2.5">
        {notes.map((note) => (
          <li key={note.text} className={`flex gap-3 rounded-xl border p-3 ${note.due ? "border-gold/60 bg-gold/10" : "border-border bg-background"}`}>
            <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold tabular-nums text-primary-foreground">
              {note.time}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{note.text}</span>
              <span className="text-xs text-muted-foreground">
                {note.who}
                {note.due ? " · aparece na tela no horário" : ""}
              </span>
            </span>
            {note.due && <Bell className="ml-auto h-4 w-4 shrink-0 text-gold" aria-hidden />}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Cena 6: painel de gestão ─────────────────────────────────────────── */

function ManagementScene() {
  const sectors: { name: string; used: number; total: number; tone: string }[] = [
    { name: "Sala Vermelha", used: 3, total: 5, tone: "bg-red-500" },
    { name: "Observação Amarela", used: 5, total: 10, tone: "bg-amber-500" },
    { name: "Observação Azul", used: 2, total: 6, tone: "bg-sky-500" },
    { name: "UTI 1", used: 9, total: 10, tone: "bg-primary" },
    { name: "UTI 2", used: 7, total: 10, tone: "bg-primary" },
  ];
  const barRef = useRef<HTMLDivElement>(null);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        {[["63%", "ocupação geral"], ["2,8 dias", "permanência média na UTI"], ["7", "movimentações hoje"]].map(([value, label]) => (
          <div key={label} className="rounded-xl border border-border bg-background p-3">
            <p className="text-lg font-bold tabular-nums text-foreground sm:text-xl">{value}</p>
            <p className="text-[11px] leading-snug text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div ref={barRef} className="space-y-2.5 rounded-xl border border-border bg-background p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ocupação por setor</p>
        {sectors.map((sector) => (
          <div key={sector.name} className="grid grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-3 text-sm">
            <span className="truncate text-foreground">{sector.name}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-secondary">
              <span className={`block h-full rounded-full ${sector.tone}`} style={{ width: `${(sector.used / sector.total) * 100}%` }} />
            </span>
            <span className="tabular-nums text-muted-foreground">{sector.used}/{sector.total}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Altas, transferências e óbitos do período ficam registrados com hora e responsável.</p>
    </div>
  );
}
