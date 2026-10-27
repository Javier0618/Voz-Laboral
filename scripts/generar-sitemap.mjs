// Genera dist/sitemap.xml y dist/robots.txt después de `vite build`.
// Usa la clave pública (anon) y solo funciones/columnas públicas.
// Variables: SITE_URL (dominio público, p. ej. https://vozlaboral.co),
// VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. Si falta algo o Supabase no
// responde, genera el mapa solo con las páginas fijas: nunca rompe el build.
import { writeFileSync, existsSync } from 'node:fs';

const site = (process.env.SITE_URL || process.env.URL || '').replace(/\/$/, '');
const api = (process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const out = new URL('../dist/', import.meta.url);

if (!existsSync(out)) {
  console.warn('[sitemap] No existe dist/: ejecuta primero vite build.');
  process.exit(0);
}
if (!site) {
  console.warn('[sitemap] Falta SITE_URL: no se genera el mapa del sitio.');
  writeFileSync(new URL('robots.txt', out), 'User-agent: *\nDisallow: /cuenta\nDisallow: /moderacion\nDisallow: /seguimiento/\nDisallow: /avisos\n');
  process.exit(0);
}

const urls = new Map([
  ['/', null], ['/empresas', null], ['/experiencias', null], ['/derechos', null], ['/como-funciona', null],
  ['/compartir', null], ['/politicas/reglas', null], ['/politicas/terminos', null], ['/politicas/privacidad', null],
  ['/politicas/tratamiento-de-datos', null],
]);

async function get(path, init) {
  const res = await fetch(`${api}${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} en ${path.split('?')[0]}`);
  return res.json();
}

if (api && key) {
  try {
    // Supabase devuelve como máximo 1.000 filas por consulta: se pagina.
    for (let offset = 0; offset < 200000; offset += 1000) {
      const companies = await get(`/rest/v1/companies?select=slug,updated_at&status=eq.activo&order=slug&limit=1000&offset=${offset}`);
      companies.forEach((c) => urls.set(`/empresas/${c.slug}`, c.updated_at));
      if (companies.length < 1000) break;
    }
    const guides = await get('/rest/v1/legal_resources?select=slug,updated_at&status=eq.publicado');
    guides.forEach((g) => urls.set(`/derechos/${g.slug}`, g.updated_at));
    for (let offset = 0; offset < 50000; offset += 50) {
      const page = await get('/rest/v1/rpc/list_experiences', { method: 'POST', body: JSON.stringify({ p_limit: 50, p_offset: offset }) });
      page.forEach((e) => urls.set(`/experiencias/${e.id}`, e.published_at));
      if (page.length < 50) break;
    }
  } catch (error) {
    console.warn(`[sitemap] No se pudo leer Supabase (${error.message}). Se generan solo las páginas fijas.`);
  }
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...[...urls].map(([path, date]) =>
    `  <url><loc>${esc(site + path)}</loc>${date ? `<lastmod>${String(date).slice(0, 10)}</lastmod>` : ''}</url>`),
  '</urlset>',
  '',
].join('\n');
writeFileSync(new URL('sitemap.xml', out), xml);
writeFileSync(
  new URL('robots.txt', out),
  `User-agent: *\nDisallow: /cuenta\nDisallow: /moderacion\nDisallow: /seguimiento/\nDisallow: /avisos\n\nSitemap: ${site}/sitemap.xml\n`,
);
console.log(`[sitemap] ${urls.size} direcciones en dist/sitemap.xml`);
