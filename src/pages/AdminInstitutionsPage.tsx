import { useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/integrations/supabase/untyped";
import { CONTRACT_STATUS_LABEL, formatBRL, monthlyCents, PRICE_PER_BED_CENTS } from "@/lib/billing";

interface OverviewRow {
  hospital_unit_id: string;
  hospital_name: string;
  state_abbreviation: string | null;
  slug: string | null;
  status: string | null;
  contracted_beds: number | null;
  configured_beds: number;
  price_per_bed_cents: number;
  monthly_cents: number;
  started_on: string | null;
}

const UE = "URGÊNCIA E EMERGÊNCIA ADULTO";
const UE_PED = "URGÊNCIA E EMERGÊNCIA PEDIÁTRICA";

/** Setores que podem ser contratados, na ordem em que aparecem no formulário. */
const SECTORS: { department: string; sector: string; label: string }[] = [
  { department: UE, sector: "red", label: "UE Adulto · Sala Vermelha" },
  { department: UE, sector: "yellow", label: "UE Adulto · Observação Amarela" },
  { department: UE, sector: "blue", label: "UE Adulto · Observação Azul" },
  { department: UE_PED, sector: "red", label: "UE Pediátrica · Sala Vermelha" },
  { department: UE_PED, sector: "yellow", label: "UE Pediátrica · Observação Amarela" },
  { department: UE_PED, sector: "blue", label: "UE Pediátrica · Observação Azul" },
  { department: "UTI", sector: "blue", label: "UTI 1" },
  { department: "UTI", sector: "yellow", label: "UTI 2" },
];
const keyOf = (department: string, sector: string) => `${department}|${sector}`;

export default function AdminInstitutionsPage() {
  const [rows, setRows] = useState<OverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<OverviewRow | null>(null);
  const [beds, setBeds] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("trial");
  const [price, setPrice] = useState("25");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await db.rpc("platform_billing_overview");
    if (error) toast.error("Não foi possível carregar as instituições: " + error.message);
    else setRows((data || []) as OverviewRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => {
    const billable = rows.filter((row) => row.status === "active");
    return {
      institutions: rows.length,
      activeInstitutions: billable.length,
      activeBeds: billable.reduce((sum, row) => sum + (row.contracted_beds ?? 0), 0),
      mrrCents: billable.reduce((sum, row) => sum + row.monthly_cents, 0),
    };
  }, [rows]);

  const openEditor = async (row: OverviewRow) => {
    setEditing(row);
    setStatus(row.status ?? "trial");
    setPrice(String((row.price_per_bed_cents ?? PRICE_PER_BED_CENTS) / 100).replace(".", ","));
    const { data } = await db
      .from("sector_bed_capacities")
      .select("department, sector, fixed_bed_count")
      .eq("hospital_unit_id", row.hospital_unit_id);
    const next: Record<string, string> = {};
    SECTORS.forEach(({ department, sector }) => {
      const found = (data || []).find((c: { department: string; sector: string }) => c.department === department && c.sector === sector);
      // Sem contrato ainda: começa zerado para o operador digitar só o que foi vendido.
      next[keyOf(department, sector)] = found ? String(found.fixed_bed_count) : "0";
    });
    setBeds(next);
  };

  const draftTotal = SECTORS.reduce((sum, { department, sector }) => {
    const value = parseInt(beds[keyOf(department, sector)] ?? "0", 10);
    return sum + (Number.isNaN(value) ? 0 : Math.max(0, value));
  }, 0);
  const priceCents = Math.round(parseFloat(price.replace(",", ".")) * 100);
  const priceValid = Number.isFinite(priceCents) && priceCents >= 0;

  const handleSave = async () => {
    if (!editing) return;
    if (!priceValid) {
      toast.error("Informe um preço por leito válido.");
      return;
    }
    const invalid = SECTORS.some(({ department, sector }) => {
      const value = parseInt(beds[keyOf(department, sector)] ?? "0", 10);
      return Number.isNaN(value) || value < 0 || value > 60;
    });
    if (invalid) {
      toast.error("Cada setor aceita de 0 a 60 leitos.");
      return;
    }
    setSaving(true);
    const { error } = await db.rpc("provision_unit_beds", {
      p_hospital_unit_id: editing.hospital_unit_id,
      p_beds: SECTORS.map(({ department, sector }) => ({
        department, sector, beds: parseInt(beds[keyOf(department, sector)] ?? "0", 10),
      })),
      p_status: status,
      p_price_per_bed_cents: priceCents,
    });
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar o contrato: " + error.message);
      return;
    }
    toast.success(`Contrato salvo: ${draftTotal} leitos, ${formatBRL(monthlyCents(draftTotal, priceCents))}/mês.`);
    setEditing(null);
    load();
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-6xl p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Instituições e receita</h1>
            <p className="text-sm text-muted-foreground">
              Visão do operador da plataforma: leitos contratados e mensalidade de cada instituição.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Instituições" value={`${totals.activeInstitutions} ativas de ${totals.institutions}`} />
          <Stat label="Leitos em contratos ativos" value={String(totals.activeBeds)} />
          <Stat label="Receita mensal recorrente" value={formatBRL(totals.mrrCents)} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contratos</CardTitle>
            <CardDescription>
              Só contratos com situação “Ativo” entram na receita e geram fatura mensal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma unidade cadastrada. Comece em “Cadastrar unidades”.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr className="border-b">
                      <th className="py-2 pr-3 font-medium">Instituição</th>
                      <th className="py-2 pr-3 font-medium">Situação</th>
                      <th className="py-2 pr-3 text-right font-medium">Contratados</th>
                      <th className="py-2 pr-3 text-right font-medium">Configurados</th>
                      <th className="py-2 pr-3 text-right font-medium">Mensalidade</th>
                      <th className="py-2 font-medium"><span className="sr-only">Ações</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.hospital_unit_id} className="border-b last:border-0">
                        <td className="py-2 pr-3">
                          <p className="font-medium">{row.hospital_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {[row.state_abbreviation, row.slug ? `/auth?i=${row.slug}` : null].filter(Boolean).join(" · ")}
                          </p>
                        </td>
                        <td className="py-2 pr-3">
                          {row.status ? (
                            <Badge variant={row.status === "active" ? "default" : "secondary"}>
                              {CONTRACT_STATUS_LABEL[row.status] ?? row.status}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem contrato</span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">{row.contracted_beds ?? "—"}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{row.configured_beds}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {row.contracted_beds === null ? "—" : formatBRL(row.monthly_cents)}
                        </td>
                        <td className="py-2 text-right">
                          <Button variant="outline" size="sm" onClick={() => openEditor(row)}>
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="ml-1.5">Contrato</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Contrato — {editing?.hospital_name}</DialogTitle>
            <DialogDescription>
              Informe os leitos vendidos por setor. O hospital não consegue configurar mais leitos do que o total daqui.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Situação</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTRACT_STATUS_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Preço por leito (R$)</Label>
                <Input id="price" inputMode="decimal" value={price} aria-invalid={!priceValid}
                  onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              {SECTORS.map(({ department, sector, label }) => (
                <div key={keyOf(department, sector)} className="flex items-center justify-between gap-3">
                  <Label htmlFor={keyOf(department, sector)} className="font-normal">{label}</Label>
                  <Input
                    id={keyOf(department, sector)} type="number" min={0} max={60} className="w-24"
                    value={beds[keyOf(department, sector)] ?? "0"}
                    onChange={(e) => setBeds((current) => ({ ...current, [keyOf(department, sector)]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <span className="font-medium">{draftTotal} leitos</span>
              {priceValid && (
                <> × {formatBRL(priceCents)} = <span className="font-semibold">{formatBRL(monthlyCents(draftTotal, priceCents))} por mês</span></>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
