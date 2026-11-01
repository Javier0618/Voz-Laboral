/**
 * Limpia una dirección antes de enviarla a la herramienta de medición de
 * visitas (pendiente de elegir para el VPS: Umami o Google Analytics).
 * - Quita todos los parámetros (?code= del inicio de sesión, búsquedas…) y el ancla.
 * - Tapa el enlace privado de seguimiento de quien compartió sin cuenta.
 */
export function limpiarUrl(url: string): string {
  const u = new URL(url);
  u.search = '';
  u.hash = '';
  u.pathname = u.pathname.replace(/^\/seguimiento\/[^/]+/, '/seguimiento/[enlace]');
  return u.toString();
}
