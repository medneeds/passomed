import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight, ArrowRight, BarChart3, BedDouble, Bell, CalendarDays, Check, ClipboardList, FileText, FolderOpen,
  GripVertical, Hash, LayoutGrid, LogOut, MoreVertical, Plus, Printer, Search, StickyNote, Upload, UserPlus, Zap,
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

type SceneId = "mapa" | "acoes" | "plantao" | "documentos" | "codigos" | "notas" | "gestao";

const SCENES: { id: SceneId; label: string; short: string; icon: typeof LayoutGrid; caption: string }[] = [
  { id: "mapa", label: "Mapa de leitos", short: "Mapa", icon: LayoutGrid, caption: "Cada leito é um cartão vivo. Você acrescenta, destaca e reorganiza direto nele, na emergência e na UTI." },
  { id: "acoes", label: "Movimentações", short: "Movimentar", icon: ArrowLeftRight, caption: "Transferência, realocação, alta e solicitação de vaga saem do próprio leito, e o histórico acompanha o paciente." },
  { id: "plantao", label: "Passagem de plantão", short: "Plantão", icon: ClipboardList, caption: "As pendências destacadas ao longo do turno viram a lista de quem entra." },
  { id: "documentos", label: "Documentos da unidade", short: "Documentos", icon: FolderOpen, caption: "Protocolos, termos e fichas da sua instituição em um lugar só, organizados por unidade." },
  { id: "codigos", label: "Códigos e procedimentos", short: "Códigos", icon: Hash, caption: "O código CID sai da própria hipótese diagnóstica, e as solicitações da unidade ficam a um toque." },
  { id: "notas", label: "Notas e lembretes", short: "Notas", icon: StickyNote, caption: "Lembretes com horário aparecem para o plantão certo, sem depender de recado no WhatsApp." },
  { id: "gestao", label: "Painel de gestão", short: "Gestão", icon: BarChart3, caption: "Ocupação por setor, permanência e movimentações do dia para a coordenação." },
];

const AUTO_ADVANCE_MS = 7000;
/** O mapa roda a demonstração da Sala Vermelha e depois a da UTI. */
const MAP_ADVANCE_MS = 29000;

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
    }, scene === "mapa" ? MAP_ADVANCE_MS : AUTO_ADVANCE_MS);
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
            {scene === "codigos" && <CodesScene />}
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
  uti: { wrap: "border-indigo-200 bg-indigo-50", chip: "bg-indigo-100 text-indigo-900 border-indigo-200", bar: "border-l-indigo-500", text: "text-indigo-950" },
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

/* ── Cena 1: o leito por dentro (Sala Vermelha e UTI) ─────────────────── */

type Item = { id: string; text: string; hl?: boolean };
type Column = { key: string; title: string; items: Item[] };
type BedDemo = {
  tone: keyof typeof SECTOR;
  sector: string;
  count: string;
  bed: string;
  name: string;
  meta: string[];
  forecast?: string;
  columns: Column[];
  /** Roteiro da animação, sempre na coluna `target`. */
  target: string;
  addText: string;
  highlightIndex: number;
  unhighlightIndex: number;
  /** O item recém-criado sobe para esta posição. */
  dragTo: number;
  grid: string;
};

const it = (text: string, hl = false): Item => ({ id: text, text, hl });

