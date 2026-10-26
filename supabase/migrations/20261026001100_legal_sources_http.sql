-- VozLaboral · 1100 · Fuentes de las guías con http.
-- La compilación oficial de la Secretaría del Senado (secretariasenado.gov.co)
-- solo se publica por http. Se sigue exigiendo una URL web válida.

alter table public.legal_resource_sources drop constraint if exists legal_resource_sources_url_check;
alter table public.legal_resource_sources
  add constraint legal_resource_sources_url_check check (url ~ '^https?://[^\s]+$');
