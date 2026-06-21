import { useEffect, useState } from "react";
import { Activity, AlertCircle, Bed, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Pill, Stethoscope, TestTube2, Wind } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

/**
 * Mockup interativo da plataforma — tabela horizontal (linhas = pacientes,
 * colunas = Hipótese / Plano / Exames / Programações / Pendências). Em telas
 * estreitas a primeira coluna (Leito/Paciente) fica sticky e o restante
 * rola horizontalmente, evitando escape de informação.
 *
 * Swipe horizontal entre setores: Urgência, UTI e Enfermaria.
 */

type Status = "stable" | "attention" | "critical";

const statusDot: Record<Status, string> = {
  stable: "bg-stable",
  attention: "bg-warning",
  critical: "bg-critical",
};

const statusLabel: Record<Status, string> = {
  stable: "ESTÁVEL",
  attention: "ATENÇÃO",
  critical: "GRAVE",
};

interface BedCardData {
  bed: string;
  sector: string;
  status: Status;
  stayTime: string;
  patient: string;
  age: string;
  hipotese: string;
  plano: string[];
  exames?: string[];
  programacoes?: string[];
  pendencias?: string[];
  highlight?: string;
}

// ─── Linha (paciente) e Tabela ──────────────────────────────────────────

const COL_WIDTHS = {
  leito: "w-[200px] min-w-[200px]",
  hipotese: "w-[220px] min-w-[220px]",
  plano: "w-[240px] min-w-[240px]",
  exames: "w-[200px] min-w-[200px]",
  programacoes: "w-[200px] min-w-[200px]",
  pendencias: "w-[220px] min-w-[220px]",
} as const;

const ColHeader = ({
  icon: Icon,
  label,
  className,
  tone = "muted",
}: {
  icon: typeof Activity;
  label: string;
  className?: string;
  tone?: "muted" | "gold";
}) => (
  <div
    className={`flex items-center gap-1 text-[0.6rem] font-semibold tracking-[0.18em] uppercase ${
      tone === "gold" ? "text-gold" : "text-muted-foreground"
    } ${className ?? ""}`}
  >
    <Icon className="h-2.5 w-2.5" />
    {label}
  </div>
);

const Bullets = ({
  items,
  marker = "·",
  markerClass = "text-primary/70",
}: {
  items?: string[];
  marker?: string;
  markerClass?: string;
}) =>
  items && items.length ? (
    <ul className="space-y-0.5 text-[0.7rem] text-foreground/80 leading-snug">
      {items.map((it) => (
        <li key={it} className="flex gap-1.5">
          <span className={markerClass}>{marker}</span>
          <span className="break-words">{it}</span>
        </li>
      ))}
    </ul>
  ) : (
    <span className="text-[0.65rem] text-muted-foreground/60">—</span>
  );

