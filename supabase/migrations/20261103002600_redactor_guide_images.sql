-- VozLaboral · 2600 · El redactor sube imágenes para el cuerpo de las guías.
--
-- Gráficos propios (escalas, líneas de tiempo, comparaciones) que Claude crea
-- al redactar y que van dentro del texto como ![descripción](url). Ver
-- docs/estilo-editorial.md, «Imágenes dentro de la guía».
--
-- El redactor solo puede SUBIR archivos nuevos, nunca reemplazar ni borrar:
--   - en el bucket «guias»;
--   - dentro de la carpeta de una guía (<slug>/), para que el borrado de la
--     guía también se lleve sus imágenes;
--   - con nombre «redaccion-<uuid>.png|jpg|webp», para distinguirlas de las
--     que sube la administración.
-- El bucket ya limita el tamaño (2 MB) y el tipo (PNG, JPEG o WebP).
-- Se omite si no existe el esquema storage (entorno de pruebas sin Supabase).

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    execute 'drop policy if exists "imagenes de guias: subir (redaccion)" on storage.objects';
    execute $p$create policy "imagenes de guias: subir (redaccion)" on storage.objects
      for insert to authenticated with check (
        bucket_id = 'guias'
        and private.is_redactor()
        and name ~ '^[a-z0-9]+(-[a-z0-9]+)*/redaccion-[0-9a-f-]{36}\.(png|jpg|webp)$'
      )$p$;
  end if;
end;
$$;
