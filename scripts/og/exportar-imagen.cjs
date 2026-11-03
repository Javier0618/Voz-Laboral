// Exporta una página HTML a JPEG: gráficos del cuerpo de las guías.
// Ver docs/estilo-editorial.md («Imágenes dentro de la guía») y el modelo en
// scripts/og/graficos/semanas-mujeres-pension.html.
//
// Uso: node scripts/og/exportar-imagen.cjs <pagina.html> <salida.jpg> [ancho=1200] [alto=760]
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const [html, salida, ancho = '1200', alto = '760'] = process.argv.slice(2);
  if (!html || !salida) {
    console.error('Uso: node scripts/og/exportar-imagen.cjs <pagina.html> <salida.jpg> [ancho] [alto]');
    process.exit(1);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: Number(ancho), height: Number(alto) } });
  await page.goto('file://' + path.resolve(html), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.resolve(salida), type: 'jpeg', quality: 90 });
  await browser.close();
  console.log(path.resolve(salida));
})().catch((e) => { console.error(e.message); process.exit(1); });