const BedRow = ({ data }: { data: BedCardData }) => (
  <div className="flex border-t border-border/60 hover:bg-accent/30 transition-colors">
    {/* Leito + Paciente (sticky em mobile) */}
    <div
      className={`${COL_WIDTHS.leito} sticky left-0 z-10 bg-card border-r border-border/60 p-3 flex flex-col gap-1.5`}
    >
      <div className="flex items-center justify-between text-[0.6rem] font-semibold tracking-wider">
        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-primary">
          <Bed className="h-2.5 w-2.5" /> {data.bed}
        </span>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${statusDot[data.status]}`} />
          {statusLabel[data.status]}
        </span>
      </div>
      <div className="font-landing-sans text-sm font-semibold text-foreground tracking-tight leading-tight break-words">
        {data.patient}
      </div>
      <div className="text-[0.6rem] text-muted-foreground tabular-nums">
        {data.age} · {data.stayTime} · {data.sector}
      </div>
    </div>

    <div className={`${COL_WIDTHS.hipotese} p-3 border-r border-border/60`}>
      <p className="text-xs font-medium text-foreground leading-snug break-words">
        {data.hipotese}
      </p>
    </div>

    <div className={`${COL_WIDTHS.plano} p-3 border-r border-border/60`}>
      <Bullets items={data.plano} />
    </div>

    <div className={`${COL_WIDTHS.exames} p-3 border-r border-border/60`}>
      <Bullets items={data.exames} markerClass="text-muted-foreground" />
    </div>

    <div className={`${COL_WIDTHS.programacoes} p-3 border-r border-border/60`}>
      <Bullets items={data.programacoes} markerClass="text-muted-foreground" />
    </div>

    <div className={`${COL_WIDTHS.pendencias} p-3`}>
      {data.pendencias && data.pendencias.length ? (
        <Bullets items={data.pendencias} marker="→" markerClass="text-gold" />
      ) : (
        <span className="text-[0.65rem] text-muted-foreground/60">—</span>
      )}
    </div>
  </div>
);

const SectorTable = ({ beds }: { beds: BedCardData[] }) => (
  <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <div className="min-w-max">
        {/* Header */}
        <div className="flex bg-secondary/60 border-b border-border">
          <div className={`${COL_WIDTHS.leito} sticky left-0 z-10 bg-secondary/80 backdrop-blur border-r border-border p-3`}>
            <ColHeader icon={Bed} label="Leito · Paciente" />
          </div>
          <div className={`${COL_WIDTHS.hipotese} p-3 border-r border-border`}>
            <ColHeader icon={Stethoscope} label="Hipótese diagnóstica" tone="gold" />
          </div>
          <div className={`${COL_WIDTHS.plano} p-3 border-r border-border`}>
            <ColHeader icon={Pill} label="Plano terapêutico" />
          </div>
          <div className={`${COL_WIDTHS.exames} p-3 border-r border-border`}>
            <ColHeader icon={TestTube2} label="Exames" />
          </div>
          <div className={`${COL_WIDTHS.programacoes} p-3 border-r border-border`}>
            <ColHeader icon={ClipboardList} label="Programações" />
          </div>
          <div className={`${COL_WIDTHS.pendencias} p-3`}>
            <ColHeader icon={AlertCircle} label="Pendências" tone="gold" />
          </div>
        </div>

        {/* Rows */}
        {beds.map((b) => (
          <BedRow key={b.bed} data={b} />
        ))}
      </div>
    </div>
  </div>
);

// ─── Mock data por setor ──────────────────────────────────────────────────

const URGENCIA: BedCardData[] = [
  {
    bed: "A03", sector: "URGÊNCIA · ADULTO", status: "critical", stayTime: "01:12h",
    patient: "M. R. SOUZA", age: "58/M",
    hipotese: "DOR TORÁCICA EM INVESTIGAÇÃO · IAM?",
    plano: ["AAS 300mg VO ataque", "Clopidogrel 300mg VO", "Monitorização contínua"],
    exames: ["Troponina seriada", "ECG 12 derivações"],
    programacoes: ["Risco TIMI 14h", "Cateterismo?"],
    pendencias: ["Discutir hemodinâmica", "Confirmar leito UTI"],
  },
  {
    bed: "V02", sector: "OBSERVAÇÃO", status: "attention", stayTime: "06:48h",
    patient: "A. P. LIMA", age: "71/F",
    hipotese: "ITU COMPLICADA · SEPSE EM RESOLUÇÃO",
    plano: ["Ceftriaxone 1g IV 12/12h", "Hidratação 1500mL/24h"],
    exames: ["Urocultura D+2", "PCR controle"],
    programacoes: ["Reavaliação clínica 18h"],
    pendencias: ["Liberar alta hospitalar?"],
  },
  {
    bed: "A07", sector: "URGÊNCIA · ADULTO", status: "stable", stayTime: "02:34h",
    patient: "J. C. ALVES", age: "44/M",
    hipotese: "LOMBALGIA AGUDA SEM SINAIS DE GRAVIDADE",
    plano: ["Dipirona 1g IV 6/6h", "Tramadol 100mg IV se EVA>6"],
    exames: ["RX coluna lombar"],
    pendencias: ["Reavaliar dor pós-analgesia"],
  },
];

const UTI: BedCardData[] = [
  {
    bed: "U04", sector: "UTI 1", status: "critical", stayTime: "3d 14h",
    patient: "R. F. CASTRO", age: "67/M",
    hipotese: "CHOQUE SÉPTICO · FOCO PULMONAR",
    plano: ["Noradrenalina 0,4 mcg/kg/min", "Piperacilina-tazobactam 4,5g 8/8h", "VM PCV PEEP 10"],
    exames: ["Gaso arterial 6/6h", "Lactato controle"],
    programacoes: ["Desmame sedoanalgesia 06h", "Cultura sangue D+3"],
    pendencias: ["Avaliar TC tórax", "Reunião família 16h"],
  },
  {
    bed: "U07", sector: "UTI 2", status: "attention", stayTime: "1d 09h",
    patient: "E. M. NUNES", age: "52/F",
    hipotese: "AVC ISQUÊMICO ACM ESQUERDA · PÓS-TROMBÓLISE",
    plano: ["AAS 100mg VO 24h pós-rtPA", "Atorvastatina 80mg"],
    exames: ["TC controle 24h", "Doppler carótidas"],
    programacoes: ["Avaliação neuro 12/12h", "Fonoaudiologia"],
    pendencias: ["Iniciar reabilitação motora"],
  },
  {
    bed: "U02", sector: "UTI 1", status: "stable", stayTime: "5d 02h",
    patient: "L. S. PEREIRA", age: "73/M",
    hipotese: "PÓS-OP CIRURGIA CARDÍACA · RVA + RVM",
    plano: ["Heparina profilática", "Furosemida 20mg IV"],
    exames: ["Eco transtorácico controle"],
    programacoes: ["Extubação programada", "Transferência semi-intensiva"],
    pendencias: ["Validar transferência com equipe"],
  },
];

const ENFERMARIA: BedCardData[] = [
  {
    bed: "203B", sector: "ENF · CLÍNICA", status: "stable", stayTime: "2d 06h",
    patient: "C. T. RIBEIRO", age: "62/F",
    hipotese: "PNEUMONIA COMUNITÁRIA · CURB-65 = 1",
    plano: ["Amoxicilina-clavulanato 875mg 12/12h", "Sintomáticos"],
    exames: ["Hemograma controle", "RX tórax D+5"],
    programacoes: ["Fisioterapia respiratória 2x/dia"],
    pendencias: ["Avaliar critérios de alta"],
  },
  {
    bed: "214A", sector: "ENF · CIRÚRGICA", status: "attention", stayTime: "1d 03h",
    patient: "P. H. MENDES", age: "48/M",
    hipotese: "PÓS-OP COLECISTECTOMIA · DOR PERSISTENTE",
    plano: ["Dipirona 1g VO 6/6h", "Curativo diário"],
    exames: ["USG abdome se persistência"],
    programacoes: ["Avaliação cirúrgica 11h"],
    pendencias: ["Confirmar drenagem cirúrgica"],
  },
  {
    bed: "208C", sector: "ENF · CLÍNICA", status: "stable", stayTime: "4d 18h",
    patient: "S. A. CARVALHO", age: "69/F",
    hipotese: "ICC DESCOMPENSADA · NYHA III",
    plano: ["Furosemida 40mg IV 12/12h", "Carvedilol 12,5mg VO 12/12h"],
    exames: ["BNP controle", "Eletrólitos diários"],
    programacoes: ["Pesagem diária", "Restrição hídrica 1000mL"],
    pendencias: ["Otimizar dose IECA"],
  },
];

interface SectorScreen {
  id: string;
  label: string;
  sectorTag: string;
  icon: typeof Activity;
  beds: BedCardData[];
  summary: { total: number; ocupados: number; pendencias: number };
}

const SCREENS: SectorScreen[] = [
  {
    id: "urgencia",
    label: "Urgência & Emergência",
    sectorTag: "URG",
    icon: Activity,
    beds: URGENCIA,
    summary: { total: 18, ocupados: 14, pendencias: 9 },
  },
  {
    id: "uti",
    label: "UTI",
    sectorTag: "UTI",
    icon: Wind,
    beds: UTI,
    summary: { total: 10, ocupados: 10, pendencias: 5 },
  },
  {
    id: "enfermaria",
    label: "Enfermaria",
    sectorTag: "ENF",
    icon: CheckCircle2,
    beds: ENFERMARIA,
    summary: { total: 32, ocupados: 27, pendencias: 12 },
  },
];

export function PlatformPreview({ compact = false }: { compact?: boolean }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  return (
    <div className="relative">
      {/* Browser frame */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-lg overflow-hidden">
        {/* macOS-style title bar */}
        <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <div className="ml-3 flex-1 rounded-md bg-background/60 px-3 py-1 text-[0.65rem] text-muted-foreground text-center max-w-xs mx-auto truncate">
            passomed.com.br · Mapa de Leitos
          </div>
        </div>

        {/* Sector tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {SCREENS.map((s, i) => {
              const Icon = s.icon;
              const active = i === selected;
              return (
                <button
                  key={s.id}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {s.label}
                </button>
              );
            })}
          </div>
          <div className="hidden md:flex items-center gap-4 text-[0.65rem] text-muted-foreground tabular-nums">
            <span><span className="text-foreground font-semibold">{SCREENS[selected].summary.ocupados}</span>/{SCREENS[selected].summary.total} leitos</span>
            <span><span className="text-gold font-semibold">{SCREENS[selected].summary.pendencias}</span> pendências</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Tempo real
            </span>
          </div>
        </div>

        {/* Embla viewport */}
        <div ref={emblaRef} className="overflow-hidden bg-secondary/20">
          <div className="flex">
            {SCREENS.map((s) => (
              <div key={s.id} className="relative shrink-0 grow-0 basis-full p-4 md:p-6">
                <SectorTable beds={s.beds} />
                <p className="mt-2 text-[0.65rem] text-muted-foreground md:hidden text-center">
                  Deslize a tabela horizontalmente para ver todas as colunas →
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer with arrows + dots */}
        <div className="flex items-center justify-between border-t border-border bg-background px-4 py-2.5">
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            aria-label="Setor anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-1.5">
            {SCREENS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === selected ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40"
                }`}
                aria-label={`Ir para ${s.label}`}
              />
            ))}
          </div>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            aria-label="Próximo setor"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Floating annotations (only on desktop, only first view) */}
      <div className="hidden lg:flex absolute -left-5 top-32 items-center gap-2 rounded-full border border-border bg-card/95 backdrop-blur px-3.5 py-1.5 shadow-md pointer-events-none">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-medium text-foreground">Tempo real</span>
      </div>
      <div className="hidden lg:flex absolute -right-5 top-1/2 items-center gap-2 rounded-full border border-border bg-card/95 backdrop-blur px-3.5 py-1.5 shadow-md pointer-events-none">
        <span className="h-2 w-2 rounded-full bg-gold" />
        <span className="text-xs font-medium text-foreground">Plantão pronto</span>
      </div>
    </div>
  );
}