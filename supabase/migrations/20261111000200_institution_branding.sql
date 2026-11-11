-- ============================================================================
-- PassoMed white label — marca por instituição em tempo de execução
-- ----------------------------------------------------------------------------
-- A tabela institution_branding já existia no banco de produção, mas nunca
-- teve migração no git. Aqui ela passa a existir de forma idempotente e ganha
-- os campos que o front precisa para vestir a marca de cada instituição.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.institution_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_unit_id uuid NOT NULL REFERENCES public.hospital_units(id) ON DELETE CASCADE,
  abbreviation text NOT NULL,
  tagline text,
  logo_url text,
  primary_color text,
  secondary_color text,
  accent_color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.institution_branding
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS network_name text,
  ADD COLUMN IF NOT EXISTS platform_name text,
  ADD COLUMN IF NOT EXISTS logo_compact_url text,
  ADD COLUMN IF NOT EXISTS logo_print_url text,
  ADD COLUMN IF NOT EXISTS footer_text text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'institution_branding_hospital_unit_id_key') THEN
    ALTER TABLE public.institution_branding
      ADD CONSTRAINT institution_branding_hospital_unit_id_key UNIQUE (hospital_unit_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'institution_branding_slug_format') THEN
    ALTER TABLE public.institution_branding
      ADD CONSTRAINT institution_branding_slug_format
      CHECK (slug IS NULL OR slug ~ '^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'institution_branding_colors_hex') THEN
    ALTER TABLE public.institution_branding
      ADD CONSTRAINT institution_branding_colors_hex CHECK (
        (primary_color   IS NULL OR primary_color   ~* '^#[0-9a-f]{6}$') AND
        (secondary_color IS NULL OR secondary_color ~* '^#[0-9a-f]{6}$') AND
        (accent_color    IS NULL OR accent_color    ~* '^#[0-9a-f]{6}$')
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS institution_branding_slug_key
  ON public.institution_branding (slug) WHERE slug IS NOT NULL;

DROP TRIGGER IF EXISTS update_institution_branding_updated_at ON public.institution_branding;
CREATE TRIGGER update_institution_branding_updated_at
  BEFORE UPDATE ON public.institution_branding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.institution_branding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Membros veem a marca da própria unidade" ON public.institution_branding;
CREATE POLICY "Membros veem a marca da própria unidade"
  ON public.institution_branding FOR SELECT TO authenticated
  USING (public.can_access_unit_row(hospital_unit_id));

DROP POLICY IF EXISTS "Coordenador cria a marca da própria unidade" ON public.institution_branding;
CREATE POLICY "Coordenador cria a marca da própria unidade"
  ON public.institution_branding FOR INSERT TO authenticated
  WITH CHECK (public.is_unit_admin(auth.uid(), hospital_unit_id));

DROP POLICY IF EXISTS "Coordenador atualiza a marca da própria unidade" ON public.institution_branding;
CREATE POLICY "Coordenador atualiza a marca da própria unidade"
  ON public.institution_branding FOR UPDATE TO authenticated
  USING (public.is_unit_admin(auth.uid(), hospital_unit_id))
  WITH CHECK (public.is_unit_admin(auth.uid(), hospital_unit_id));

DROP POLICY IF EXISTS "Operador remove marca" ON public.institution_branding;
CREATE POLICY "Operador remove marca"
  ON public.institution_branding FOR DELETE TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Marca pública para a tela de login (antes de autenticar): só o que é
-- visual, localizado pelo endereço da instituição (slug).
CREATE OR REPLACE FUNCTION public.get_public_branding(p_slug text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'hospital_unit_id', b.hospital_unit_id,
    'slug', b.slug,
    'display_name', coalesce(b.display_name, hu.name),
    'network_name', b.network_name,
    'platform_name', b.platform_name,
    'abbreviation', b.abbreviation,
    'tagline', b.tagline,
    'logo_url', b.logo_url,
    'logo_compact_url', b.logo_compact_url,
    'logo_print_url', b.logo_print_url,
    'primary_color', b.primary_color,
    'secondary_color', b.secondary_color,
    'accent_color', b.accent_color,
    'footer_text', b.footer_text
  )
  FROM public.institution_branding b
  JOIN public.hospital_units hu ON hu.id = b.hospital_unit_id
  WHERE b.slug = lower(trim(p_slug))
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_public_branding(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_branding(text) TO anon, authenticated, service_role;

-- Logos: bucket público de leitura; cada unidade escreve só na própria pasta
-- (<hospital_unit_id>/arquivo).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('branding', 'branding', true, 2097152, ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Coordenador envia logo da própria unidade" ON storage.objects;
CREATE POLICY "Coordenador envia logo da própria unidade"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'branding'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    AND public.is_unit_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "Coordenador troca logo da própria unidade" ON storage.objects;
CREATE POLICY "Coordenador troca logo da própria unidade"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'branding'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    AND public.is_unit_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "Coordenador remove logo da própria unidade" ON storage.objects;
CREATE POLICY "Coordenador remove logo da própria unidade"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'branding'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    AND public.is_unit_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
