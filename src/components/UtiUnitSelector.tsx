import { Patient } from "@/types/patient";
import { Activity, ArrowRight, BedDouble, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface UtiUnitSelectorProps {
  patients: Patient[];
  onSelect: (unit: 'UTI 1' | 'UTI 2') => void;
}

export function UtiUnitSelector({ patients, onSelect }: UtiUnitSelectorProps) {
  // UTI 1 = sector 'blue' or 'red' | UTI 2 = sector 'yellow'
  const uti1 = patients.filter(p => p.sector === 'blue' || p.sector === 'red');
  const uti2 = patients.filter(p => p.sector === 'yellow');

  const occ = (list: Patient[]) => list.filter(p => p.name && !p.isVacant).length;

  const cards: Array<{
    unit: 'UTI 1' | 'UTI 2';
    title: string;
    subtitle: string;
    accentBorder: string;
    accentDot: string;
    list: Patient[];
  }> = [
    {
      unit: 'UTI 1',
      title: 'Unidade de Terapia Intensiva 1',
      subtitle: 'Leitos U01 — U10',
      accentBorder: 'border-l-primary/70',
      accentDot: 'bg-primary',
      list: uti1,
    },
    {
      unit: 'UTI 2',
      title: 'Unidade de Terapia Intensiva 2',
      subtitle: 'Leitos U01 — U10',
      accentBorder: 'border-l-gold/80',
      accentDot: 'bg-gold',
      list: uti2,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center px-4 py-10">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/30 mb-4">
            <Activity className="h-3.5 w-3.5 text-primary dark:text-primary-glow" />
            <span className="text-[11px] uppercase tracking-wider font-semibold text-primary dark:text-primary-glow">
              Setor UTI
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Selecione a unidade
          </h1>
          <p className="text-sm text-muted-foreground">
            Escolha qual UTI você deseja visualizar e gerenciar agora.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {cards.map((c) => {
            const occupied = occ(c.list);
            const total = c.list.length || 10;
            return (
              <button
                key={c.unit}
                onClick={() => onSelect(c.unit)}
                className={cn(
                  "group text-left rounded-2xl border bg-card",
                  "border-emerald-200/50 dark:border-emerald-900/40",
                  "border-l-[3px]", c.accentBorder,
                  "p-6 sm:p-7 shadow-sm hover:shadow-gold transition-all duration-300",
                  "hover:-translate-y-0.5 hover:border-gold/50"
                )}
              >
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary/80 dark:text-primary-glow/90 mb-1">
                      <span className={cn("h-1.5 w-1.5 rounded-full", c.accentDot)} />
                      {c.unit}
                    </p>
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground leading-tight">
                      {c.title}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.subtitle}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-primary border border-gold/50 shadow-md">
                    <BedDouble className="h-5 w-5 text-gold" strokeWidth={2.25} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-emerald-100 dark:border-emerald-900/40">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary dark:text-primary-glow" strokeWidth={2.25} />
                      <span className="text-xs text-muted-foreground">Ocupados</span>
                      <span className="text-sm font-semibold text-foreground">
                        {occupied}/{total}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary dark:text-primary-glow group-hover:text-gold transition-colors">
                    Entrar
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-8">
          Você poderá alternar entre as unidades a qualquer momento pelo seletor no topo.
        </p>
      </div>
    </div>
  );
}