const BEDS: Record<"vermelha" | "uti", BedDemo> = {
  vermelha: {
    tone: "red",
    sector: "Sala Vermelha",
    count: "3/5",
    bed: "V02",
    name: "MARIA FICTÍCIA DOS SANTOS",
    meta: ["74 anos", "Nasc. 12/03/1952", "Admissão 11/11 · 04h10", "5h no setor"],
    columns: [
      { key: "hd", title: "Hipóteses / Diagnósticos", items: [it("SEPSE DE FOCO PULMONAR"), it("INSUF. RESPIRATÓRIA AGUDA")] },
      { key: "ant", title: "Antecedentes / Comorbidades", items: [it("HAS"), it("DM2"), it("DPOC")] },
      { key: "ex", title: "Exames", items: [it("LACTATO 3,8"), it("LEUCO 18.400"), it("RX: CONSOLIDAÇÃO À D")] },
      { key: "pt", title: "Plano Terapêutico", items: [it("CEFTRIAXONA + AZITROMICINA"), it("RL 30 ML/KG"), it("O2 POR CN 3 L/MIN")] },
      { key: "pp", title: "Programações / Pendências", items: [it("SOLICITADA VAGA DE UTI", true), it("HEMOCULTURAS COLHIDAS", true), it("GASOMETRIA DE CONTROLE")] },
    ],
    target: "pp",
    addText: "REAVALIAR LACTATO ÀS 18H",
    highlightIndex: 2,
    unhighlightIndex: 1,
    dragTo: 0,
    grid: "sm:grid-cols-2 xl:grid-cols-3",
  },
  uti: {
    tone: "uti",
    sector: "UTI 1",
    count: "9/10",
    bed: "U04",
    name: "JOSÉ FICTÍCIO ALMEIDA",
    meta: ["63 anos", "Nasc. 02/08/1963", "Admissão UTI 08/11", "D4 de UTI"],
    forecast: "Previsão de alta: 14/11",
    columns: [
      { key: "adm", title: "Admissão UTI", items: [it("CHOQUE SÉPTICO"), it("IOT NA EMERGÊNCIA")] },
      { key: "hd", title: "Hipóteses / Diagnósticos", items: [it("CHOQUE SÉPTICO FOCO ABDOMINAL"), it("LRA KDIGO 2")] },
      { key: "ant", title: "Antecedentes / Comorbidades", items: [it("HAS"), it("DRC"), it("TABAGISMO")] },
      { key: "disp", title: "Dispositivos", items: [it("TOT D4"), it("CVC JUGULAR D D4"), it("SVD D4")] },
      { key: "atb", title: "Culturas / ATB", items: [it("MEROPENEM D3"), it("HEMOCULTURA: E. COLI")] },
      { key: "dieta", title: "Dieta", items: [it("ENTERAL 40 ML/H")] },
      { key: "pt", title: "Plano Terapêutico", items: [it("DESMAME DE NORADRENALINA"), it("TRE AMANHÃ CEDO")] },
      { key: "pp", title: "Programações / Pendências", items: [it("USG DE ABDOME", true), it("PARECER DA NEFROLOGIA"), it("CONTROLE DE DIURESE")] },
    ],
    target: "pp",
    addText: "FAMÍLIA ÀS 16H",
    highlightIndex: 1,
    unhighlightIndex: 0,
    dragTo: 0,
    grid: "sm:grid-cols-2 xl:grid-cols-4",
  },
};

const STEP = { idle: 0, typing: 1, saved: 2, hlOn: 3, hlOff: 4, lift: 5, move: 6, drop: 7, rest: 8 } as const;
const LAST_STEP = STEP.rest;
const ROW_PX = 26;
const HINTS: Record<number, string> = {
  [STEP.idle]: "Toque no + para acrescentar um item.",
  [STEP.typing]: "Escrevendo direto no leito, sem abrir formulário.",
  [STEP.saved]: "Salvo. A equipe inteira já vê.",
  [STEP.hlOn]: "Um toque no raio destaca o que é prioridade.",
  [STEP.hlOff]: "Resolveu? Outro toque tira o destaque.",
  [STEP.lift]: "Segure e arraste para reorganizar.",
  [STEP.move]: "Segure e arraste para reorganizar.",
  [STEP.drop]: "A ordem nova vale para todo mundo.",
  [STEP.rest]: "Acrescentar, destacar e reorganizar: tudo no próprio leito.",
};

function stepDuration(step: number, bed: BedDemo) {
  switch (step) {
    case STEP.idle: return 1100;
    case STEP.typing: return bed.addText.length * 55 + 350;
    case STEP.saved: return 1000;
    case STEP.hlOn: return 1700;
    case STEP.hlOff: return 1700;
    case STEP.lift: return 700;
    case STEP.move: return 950;
    case STEP.drop: return 900;
    default: return 2600;
  }
}

