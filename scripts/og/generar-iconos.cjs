// Genera los iconos PNG/ICO a partir de public/favicon.svg.
// Uso: node scripts/og/generar-iconos.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PUB = path.join(__dirname, '..', '..', 'public');
const svg = fs.readFileSync(path.join(PUB, 'favicon.svg'), 'utf8');
const dataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');

async function png(page, size, { sinBordes = false } = {}) {
  // Para iOS el icono va a sangre (sin esquinas transparentes): iOS redondea por su cuenta.
  const fondo = sinBordes ? 'background:#0F2440;' : 'background:transparent;';
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;${fondo}"><img src="${dataUrl}" style="display:block;width:${size}px;height:${size}px;${sinBordes ? 'transform:scale(1.16);' : ''}"></body></html>`);
  await page.waitForTimeout(100);
  return page.screenshot({ omitBackground: !sinBordes, clip: { x: 0, y: 0, width: size, height: size } });
}

// Archivo ICO con imágenes PNG dentro (formato admitido desde Windows Vista).
function ico(imagenes) {
  const cab = Buffer.alloc(6);
  cab.writeUInt16LE(0, 0); cab.writeUInt16LE(1, 2); cab.writeUInt16LE(imagenes.length, 4);
  const dirs = []; let offset = 6 + 16 * imagenes.length;
  for (const { size, buf } of imagenes) {
    const d = Buffer.alloc(16);
    d.writeUInt8(size >= 256 ? 0 : size, 0); d.writeUInt8(size >= 256 ? 0 : size, 1);
    d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6);
    d.writeUInt32LE(buf.length, 8); d.writeUInt32LE(offset, 12);
    offset += buf.length; dirs.push(d);
  }
  return Buffer.concat([cab, ...dirs, ...imagenes.map((i) => i.buf)]);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const imgs = [];
  for (const size of [16, 32, 48]) imgs.push({ size, buf: await png(page, size) });
  fs.writeFileSync(path.join(PUB, 'favicon.ico'), ico(imgs));
  fs.writeFileSync(path.join(PUB, 'favicon-96.png'), await png(page, 96));
  fs.writeFileSync(path.join(PUB, 'icon-512.png'), await png(page, 512));
  fs.writeFileSync(path.join(PUB, 'apple-touch-icon.png'), await png(page, 180, { sinBordes: true }));
  await browser.close();
  console.log('Iconos generados en public/');
})();
