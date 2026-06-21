import { useEffect, useState } from "react";
import { Activity, AlertCircle, Bed, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Pill, Stethoscope, TestTube2, Wind } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

/**
 * Mockup interativo da plataforma — substitui as imagens geradas por
 * componentes React reais, com nomenclatura fiel ao PassoMed:
 * Hipótese Diagnóstica, Exames, Plano Terapêutico, Programações, Pendências.
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

const BedCard = ({ data }: { data: BedCardData }) => (
  <article className="rounded-xl border border-border bg-card p-3.5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-2.5">
    {/* Header */}
    <header className="flex items-center justify-between text-[0.65rem] font-semibold tracking-wider">
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-primary">
          <Bed className="h-2.5 w-2.5" /> {data.bed}
        </span>
        <span className="text-muted-foreground">{data.sector}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${statusDot[data.status]}`} />
        <span className="text-muted-foreground">{statusLabel[data.status]}</span>
      </div>
    </header>

    {/* Patient */}
    <div className="flex items-baseline justify-between">
      <h4 className="font-landing-sans text-sm font-semibold text-foreground tracking-tight">
        {data.patient}
      </h4>
      <span className="text-[0.65rem] text-muted-foreground tabular-nums">{data.age} · {data.stayTime}</span>
    </div>

    {/* Hipótese */}
    <div>
      <div className="flex items-center gap-1 text-[0.6rem] font-semibold tracking-[0.18em] text-gold uppercase">
        <Stethoscope className="h-2.5 w-2.5" />
        Hipótese diagnóstica
      </div>
      <p className="mt-0.5 text-xs font-medium text-foreground leading-snug">{data.hipotese}</p>
    </div>

    {/* Plano */}
    <div>
      <div className="flex items-center gap-1 text-[0.6rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        <Pill className="h-2.5 w-2.5" />
        Plano terapêutico
      </div>
      <ul className="mt-0.5 space-y-0.5 text-[0.7rem] text-foreground/80 leading-snug">
        {data.plano.map((p) => (
          <li key={p} className="flex gap-1.5">
            <span className="text-primary/70">·</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>

    {/* Exames + Programações (grid) */}
    {(data.exames || data.programacoes) && (
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
        {data.exames && (
          <div>
            <div className="flex items-center gap-1 text-[0.6rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              <TestTube2 className="h-2.5 w-2.5" />
              Exames
            </div>
            <ul className="mt-0.5 space-y-0.5 text-[0.65rem] text-foreground/75 leading-snug">
              {data.exames.map((e) => <li key={e}>· {e}</li>)}
            </ul>
          </div>
        )}
        {data.programacoes && (
          <div>
            <div className="flex items-center gap-1 text-[0.6rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              <ClipboardList className="h-2.5 w-2.5" />
              Programações
            </div>
            <ul className="mt-0.5 space-y-0.5 text-[0.65rem] text-foreground/75 leading-snug">
              {data.programacoes.map((p) => <li key={p}>· {p}</li>)}
            </ul>
          </div>
        )}
      </div>
    )}

    {/* Pendências */}
    {data.pendencias && (
      <div className="pt-1 border-t border-border/60">
        <div className="flex items-center justify-between text-[0.6rem] font-semibold tracking-[0.18em] uppercase">
          <div className="flex items-center gap-1 text-gold">
            <AlertCircle className="h-2.5 w-2.5" />
            Pendências
          </div>
          <span className="inline-flex items-center justify-center rounded-full bg-gold/15 px-1.5 py-0.5 text-gold text-[0.6rem] font-bold">
            {data.pendencias.length}
          </span>
        </div>
        <ul className="mt-0.5 space-y-0.5 text-[0.65rem] text-foreground/80 leading-snug">
          {data.pendencias.map((p) => (
            <li key={p} className="flex gap-1">
              <span className="text-gold">→</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </article>
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
                <div className={`grid gap-3 ${compact ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-3"}`}>
                  {s.beds.map((b) => <BedCard key={b.bed} data={b} />)}
                </div>
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