function MapScene({ reduced }: { reduced: boolean }) {
  const [tab, setTab] = useState<"vermelha" | "uti">("vermelha");
  const [pinned, setPinned] = useState(false);
  const [step, setStep] = useState<number>(reduced ? LAST_STEP : STEP.idle);
  const [typed, setTyped] = useState(0);
  const bed = BEDS[tab];

  // Linha do tempo da demonstração
  useEffect(() => {
    if (reduced) {
      setStep(LAST_STEP);
      return;
    }
    const timer = window.setTimeout(() => {
      if (step < LAST_STEP) {
        setStep(step + 1);
        return;
      }
      // fim do roteiro: alterna o setor (ou repete, se a pessoa escolheu um)
      if (!pinned) setTab((current) => (current === "vermelha" ? "uti" : "vermelha"));
      setStep(STEP.idle);
    }, stepDuration(step, bed));
    return () => window.clearTimeout(timer);
  }, [step, bed, pinned, reduced]);

  // Digitação do item novo
  useEffect(() => {
    if (step !== STEP.typing) return;
    setTyped(0);
    let n = 0;
    const timer = window.setInterval(() => {
      n += 1;
      setTyped(n);
      if (n >= bed.addText.length) window.clearInterval(timer);
    }, 55);
    return () => window.clearInterval(timer);
  }, [step, bed.addText]);

  const choose = (next: "vermelha" | "uti") => {
    setPinned(true);
    setTab(next);
    setStep(reduced ? LAST_STEP : STEP.idle);
  };

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Setor" className="flex gap-2">
        {(["vermelha", "uti"] as const).map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            onClick={() => choose(id)}
            className={`min-h-10 rounded-full border px-4 text-sm font-medium transition-colors ${
              tab === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {id === "vermelha" ? "Emergência · Sala Vermelha" : "UTI"}
          </button>
        ))}
      </div>

      <SectorHeader tone={bed.tone} title={bed.sector} count={bed.count} />

      <div key={tab} className={`rounded-xl border p-3 motion-safe:animate-in motion-safe:fade-in-0 ${SECTOR[bed.tone].wrap}`}>
        <div className="flex flex-wrap items-start gap-3">
          <BedChip tone={bed.tone}>{bed.bed}</BedChip>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{bed.name}</p>
            <p className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-slate-600">
              {bed.meta.map((piece, index) => (
                <span key={piece} className="whitespace-nowrap">
                  {index > 0 && <span aria-hidden className="mr-2 text-slate-300">·</span>}
                  {piece}
                </span>
              ))}
            </p>
          </div>
          {bed.forecast && (
            <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {bed.forecast}
            </span>
          )}
          <MoreVertical className="h-4 w-4 text-slate-400" aria-hidden />
        </div>

        <div className={`mt-3 grid gap-x-4 gap-y-3 ${bed.grid}`}>
          {bed.columns.map((column) =>
            column.key === bed.target ? (
              <AnimatedColumn key={column.key} column={column} bed={bed} step={step} typed={typed} />
            ) : (
              <StaticColumn key={column.key} column={column} />
            ),
          )}
        </div>
      </div>

      <p aria-live="off" className="flex min-h-9 items-center gap-2 rounded-lg bg-secondary/60 px-3 text-xs font-medium text-foreground">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
        {HINTS[step]}
      </p>
    </div>
  );
}

function ColumnTitle({ title, pulse }: { title: string; pulse?: boolean }) {
  return (
    <p className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-500">
      <span className="truncate">{title}</span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-500 ${
          pulse ? "bg-slate-900 text-white ring-4 ring-slate-900/15" : "bg-white/70"
        }`}
        aria-hidden
      >
        <Plus className="h-3 w-3" />
      </span>
    </p>
  );
}

