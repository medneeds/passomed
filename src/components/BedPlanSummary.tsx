import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ReceiptText } from "lucide-react";
import { db } from "@/integrations/supabase/untyped";
import { useHospital } from "@/contexts/HospitalContext";
import { BillingSummary, CONTRACT_STATUS_LABEL, formatBRL } from "@/lib/billing";

/**
 * Plano da unidade: leitos contratados × configurados e a mensalidade.
 * A conta é feita no banco (unit_billing_summary); aqui só se exibe.
 */
export function BedPlanSummary() {
  const { currentHospital } = useHospital();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!currentHospital?.id) return;
    const { data, error } = await db.rpc("unit_billing_summary", { _hospital_unit_id: currentHospital.id });
    if (error) {
      setFailed(true);
    } else {
      setFailed(false);
      setSummary(data as BillingSummary);
    }
    setLoading(false);
  }, [currentHospital?.id]);

  useEffect(() => {
    load();
    window.addEventListener("passomed:bed-capacity-updated", load);
    return () => window.removeEventListener("passomed:bed-capacity-updated", load);
  }, [load]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando plano…
        </CardContent>
      </Card>
    );
  }
  if (failed || !summary) return null;

  const contracted = summary.contracted_beds;
  const remaining = contracted === null ? null : contracted - summary.configured_beds;
  const activeItems = summary.items.filter((item) => item.beds > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ReceiptText className="h-5 w-5 text-primary" /> Plano por leito
          </CardTitle>
          {summary.status && (
            <Badge variant={summary.status === "active" ? "default" : "secondary"}>
              {CONTRACT_STATUS_LABEL[summary.status] ?? summary.status}
            </Badge>
          )}
        </div>
        <CardDescription>
          {formatBRL(summary.price_per_bed_cents)} por leito fixo ao mês. Leitos extras de corredor não são cobrados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Leitos configurados</p>
            <p className="text-2xl font-bold tabular-nums">
              {summary.configured_beds}
              {contracted !== null && (
                <span className="text-sm font-normal text-muted-foreground"> de {contracted} contratados</span>
              )}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mensalidade</p>
            <p className="text-2xl font-bold tabular-nums">{formatBRL(summary.contracted_monthly_cents)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {contracted === null ? "Contrato" : "Disponíveis para configurar"}
            </p>
            <p className="text-2xl font-bold tabular-nums">
              {contracted === null ? "Sem limite" : Math.max(0, remaining ?? 0)}
            </p>
          </div>
        </div>

        {activeItems.length > 0 && (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Setor</th>
                  <th className="px-3 py-2 text-right font-medium">Leitos</th>
                  <th className="px-3 py-2 text-right font-medium">Valor/mês</th>
                </tr>
              </thead>
              <tbody>
                {activeItems.map((item) => (
                  <tr key={`${item.department}|${item.sector}`} className="border-t">
                    <td className="px-3 py-2">
                      {item.label}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {item.department === "UTI" ? "" : item.department.includes("PEDIÁTRICA") ? "UE Pediátrica" : "UE Adulto"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{item.beds}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatBRL(item.amount_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {contracted !== null && (
          <p className="text-xs text-muted-foreground">
            Para configurar mais leitos do que o contratado, solicite a ampliação do contrato ao suporte da plataforma.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
