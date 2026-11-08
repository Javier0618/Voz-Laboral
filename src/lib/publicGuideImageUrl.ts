/**
 * Publica las imágenes del bucket "guias" bajo el dominio de TuVozLaboral.
 * No modifica los archivos ni las URL almacenadas en Supabase.
 * Solo transforma URLs del proyecto conocido y del bucket público autorizado.
 */
const SUPABASE_GUIDES_PREFIX =
  'https://izzpirqqqwdvwbndnuql.supabase.co/storage/v1/object/public/guias/';
const SITE_GUIDES_PREFIX =
  'https://tuvozlaboral.com/storage/v1/object/public/guias/';

export function publicGuideImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (!url.startsWith(SUPABASE_GUIDES_PREFIX)) return url;
  // Mantener nombre, ruta, consultas y fragmentos; no permitir sufijos de otra ruta.
  return SITE_GUIDES_PREFIX + url.slice(SUPABASE_GUIDES_PREFIX.length);
}