function Row({
  index, text, hl, zapPulse, lifted, offset, animate, typing, saved,
}: {
  index: number; text: string; hl?: boolean; zapPulse?: boolean; lifted?: boolean; offset?: number;
  animate?: boolean; typing?: boolean; saved?: boolean;
}) {
  return (
    <li
      style={{ height: ROW_PX, transform: offset ? `translateY(${offset}px)` : undefined, transition: animate ? "transform 600ms cubic-bezier(.2,.8,.2,1)" : "none" }}
      className={`relative flex items-center gap-1 rounded px-1 text-[11px] text-slate-800 ${hl ? "bg-amber-200/80 font-semibold" : ""} ${
        lifted ? "z-10 bg-white shadow-lg ring-1 ring-slate-300" : ""
      } ${typing ? "border border-dashed border-slate-400 bg-white" : ""}`}
    >
      <GripVertical className={`h-3 w-3 shrink-0 ${lifted ? "text-slate-900" : "text-slate-300"}`} aria-hidden />
      <span className="tabular-nums text-slate-400">{index + 1}.</span>
      <span className="min-w-0 flex-1 truncate">
        {text}
        {typing && <span className="ml-px inline-block h-3 w-px translate-y-0.5 bg-slate-900 motion-safe:animate-pulse" aria-hidden />}
      </span>
      {saved ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${zapPulse ? "bg-amber-500 text-white ring-4 ring-amber-500/25" : ""}`} aria-hidden>
          <Zap className={`h-3 w-3 ${zapPulse ? "" : hl ? "fill-amber-500 text-amber-600" : "text-slate-300"}`} />
        </span>
      )}
    </li>
  );
}

function StaticColumn({ column }: { column: Column }) {
  return (
    <div className="min-w-0">
      <ColumnTitle title={column.title} />
      <ol className="mt-1">
        {column.items.map((item, index) => (
          <Row key={item.id} index={index} text={item.text} hl={item.hl} />
        ))}
      </ol>
    </div>
  );
}

/** Coluna que encena acrescentar, destacar, tirar o destaque e reorganizar. */
function AnimatedColumn({ column, bed, step, typed }: { column: Column; bed: BedDemo; step: number; typed: number }) {
  const base = column.items.map((item, index) => ({
    ...item,
    hl:
      index === bed.highlightIndex ? step >= STEP.hlOn
      : index === bed.unhighlightIndex ? step < STEP.hlOff
      : item.hl,
  }));
  const added: Item | null = step >= STEP.typing ? { id: "__novo", text: step === STEP.typing ? bed.addText.slice(0, typed) : bed.addText } : null;
  const from = base.length; // o item novo nasce no fim da lista
  let rows = added ? [...base, added] : base;
  const reordered = step >= STEP.drop;
  if (added && reordered) {
    rows = [...base];
    rows.splice(bed.dragTo, 0, added);
  }
  const dragging = step === STEP.lift || step === STEP.move;
  const moving = step === STEP.move;

  return (
    <div className="min-w-0">
      <ColumnTitle title={column.title} pulse={step === STEP.idle} />
      <ol className="mt-1">
        {rows.map((item, index) => {
          const isNew = item.id === "__novo";
          let offset = 0;
          if (moving && !reordered) {
            if (isNew) offset = (bed.dragTo - from) * ROW_PX;
            else if (index >= bed.dragTo) offset = ROW_PX;
          }
          return (
            <Row
              key={item.id}
              index={index}
              text={item.text}
              hl={item.hl}
              zapPulse={
                (step === STEP.hlOn && index === bed.highlightIndex && !isNew) ||
                (step === STEP.hlOff && index === bed.unhighlightIndex && !isNew)
              }
              lifted={isNew && dragging}
              offset={offset}
              animate={dragging}
              typing={isNew && step === STEP.typing}
              saved={isNew && step === STEP.saved}
            />
          );
        })}
      </ol>
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

const DOC_GROUPS: { id: string; label: string; docs: string[] }[] = [
  { id: "protocolos", label: "Protocolos", docs: ["Sepse", "AVC", "Dor torácica", "Controle glicêmico", "Ultrassom à beira-leito", "Cuidados paliativos"] },
  { id: "sus", label: "SUS e regulação", docs: ["Regulação SUS", "Laudo de APAC", "Laudo de AIH", "Medicação de alto custo", "OPME", "Priorização cirúrgica"] },
  { id: "solicitacoes", label: "Solicitações", docs: ["Hemoderivados", "SADT", "Tomografias", "Solicitação de culturas", "Requisições especiais", "Liberação de dieta"] },
];

function DocumentsScene() {
  const [group, setGroup] = useState(DOC_GROUPS[1].id);
  const current = DOC_GROUPS.find((g) => g.id === group)!;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Documentos · Hospital de exemplo</p>
        <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-foreground">
          <Upload className="h-3.5 w-3.5" aria-hidden /> Enviar arquivo da unidade
        </span>
      </div>
      <div role="group" aria-label="Tipo de documento" className="flex flex-wrap gap-2">
        {DOC_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={g.id === group}
            onClick={() => setGroup(g.id)}
            className={`min-h-10 rounded-full border px-4 text-sm font-medium transition-colors ${
              g.id === group ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div key={group} className="grid grid-cols-2 gap-2.5 motion-safe:animate-in motion-safe:fade-in-0 lg:grid-cols-3">
        {current.docs.map((name) => (
          <div key={name} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/15">
              <FileText className="h-4 w-4 text-primary" aria-hidden />
            </span>
            <p className="min-w-0 text-sm font-medium leading-snug text-foreground">{name}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Cada unidade monta a própria biblioteca, com os fluxos do SUS e as fichas que ela usa. O plantonista para de procurar papel em pasta de rede e grupo de mensagens.
      </p>
    </div>
  );
}

/* ── Cena: códigos e procedimentos ────────────────────────────────────── */

function CodesScene() {
  const cids = [
    ["A41.9", "Septicemia não especificada"],
    ["J18.9", "Pneumonia não especificada"],
    ["J96.0", "Insuficiência respiratória aguda"],
  ];
  const requests = ["Hemoderivados", "SADT", "OPME", "Alto custo", "Regulação SUS", "Priorização cirúrgica"];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Código CID a partir da hipótese</p>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /> SEPSE DE FOCO PULMONAR
        </div>
        <ul className="space-y-2">
          {cids.map(([code, name], index) => (
            <li key={code} className={`flex items-center gap-3 rounded-xl border p-3 ${index === 0 ? "border-gold/60 bg-gold/10" : "border-border bg-background"}`}>
              <span className="flex h-9 min-w-[4rem] items-center justify-center rounded-lg bg-primary px-2 text-xs font-semibold tabular-nums text-primary-foreground">{code}</span>
              <span className="min-w-0 flex-1 text-sm text-foreground">{name}</span>
              {index === 0 && <Check className="h-4 w-4 shrink-0 text-primary" aria-label="Vinculado ao leito" />}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">O código escolhido fica junto do diagnóstico, no leito V02.</p>
      </div>
      <div className="space-y-2.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Procedimentos e solicitações</p>
        <div className="grid grid-cols-2 gap-2.5">
          {requests.map((name) => (
            <div key={name} className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground">
              {name} <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">As fichas da unidade abrem daqui, sem sair da plataforma.</p>
      </div>
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
