-- VozLaboral · 1200 · Editor de guías: contador de visitas e imágenes.

-- ---------------------------------------------------------------------------
-- Visitas por guía. Solo se guarda un total por guía: ni usuarios, ni IP,
-- ni fechas individuales. Va en una tabla aparte para no alterar la fecha de
-- «última actualización» de la guía con cada visita.
-- ---------------------------------------------------------------------------
create table public.legal_resource_stats (
  resource_id uuid primary key references public.legal_resources (id) on delete cascade,
  views bigint not null default 0 check (views >= 0),
  last_view_at timestamptz
);

alter table public.legal_resource_stats enable row level security;
revoke all on public.legal_resource_stats from anon, authenticated;
grant select on public.legal_resource_stats to authenticated;

create policy "visitas solo para administración" on public.legal_resource_stats
  for select to authenticated using (private.is_admin());

-- Registra una visita a una guía publicada. Las no publicadas no cuentan.
create or replace function public.register_guide_view(p_slug text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.legal_resource_stats as s (resource_id, views, last_view_at)
  select r.id, 1, now() from public.legal_resources r where r.slug = p_slug and r.status = 'publicado'
  on conflict (resource_id) do update set views = s.views + 1, last_view_at = now();
$$;

revoke all on function public.register_guide_view(text) from public;
grant execute on function public.register_guide_view(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Imágenes de las guías: bucket público de solo lectura. Solo la
-- administración sube, reemplaza o borra. Máximo 2 MB; PNG, JPEG o WebP.
-- Se omite si no existe el esquema storage (entorno de pruebas sin Supabase).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('guias', 'guias', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
    on conflict (id) do update
      set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

    execute 'drop policy if exists "imagenes de guias: subir" on storage.objects';
    execute 'drop policy if exists "imagenes de guias: reemplazar" on storage.objects';
    execute 'drop policy if exists "imagenes de guias: borrar" on storage.objects';
    execute $p$create policy "imagenes de guias: subir" on storage.objects
      for insert to authenticated with check (bucket_id = 'guias' and private.is_admin())$p$;
    execute $p$create policy "imagenes de guias: reemplazar" on storage.objects
      for update to authenticated using (bucket_id = 'guias' and private.is_admin()) with check (bucket_id = 'guias' and private.is_admin())$p$;
    execute $p$create policy "imagenes de guias: borrar" on storage.objects
      for delete to authenticated using (bucket_id = 'guias' and private.is_admin())$p$;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Una guía publicada no puede quedarse sin fuentes.
-- ---------------------------------------------------------------------------
create or replace function private.keep_published_guide_sourced()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.legal_resources r where r.id = old.resource_id and r.status = 'publicado')
     and not exists (select 1 from public.legal_resource_sources s where s.resource_id = old.resource_id and s.id <> old.id) then
    perform private.raise_business_error('VL071', 'Una guía publicada necesita al menos una fuente. Retírala para revisión antes de quitar la última.');
  end if;
  return old;
end;
$$;

create trigger legal_resource_sources_keep_one before delete on public.legal_resource_sources
  for each row execute function private.keep_published_guide_sourced();
