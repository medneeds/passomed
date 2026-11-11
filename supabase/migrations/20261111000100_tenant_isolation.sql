-- ============================================================================
-- PassoMed white label — isolamento por instituição (multi-tenant)
-- ----------------------------------------------------------------------------
-- Antes: o papel "admin" enxergava e gerenciava TODAS as unidades e usuários.
-- Depois: "admin" passa a ser o coordenador da(s) unidade(s) a que está
-- vinculado; só o operador da plataforma (platform_admins) atravessa unidades.
-- Compatibilidade: todo admin já existente vira operador da plataforma, então
-- nada muda para quem já usa o sistema.
-- ============================================================================

-- 1. Operadores da plataforma ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário vê o próprio registro de operador" ON public.platform_admins;
CREATE POLICY "Usuário vê o próprio registro de operador"
  ON public.platform_admins FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Backfill: preserva o comportamento atual dos admins já cadastrados.
INSERT INTO public.platform_admins (user_id)
SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _user_id IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = _user_id);
$$;

-- 2. Acesso à unidade: vínculo + cadastro aprovado ---------------------------
CREATE OR REPLACE FUNCTION public.user_can_access_hospital_unit(_user_id uuid, _hospital_unit_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    _user_id IS NOT NULL
    AND _hospital_unit_id IS NOT NULL
    AND (
      public.is_platform_admin(_user_id)
      OR (
        EXISTS (
          SELECT 1 FROM public.user_hospital_assignments uha
          WHERE uha.user_id = _user_id
            AND uha.hospital_unit_id = _hospital_unit_id
        )
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = _user_id AND p.status = 'approved'
        )
      )
    );
$$;

