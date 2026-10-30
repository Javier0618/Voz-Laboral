-- VozLaboral · 1700 · Imagen de portada de las guías.
-- La sube la administración desde el editor al bucket público «guias»
-- (migración 1200). Se muestra en el listado, en la portada y en la guía.
-- cover_alt vacío: la imagen es decorativa y los lectores de pantalla la omiten.

alter table public.legal_resources
  add column if not exists cover_url text
    constraint legal_resources_cover_url_https check (cover_url is null or cover_url ~ '^https://[^\s]+$'),
  add column if not exists cover_alt text not null default ''
    constraint legal_resources_cover_alt_length check (length(cover_alt) <= 200);
