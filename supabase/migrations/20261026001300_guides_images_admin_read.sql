-- VozLaboral · 1300 · La administración puede ver (y por tanto borrar o
-- reemplazar) las imágenes de las guías. Storage solo borra los archivos que
-- el usuario puede leer; la lectura pública ya la da el bucket público.

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    execute 'drop policy if exists "imagenes de guias: ver" on storage.objects';
    execute $p$create policy "imagenes de guias: ver" on storage.objects
      for select to authenticated using (bucket_id = 'guias' and private.is_admin())$p$;
  end if;
end;
$$;