-- Linha "de unidade": operador da plataforma vê tudo (inclusive linhas sem
-- unidade); os demais só o que pertence a uma unidade sua.
CREATE OR REPLACE FUNCTION public.can_access_unit_row(_hospital_unit_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_platform_admin(auth.uid())
      OR public.user_can_access_hospital_unit(auth.uid(), _hospital_unit_id);
$$;

-- Coordenador da unidade (admin vinculado) ou operador da plataforma.
CREATE OR REPLACE FUNCTION public.is_unit_admin(_user_id uuid, _hospital_unit_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_platform_admin(_user_id)
      OR (
        public.has_role(_user_id, 'admin'::public.app_role)
        AND public.user_can_access_hospital_unit(_user_id, _hospital_unit_id)
      );
$$;

-- Dois usuários compartilham ao menos uma unidade (ou quem olha é operador).
CREATE OR REPLACE FUNCTION public.shares_unit_with(_viewer uuid, _target uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _viewer IS NOT NULL AND _viewer = auth.uid() AND (
    _viewer = _target
    OR public.is_platform_admin(_viewer)
    OR EXISTS (
      SELECT 1
      FROM public.user_hospital_assignments a
      JOIN public.user_hospital_assignments b ON b.hospital_unit_id = a.hospital_unit_id
      WHERE a.user_id = _viewer AND b.user_id = _target
    )
  );
$$;

-- Estas funções aparecem dentro de políticas avaliadas também para visitantes
-- (ex.: lista pública de unidades no cadastro), então anon precisa poder
-- executá-las; para auth.uid() nulo todas retornam falso.
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_unit_row(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_unit_admin(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.shares_unit_with(uuid, uuid) TO anon, authenticated, service_role;

-- 3. Tabelas com hospital_unit_id: toda regra de admin e toda inserção passam
--    a exigir que a linha pertença a uma unidade do usuário. -----------------
DO $$
DECLARE
  pol record;
  cond constant text := 'public.can_access_unit_row(hospital_unit_id)';
  full_expr text;
  stmt text;
BEGIN
  FOR pol IN
    SELECT p.tablename, p.policyname, p.cmd, p.qual, p.with_check
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = p.tablename
          AND c.column_name = 'hospital_unit_id'
      )
  LOOP
    full_expr := coalesce(pol.qual, '') || ' ' || coalesce(pol.with_check, '');
    -- Já escopadas por unidade: não mexe.
    CONTINUE WHEN full_expr LIKE '%user_can_access_hospital_unit%'
               OR full_expr LIKE '%can_access_unit_row%'
               OR full_expr LIKE '%user_hospital_assignments%';
    -- Só interessa: regra que cita admin, ou qualquer INSERT.
    CONTINUE WHEN full_expr NOT LIKE '%has_role(auth.uid(), ''admin''%'
              AND pol.cmd <> 'INSERT';

    stmt := format('ALTER POLICY %I ON public.%I', pol.policyname, pol.tablename);
    IF pol.qual IS NOT NULL THEN
      stmt := stmt || format(' USING ((%s) AND %s)', pol.qual, cond);
    END IF;
    IF pol.with_check IS NOT NULL THEN
      stmt := stmt || format(' WITH CHECK ((%s) AND %s)', pol.with_check, cond);
    END IF;
    EXECUTE stmt;
  END LOOP;
END $$;

-- 4. Tabelas de usuário: coordenador só alcança quem divide unidade com ele --
DO $$
DECLARE
  pol record;
  target_col text;
  stmt text;
BEGIN
  FOR pol IN
    SELECT p.tablename, p.policyname, p.qual, p.with_check
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename IN ('profiles','user_roles','user_departments','data_requests',
                          'user_consents','password_reset_requests','clinicus_access')
      AND (coalesce(p.qual,'') || coalesce(p.with_check,'')) LIKE '%has_role(auth.uid(), ''admin''%'
      AND (coalesce(p.qual,'') || coalesce(p.with_check,'')) NOT LIKE '%shares_unit_with%'
  LOOP
    target_col := CASE WHEN pol.tablename = 'profiles' THEN 'id' ELSE 'user_id' END;
    stmt := format('ALTER POLICY %I ON public.%I', pol.policyname, pol.tablename);
    IF pol.qual IS NOT NULL THEN
      stmt := stmt || format(' USING ((%s) AND public.shares_unit_with(auth.uid(), %I))', pol.qual, target_col);
    END IF;
    IF pol.with_check IS NOT NULL THEN
      stmt := stmt || format(' WITH CHECK ((%s) AND public.shares_unit_with(auth.uid(), %I))', pol.with_check, target_col);
    END IF;
    EXECUTE stmt;
  END LOOP;
END $$;

-- Coordenador não pode promover ninguém a operador nem tocar em papel de
-- usuário de outra instituição; papel "admin" só para quem já é da unidade.

-- 5. Estrutura e catálogos globais: só o operador da plataforma altera -------
DO $$
DECLARE
  pol record;
  stmt text;
BEGIN
  FOR pol IN
    SELECT p.tablename, p.policyname, p.qual, p.with_check
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename IN ('hospital_units','states','medical_codes','data_retention_policies')
      AND p.cmd <> 'SELECT'
      AND (coalesce(p.qual,'') || coalesce(p.with_check,'')) LIKE '%has_role(auth.uid(), ''admin''%'
      AND (coalesce(p.qual,'') || coalesce(p.with_check,'')) NOT LIKE '%is_platform_admin%'
  LOOP
    stmt := format('ALTER POLICY %I ON public.%I', pol.policyname, pol.tablename);
    IF pol.qual IS NOT NULL THEN
      stmt := stmt || format(' USING ((%s) AND public.is_platform_admin(auth.uid()))', pol.qual);
    END IF;
    IF pol.with_check IS NOT NULL THEN
      stmt := stmt || format(' WITH CHECK ((%s) AND public.is_platform_admin(auth.uid()))', pol.with_check);
    END IF;
    EXECUTE stmt;
  END LOOP;
END $$;

-- 6. Arquivos da unidade no Storage: sem leitura global para admin ----------
DROP POLICY IF EXISTS "Hospital members read hospital-files" ON storage.objects;
CREATE POLICY "Hospital members read hospital-files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'hospital-files'
    AND (
      auth.uid() = owner
      OR EXISTS (
        SELECT 1 FROM public.hospital_files hf
        WHERE hf.storage_path = storage.objects.name
          AND public.can_access_unit_row(hf.hospital_unit_id)
      )
    )
  );

-- 7. Cadastro: a unidade escolhida no formulário vira vínculo (o acesso só
--    abre depois da aprovação, porque user_can_access exige status aprovado).
CREATE OR REPLACE FUNCTION public.link_new_user_to_unit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_unit uuid;
BEGIN
  BEGIN
    v_unit := nullif(NEW.raw_user_meta_data->>'hospital_unit_id', '')::uuid;
  EXCEPTION WHEN others THEN
    v_unit := NULL;
  END;

  IF v_unit IS NOT NULL AND EXISTS (SELECT 1 FROM public.hospital_units hu WHERE hu.id = v_unit) THEN
    INSERT INTO public.user_hospital_assignments (user_id, hospital_unit_id)
    VALUES (NEW.id, v_unit)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.link_new_user_to_unit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_link_unit ON auth.users;
CREATE TRIGGER on_auth_user_created_link_unit
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_new_user_to_unit();

-- 8. RPC para o front saber o que o usuário alcança -------------------------
CREATE OR REPLACE FUNCTION public.my_access()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'is_platform_admin', public.is_platform_admin(auth.uid()),
    'unit_ids', coalesce((
      SELECT jsonb_agg(uha.hospital_unit_id)
      FROM public.user_hospital_assignments uha
      WHERE uha.user_id = auth.uid()
    ), '[]'::jsonb)
  );
$$;
REVOKE ALL ON FUNCTION public.my_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_access() TO authenticated;
