-- Temas de las guías guardados en la base de datos y borrado de sugerencias.
--
-- 1. legal_resources.topic: tema del índice de guías (src/lib/temasGuias.ts),
--    por ejemplo «empleo» para las publicaciones sobre trabajo en general.
--    Vacío = el sitio lo deduce como antes (lista del código o categoría).
-- 2. editorial_save_draft guarda el tema de la sugerencia (o el que indique
--    el redactor) en el borrador.
-- 3. editorial_delete_suggestion: la administración borra de forma
--    definitiva una sugerencia descartada o marcada como «ya la tenemos».

alter table public.legal_resources
  add column if not exists topic text not null default ''
    constraint legal_resources_topic_slug check (topic ~ '^[a-z0-9-]{0,40}$');

drop function if exists public.editorial_save_draft(uuid, text, text, text, text, text, jsonb);

create function public.editorial_save_draft(
  p_id uuid, p_slug text, p_title text, p_summary text, p_content text, p_category_slug text default null,
  p_sources jsonb default '[]'::jsonb, p_topic text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_suggestion public.guide_suggestions;
  v_slug text;
  v_resource uuid;
  v_source jsonb;
  attempt int := 0;
begin
  if not private.is_redactor() then
    raise exception using errcode = '42501', message = 'VL403: solo la redacción guarda borradores';
  end if;
  select * into v_suggestion from public.guide_suggestions where id = p_id for update;
  if v_suggestion.id is null or v_suggestion.status <> 'pedida' or v_suggestion.kind <> 'nueva' then
    perform private.raise_business_error('VL085', 'Solo se redacta una sugerencia de guía nueva que la administración pidió.');
  end if;
  if jsonb_typeof(coalesce(p_sources, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_sources, '[]'::jsonb)) = 0 then
    perform private.raise_business_error('VL086', 'La guía necesita al menos una fuente.');
  end if;
  if not private.valid_suggestion_sources(p_sources) then
    perform private.raise_business_error('VL080', 'Cada fuente necesita un nombre y una dirección http(s).');
  end if;

  loop
    v_slug := case when attempt = 0 then p_slug else left(p_slug, 75) || '-' || (attempt + 1) end;
    exit when not exists (select 1 from public.legal_resources where slug = v_slug);
    attempt := attempt + 1;
    if attempt > 5 then
      perform private.raise_business_error('VL072', 'Ya existe una guía con una dirección muy parecida.');
    end if;
  end loop;

  insert into public.legal_resources (slug, title, summary, content, category_slug, topic, status)
  values (v_slug, trim(p_title), trim(p_summary), trim(p_content), nullif(p_category_slug, ''),
          coalesce(nullif(p_topic, ''), v_suggestion.topic, ''), 'borrador')
  returning id into v_resource;

  for v_source in select * from jsonb_array_elements(p_sources) loop
    insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at)
    values (v_resource, trim(v_source ->> 'label'), coalesce(nullif(trim(v_source ->> 'publisher'), ''), 'Fuente'),
            v_source ->> 'url', coalesce((v_source ->> 'accessed_at')::date, current_date))
    on conflict (resource_id, url) do nothing;
  end loop;

  update public.guide_suggestions
     set status = 'redactada', draft_resource_id = v_resource, drafted_at = now()
   where id = p_id;
  return v_resource;
end;
$$;

create or replace function public.editorial_delete_suggestion(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if not private.is_admin() then
    raise exception using errcode = '42501', message = 'VL403: solo la administración borra sugerencias';
  end if;
  select status into v_status from public.guide_suggestions where id = p_id;
  if v_status is null then
    perform private.raise_business_error('VL083', 'La sugerencia no existe.');
  end if;
  if v_status not in ('descartada', 'existente') then
    perform private.raise_business_error('VL089', 'Solo se borran sugerencias descartadas o marcadas como «ya la tenemos».');
  end if;
  delete from public.guide_suggestions where id = p_id;
end;
$$;

revoke all on function public.editorial_save_draft(uuid, text, text, text, text, text, jsonb, text) from public, anon;
revoke all on function public.editorial_delete_suggestion(uuid) from public, anon;
grant execute on function public.editorial_save_draft(uuid, text, text, text, text, text, jsonb, text) to authenticated;
grant execute on function public.editorial_delete_suggestion(uuid) to authenticated;
