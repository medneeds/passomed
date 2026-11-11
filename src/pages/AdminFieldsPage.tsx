import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { DEPARTMENTS, DEPARTMENT_LABELS } from "@/contexts/DepartmentContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useFieldSettings } from "@/hooks/useFieldSettings";
import { fieldCatalog } from "@/lib/fieldSettings";

/**
 * Painel da gestão: quais campos do leito cada setor da unidade registra.
 * Desligar um campo o tira do mapa para toda a equipe; o que já foi escrito
 * fica guardado e volta ao religar.
 */
export default function AdminFieldsPage() {
  const { currentHospital } = useHospital();
  const { hiddenByDepartment, saveHiddenFields } = useFieldSettings();
  const [saving, setSaving] = useState<string | null>(null);

  const toggle = async (department: string, key: string, visible: boolean) => {
    const current = hiddenByDepartment[department] ?? [];
    const next = visible ? current.filter((k) => k !== key) : [...current, key];
    setSaving(`${department}|${key}`);
    const { error } = await saveHiddenFields(department, next);
    setSaving(null);
    if (error) toast.error("Não foi possível salvar. Tente novamente.");
    else toast.success(visible ? "Campo ligado para a equipe." : "Campo desligado para a equipe.");
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-5xl p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Campos do leito</h1>
            <p className="text-sm text-muted-foreground">
              {currentHospital?.name ?? "Unidade atual"} — escolha o que cada setor registra. Um campo
              desligado some do mapa para toda a equipe; o que já foi escrito continua guardado e
              volta se você religar.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {DEPARTMENTS.map((department) => {
            const hidden = hiddenByDepartment[department] ?? [];
            const options = fieldCatalog(department);
            const visibleCount = options.filter((o) => o.locked || !hidden.includes(o.key)).length;
            return (
              <Card key={department}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-lg">{DEPARTMENT_LABELS[department]}</CardTitle>
                    <Badge variant="secondary" className="whitespace-nowrap">
                      {visibleCount} de {options.length} campos
                    </Badge>
                  </div>
                  <CardDescription>{department}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {options.map((option) => {
                    const id = `field-${department}-${option.key}`;
                    const visible = option.locked || !hidden.includes(option.key);
                    const busy = saving === `${department}|${option.key}`;
                    return (
                      <label
                        key={option.key}
                        htmlFor={id}
                        className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{option.label}</span>
                          {(option.hint || option.locked) && (
                            <span className="block text-xs text-muted-foreground">
                              {option.locked ? "Campo essencial, sempre visível" : option.hint}
                            </span>
                          )}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                          <Switch
                            id={id}
                            checked={visible}
                            disabled={option.locked || saving !== null}
                            onCheckedChange={(checked) => toggle(department, option.key, checked)}
                          />
                        </span>
                      </label>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
