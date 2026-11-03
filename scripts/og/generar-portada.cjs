// Genera la portada de una guía (1200×628, JPEG) con la identidad del sitio,
// a partir de scripts/og/portada.html. Ver docs/estilo-editorial.md («Portada»).
//
// Uso:
//   node scripts/og/generar-portada.cjs --titulo "Pensión de vejez: requisitos y cómo pedirla" \
//     --tema "Salud y seguridad social" --dato "1.250" --dato-texto "semanas para las mujeres en 2026" \
//     --salida portada.jpg
// --dato y --dato-texto son opcionales: la cifra clave de la guía, verificada en su fuente.
const { chromium } = require('playwright');
const path = require('path');

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--') || argv[i + 1] === undefined) throw new Error(`Argumento inválido: ${argv[i]}`);
    out[argv[i].slice(2)] = argv[i + 1];
  }
  return out;
}

(async () => {
  const a = args(process.argv.slice(2));
  if (!a.titulo || !a.salida) {
    console.error('Uso: node scripts/og/generar-portada.cjs --titulo "…" [--tema "…"] [--dato "…" --dato-texto "…"] [--pie "…"] --salida portada.jpg');
    process.exit(1);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 628 } });
  await page.goto('file://' + path.join(__dirname, 'portada.html'), { waitUntil: 'load' });
  await page.evaluate((a) => {
    const set = (id, v) => { document.getElementById(id).textContent = v; };
    set('titulo', a.titulo);
    if (a.tema) set('tema', a.tema); else document.getElementById('tema').remove();
    if (a.pie) set('pie', a.pie);
    if (a.dato) { set('dato-valor', a.dato); set('dato-texto', a['dato-texto'] ?? ''); } else document.getElementById('dato').remove();
    // Ajusta el tamaño del título para que quepa en el espacio disponible.
    const h1 = document.getElementById('titulo');
    const ancho = a.dato ? 720 : 1040;
    h1.style.maxWidth = ancho + 'px';
    for (let size = 72; size >= 40; size -= 2) {
      h1.style.fontSize = size + 'px';
      if (h1.scrollHeight <= size * 1.06 * 3 + 2) break;
    }
  }, a);
  await page.evaluate(() => document.fonts.ready);
  const salida = path.resolve(a.salida);
  await page.screenshot({ path: salida, type: 'jpeg', quality: 90 });
  await browser.close();
  console.log(salida);
})().catch((e) => { console.error(e.message); process.exit(1); });
