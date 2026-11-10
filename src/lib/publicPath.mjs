// URL pública canónica de una ruta interna. La usan React (src/lib/meta.ts,
// enlaces de las guías) y el prerender (scripts/prerender.mjs): una sola regla.
//
// Las páginas públicas se sirven como directorios con index.html, así que su
// URL canónica termina en barra: /derechos/vacaciones/. Enlazar sin barra
// obliga a una redirección 301 en cada clic y en cada rastreo de Google.

const PUBLIC_DIRECTORY =
  /^\/(?:derechos(?:\/[^/]+)?|calculadoras(?:\/[^/]+)?|herramientas(?:\/(?:cartas(?:\/[^/]+)?|diagnostico|quiz|calendario|glosario))?|politicas\/[^/]+|empresas|experiencias|liquidacion|como-funciona|compartir)\/?$/;

/**
 * Añade la barra final a las rutas públicas que la llevan, conservando la
 * consulta (?tema=…) y el ancla (#seccion). Las demás rutas, las URLs
 * externas y las vacías no cambian.
 * @param {string} href
 * @returns {string}
 */
export function publicPath(href) {
  if (typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) return href;
  const cut = href.search(/[?#]/);
  const path = cut === -1 ? href : href.slice(0, cut);
  const rest = cut === -1 ? '' : href.slice(cut);
  if (path === '/' || !PUBLIC_DIRECTORY.test(path)) return href;
  return path.replace(/\/$/, '') + '/' + rest;
}
