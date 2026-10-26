-- VozLaboral · 0100 · Esquemas, extensiones y utilidades compartidas.
-- Se ejecuta como el rol propietario de las migraciones (postgres en Supabase).

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- Esquema interno: no se expone por la API de Supabase (solo "public" lo está).
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

-- Ninguna función nueva es ejecutable por defecto: cada migración concede
-- EXECUTE de forma explícita a quien corresponda.
alter default privileges in schema private revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

-- Normaliza texto para búsquedas y detección de duplicados:
-- minúsculas, sin tildes, solo letras y números separados por un espacio.
create or replace function private.normalize_text(t text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select trim(regexp_replace(
    lower(translate(coalesce(t, ''),
      'ÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑáàäâéèëêíìïîóòöôúùüûñ',
      'AAAAEEEEIIIIOOOOUUUUNaaaaeeeeiiiioooouuuun')),
    '[^a-z0-9]+', ' ', 'g'));
$$;

-- Mantiene updated_at en todas las tablas que lo tienen.
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Errores de negocio: el frontend reconoce el prefijo "VL" y muestra un
-- mensaje comprensible. Nunca incluyen datos internos.
create or replace function private.raise_business_error(code text, message text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = 'P0001', message = code || ': ' || message;
end;
$$;

revoke all on all functions in schema private from public;
grant execute on function private.normalize_text(text) to anon, authenticated;
