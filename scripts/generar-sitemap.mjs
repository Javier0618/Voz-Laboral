// Genera dist/sitemap.xml y dist/robots.txt después de `vite build`.
// Usa la clave pública (anon) y solo funciones/columnas públicas.
// Variables: SITE_URL (dominio público; por defecto https://tuvozlaboral.com),
// VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY, del sistema o de los archivos .env. Si falta algo o Supabase no
// responde, genera el mapa solo con las páginas fijas: nunca rompe el build.
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { htmlDeGuia, htmlDeCalculadora } from './prerender.mjs';

// Lee los mismos archivos .env que Vite (las variables del sistema tienen
// prioridad). Sin esto, el script no vería VITE_SUPABASE_URL ni SITE_URL si
// solo están en .env o .env.local, y el mapa no incluiría las guías.
for (const nombre of ['.env.production.local', '.env.local', '.env.production', '.env']) {
  const ruta = new URL(`../${nombre}`, import.meta.url);
  if (!existsSync(ruta)) continue;
  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(linea);
    if (!m || linea.trim().startsWith('#')) continue;
    const valor = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = valor;
  }
}

const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '';
const site = (process.env.SITE_URL || process.env.URL || vercel || 'https://tuvozlaboral.com').replace(/\/$/, '');
const api = (process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
// Carpeta de salida: dist/ por defecto, o la de SITEMAP_OUT (la usa
// scripts/desplegar.sh para compilar en una carpeta aparte).
const out = process.env.SITEMAP_OUT
  ? pathToFileURL(resolve(process.env.SITEMAP_OUT) + '/')
  : new URL('../dist/', import.meta.url);

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
  ['/politicas/tratamiento-de-datos', null], ['/politicas/cookies', null],
  // Calculadoras y herramientas: páginas fijas con contenido propio.
  ['/calculadoras', null], ['/liquidacion', null], ['/calculadoras/administrativos', null], ['/calculadoras/operativos', null],
  ['/calculadoras/vigilantes', null], ['/calculadoras/por-dias', null], ['/calculadoras/prima', null], ['/calculadoras/cesantias', null],
  ['/calculadoras/salario-neto', null], ['/calculadoras/prestacion-servicios', null],
  ['/herramientas', null], ['/herramientas/cartas', null], ['/herramientas/cartas/derecho-de-peticion', null],
  ['/herramientas/cartas/carta-de-renuncia', null], ['/herramientas/cartas/renuncia-por-justa-causa', null],
  ['/herramientas/cartas/solicitud-de-vacaciones', null], ['/herramientas/cartas/correccion-historia-laboral', null],
  ['/herramientas/diagnostico', null], ['/herramientas/quiz', null], ['/herramientas/calendario', null], ['/herramientas/glosario', null],
]);

async function get(path, init) {
  const res = await fetch(`${api}${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} en ${path.split('?')[0]}`);
  return res.json();
}

if (api && key) {
  try {
    const guides = await get('/rest/v1/legal_resources?select=slug,title,summary,content,cover_url,cover_alt,updated_at,last_verified_at&status=eq.publicado');
    guides.forEach((g) => urls.set(`/derechos/${g.slug}/`, g.updated_at));
    // HTML propio de cada guía, para las vistas previas al compartir.
    const plantilla = readFileSync(new URL('index.html', out), 'utf8');
    for (const g of guides) {
      const dir = new URL(`derechos/${g.slug}/`, out);
      mkdirSync(dir, { recursive: true });
      writeFileSync(new URL('index.html', dir), htmlDeGuia(plantilla, g, site));
    }
    // La carpeta derechos/ ya existe por las guías: sin su propio index.html,
    // Nginx respondería 403 al abrir /derechos o /derechos/ directamente.
    if (guides.length) writeFileSync(new URL('derechos/index.html', out), plantilla);
    console.log(`[prerender] ${guides.length} guías con su propio HTML inicial.`);
    for (let offset = 0; offset < 50000; offset += 50) {
      const page = await get('/rest/v1/rpc/list_experiences', { method: 'POST', body: JSON.stringify({ p_limit: 50, p_offset: offset }) });
      page.forEach((e) => {
        urls.set(`/experiencias/${e.id}`, e.published_at);
        // Solo empresas con experiencias publicadas: los perfiles vacíos no se
        // indexan (llevan «noindex») y no deben aparecer en el mapa.
        const actual = urls.get(`/empresas/${e.company_slug}`);
        if (!actual || (e.published_at && e.published_at > actual)) urls.set(`/empresas/${e.company_slug}`, e.published_at);
      });
      if (page.length < 50) break;
    }
  } catch (error) {
    console.warn(`[sitemap] No se pudo leer Supabase (${error.message}). Se generan solo las páginas fijas.`);
  }
}


/** Metadatos específicos para tres calculadoras con búsquedas identificadas. */
const calculadorasSeo = [
  {
    "path": "/calculadoras/prima",
    "title": "Calculadora de prima de servicios en Colombia",
    "description": "Calcula cuánto te corresponde de prima de servicios en Colombia según tu salario, los días trabajados y el semestre. Incluye una explicación del cálculo."
  },
  {
    "path": "/calculadoras/cesantias",
    "title": "Calculadora de cesantías e intereses en Colombia",
    "description": "Estima tus cesantías e intereses en Colombia con el salario y los días trabajados. Consulta cómo se calcula cada valor y los plazos de pago."
  },
  {
    "path": "/calculadoras/salario-neto",
    "title": "Calculadora de salario neto en Colombia",
    "description": "Estima cuánto recibirías de salario neto en Colombia después de aportes de salud, pensión y otras deducciones. Compara el sueldo bruto y el neto."
  }
];
// El servidor sirve las páginas pregeneradas en directorios con barra final.
for (const info of calculadorasSeo) {
  urls.delete(info.path);
  urls.set(info.path + '/', null);
}
const plantillaCalculadoras = readFileSync(new URL('index.html', out), 'utf8');
for (const info of calculadorasSeo) {
  const dir = new URL(info.path.slice(1) + '/', out);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('index.html', dir), htmlDeCalculadora(plantillaCalculadoras, info, site));
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
console.log(`[sitemap] ${urls.size} direcciones en ${process.env.SITEMAP_OUT || "dist"}/sitemap.xml`);
