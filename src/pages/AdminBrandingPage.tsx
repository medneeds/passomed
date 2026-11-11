import { useEffect, useMemo, useRef, useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Palette, RotateCcw, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/integrations/supabase/untyped";
import { useHospital } from "@/contexts/HospitalContext";
import { useBranding } from "@/contexts/BrandingContext";
import { InstitutionBranding } from "@/config/whitelabel";
import { brandHexTones, contrastRatio, DEFAULT_BRAND, isHexColor, normalizeHex } from "@/lib/brandColors";
import { isValidSlug } from "@/lib/institutionSlug";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const DEFAULT_ACCENT = "#c9a236";

interface FormState {
  display_name: string;
  network_name: string;
  slug: string;
  tagline: string;
  primary_color: string;
  accent_color: string;
  logo_url: string;
}

const EMPTY: FormState = {
  display_name: "",
  network_name: "",
  slug: "",
  tagline: "",
  primary_color: "",
  accent_color: "",
  logo_url: "",
};

function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (letters || name.slice(0, 3).toUpperCase() || "HOSP").slice(0, 6);
}

export default function AdminBrandingPage() {
  const { currentHospital } = useHospital();
  const { refreshBranding, previewBranding } = useBranding();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const savedRef = useRef<InstitutionBranding | null>(null);

  useEffect(() => {
    if (!currentHospital?.id) return;
    let cancelled = false;
    setLoading(true);
    db.from("institution_branding")
      .select("*")
      .eq("hospital_unit_id", currentHospital.id)
      .maybeSingle()
      .then(({ data }: { data: InstitutionBranding | null }) => {
        if (cancelled) return;
        savedRef.current = data;
        setForm({
          display_name: data?.display_name ?? currentHospital.name ?? "",
          network_name: data?.network_name ?? "",
          slug: data?.slug ?? "",
          tagline: data?.tagline ?? "",
          primary_color: data?.primary_color ?? "",
          accent_color: data?.accent_color ?? "",
          logo_url: data?.logo_url ?? "",
        });
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentHospital?.id, currentHospital?.name]);

  // Ao sair da tela sem salvar, volta a marca gravada.
  useEffect(() => () => previewBranding(savedRef.current), [previewBranding]);

  const set = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }));

  const primaryValid = !form.primary_color || isHexColor(form.primary_color);
  const accentValid = !form.accent_color || isHexColor(form.accent_color);
  const slugValid = !form.slug || isValidSlug(form.slug);
  const tones = useMemo(
    () => brandHexTones(isHexColor(form.primary_color) ? form.primary_color : null),
    [form.primary_color],
  );
  const contrast = contrastRatio(tones.deep, "#ffffff");

  const draft = (): InstitutionBranding => ({
    hospital_unit_id: currentHospital?.id,
    display_name: form.display_name.trim() || null,
    network_name: form.network_name.trim() || null,
    slug: form.slug.trim() || null,
    tagline: form.tagline.trim() || null,
    primary_color: isHexColor(form.primary_color) ? normalizeHex(form.primary_color) : null,
    accent_color: isHexColor(form.accent_color) ? normalizeHex(form.accent_color) : null,
    logo_url: form.logo_url || null,
    abbreviation: initials(form.display_name || currentHospital?.name || ""),
  });

  // Pré-visualização ao vivo das cores (não grava nada).
  useEffect(() => {
    if (loading || !primaryValid || !accentValid) return;
    previewBranding({ ...savedRef.current, ...draft() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.primary_color, form.accent_color, loading]);

  const handleLogo = async (file: File | undefined) => {
    if (!file || !currentHospital?.id) return;
    if (!LOGO_TYPES.includes(file.type)) {
      toast.error("Envie o logo em PNG, JPG ou WebP.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("O logo deve ter no máximo 2 MB.");
      return;
    }
    setUploading(true);
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${currentHospital.id}/logo-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("branding").upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (error) {
      toast.error("Não foi possível enviar o logo: " + error.message);
      return;
    }
    const { data } = supabase.storage.from("branding").getPublicUrl(path);
    set({ logo_url: data.publicUrl });
    toast.success("Logo enviado. Clique em Salvar para aplicar.");
  };

  const handleSave = async () => {
    if (!currentHospital?.id) return;
    if (!form.display_name.trim()) {
      toast.error("Informe o nome da instituição.");
      return;
    }
    if (!primaryValid || !accentValid) {
      toast.error("Use cores no formato #RRGGBB.");
      return;
    }
    if (!slugValid) {
      toast.error("Endereço inválido: use letras minúsculas, números e hífen.");
      return;
    }
    setSaving(true);
    const payload = draft();
    const { error } = await db
      .from("institution_branding")
      .upsert(payload, { onConflict: "hospital_unit_id" });
    setSaving(false);
    if (error) {
      toast.error(
        error.code === "23505"
          ? "Esse endereço já está em uso por outra instituição."
          : "Não foi possível salvar: " + error.message,
      );
      return;
    }
    savedRef.current = { ...savedRef.current, ...payload };
    toast.success("Identidade visual salva.");
    await refreshBranding();
  };

  const handleRestoreDefault = () => {
    set({ primary_color: "", accent_color: "", logo_url: "" });
    toast.info("Cores e logo voltaram ao padrão. Clique em Salvar para aplicar.");
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-5xl p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Palette className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Identidade visual</h1>
            <p className="text-sm text-muted-foreground">
              {currentHospital?.name ?? "Unidade atual"} — nome, logo e cores que a equipe vê na plataforma e nos
              documentos impressos.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Instituição</CardTitle>
                  <CardDescription>Como o hospital aparece nas telas e nos impressos.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="display_name">Nome da instituição</Label>
                    <Input id="display_name" value={form.display_name} maxLength={80}
                      onChange={(e) => set({ display_name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="network_name">Rede ou mantenedora (opcional)</Label>
                    <Input id="network_name" value={form.network_name} maxLength={80}
                      onChange={(e) => set({ network_name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="slug">Endereço de acesso</Label>
                    <Input id="slug" value={form.slug} maxLength={40} placeholder="ex.: hospital-central"
                      aria-invalid={!slugValid}
                      onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
                    <p className="text-xs text-muted-foreground">
                      A tela de entrada já abre com a sua marca em <span className="font-mono">/auth?i={form.slug || "endereco"}</span>
                    </p>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="tagline">Frase da tela de entrada (opcional)</Label>
                    <Input id="tagline" value={form.tagline} maxLength={120}
                      onChange={(e) => set({ tagline: e.target.value })} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cores e logo</CardTitle>
                  <CardDescription>
                    A cor principal pinta menus, botões e cabeçalhos. As cores dos setores (vermelha, amarela, azul)
                    e os alertas clínicos não mudam.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ColorField
                      id="primary_color" label="Cor principal" value={form.primary_color}
                      fallback={DEFAULT_BRAND.primary} invalid={!primaryValid}
                      onChange={(value) => set({ primary_color: value })}
                    />
                    <ColorField
                      id="accent_color" label="Cor de destaque" value={form.accent_color}
                      fallback={DEFAULT_ACCENT} invalid={!accentValid}
                      onChange={(value) => set({ accent_color: value })}
                    />
                  </div>
                  {isHexColor(form.primary_color) && normalizeHex(form.primary_color) !== tones.deep && (
                    <p className="text-xs text-muted-foreground">
                      A cor foi escurecida para <span className="font-mono">{tones.deep}</span> nas áreas com texto
                      branco, garantindo leitura (contraste {contrast.toFixed(1)}:1).
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-20 w-40 items-center justify-center rounded-lg border bg-white p-2">
                      {form.logo_url ? (
                        <img src={form.logo_url} alt="Logo da instituição" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem logo próprio</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <input ref={fileRef} type="file" accept={LOGO_TYPES.join(",")} className="hidden"
                        onChange={(e) => handleLogo(e.target.files?.[0])} />
                      <Button type="button" variant="outline" size="sm" disabled={uploading}
                        onClick={() => fileRef.current?.click()}>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        <span className="ml-2">Enviar logo</span>
                      </Button>
                      <p className="text-xs text-muted-foreground">PNG, JPG ou WebP, até 2 MB. Fundo transparente fica melhor.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span className="ml-2">Salvar</span>
                </Button>
                <Button type="button" variant="outline" onClick={handleRestoreDefault}>
                  <RotateCcw className="h-4 w-4" />
                  <span className="ml-2">Voltar ao padrão</span>
                </Button>
              </div>
            </div>

            {/* Pré-visualização */}
            <Card className="h-fit overflow-hidden lg:sticky lg:top-6">
              <div
                className="flex h-32 flex-col items-center justify-center gap-2 p-4 text-white"
                style={{ background: `linear-gradient(135deg, ${tones.deep}, ${tones.mid}, ${tones.bright})` }}
              >
                {form.logo_url ? (
                  <img src={form.logo_url} alt="" className="max-h-12 max-w-[70%] rounded bg-white/95 object-contain p-1" />
                ) : (
                  <span className="text-lg font-semibold tracking-wide">{form.display_name || "Sua instituição"}</span>
                )}
                {form.tagline && <span className="text-center text-[11px] opacity-90">{form.tagline}</span>}
              </div>
              <CardContent className="space-y-3 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pré-visualização</p>
                <Button size="sm" className="w-full">Botão principal</Button>
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-gold" />
                  <span className="font-medium text-primary">Texto em destaque</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  As cores já estão aplicadas nesta tela para você avaliar. Só passam a valer para a equipe depois de salvar.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function ColorField({
  id, label, value, fallback, invalid, onChange,
}: {
  id: string; label: string; value: string; fallback: string; invalid: boolean; onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} — seletor`}
          className="h-10 w-12 cursor-pointer rounded border bg-transparent p-1"
          value={isHexColor(value) ? normalizeHex(value) : fallback}
          onChange={(e) => onChange(e.target.value)}
        />
        <Input
          id={id}
          value={value}
          placeholder={`${fallback} (padrão)`}
          maxLength={7}
          aria-invalid={invalid}
          className="font-mono"
          onChange={(e) => onChange(e.target.value.trim())}
        />
      </div>
      {invalid && <p className="text-xs text-destructive">Use o formato #RRGGBB.</p>}
    </div>
  );
}
