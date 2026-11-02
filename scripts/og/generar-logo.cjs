// Genera el logo de TuVozLaboral en PNG para redes y documentos (carpeta marca/).
// Reproduce el componente Logo de src/components/Layout.tsx con la misma fuente.
// Uso: node scripts/og/generar-logo.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');
const SALIDA = path.join(RAIZ, 'marca');
const FUENTE = path.join(RAIZ, 'node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2');
const TINTA = '#0F2440';
const VERDE = '#2BB3A5';
const GLOBO = 'M11 4.2a7.3 7.3 0 1 1-4.9 12.8L3 19.6l1-4.2A7.3 7.3 0 0 1 11 4.2z';

/** Logo horizontal. `tinta`: color del texto; `fondo`: color de los puntos del globo. */
const logo = (tinta, secundario, fondo) => `
  <span class="logo" style="color:${tinta}">tuv<svg viewBox="1.1 2.4 19.9 19.4" class="globo"><path d="${GLOBO}" fill="${VERDE}" stroke="${VERDE}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="8" cy="11.5" r="1.3" fill="${fondo}"/><circle cx="11.2" cy="11.5" r="1.3" fill="${fondo}"/><circle cx="14.4" cy="11.5" r="1.3" fill="${fondo}"/></svg>z<svg viewBox="0 0 17 20" class="ondas" fill="none" stroke="${VERDE}" stroke-width="2.6" stroke-linecap="round"><path d="M2 6.5a5 5 0 0 1 0 7"/><path d="M6.5 3a10 10 0 0 1 0 14"/><path d="M11 0a14.5 14.5 0 0 1 0 20" stroke-opacity=".5"/></svg><span style="font-weight:450;color:${secundario}">laboral</span></span>`;

const pagina = (cuerpo, fondo, tamano) => `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family: 'Instrument Sans'; src: url('file://${FUENTE}') format('woff2'); font-weight: 400 700; }
  html, body { margin: 0; background: ${fondo}; }
  body { display: flex; align-items: center; justify-content: center; width: ${tamano.w}px; height: ${tamano.h}px; flex-direction: column; gap: ${tamano.h * 0.05}px; }
  .logo { font-family: 'Instrument Sans', sans-serif; font-weight: 700; letter-spacing: -0.03em; line-height: 1; white-space: nowrap; font-size: ${tamano.fuente}px; }
  .globo { display: inline-block; height: 0.74em; width: auto; vertical-align: -0.13em; margin: 0 0.01em; }
  .ondas { display: inline-block; height: 0.56em; width: auto; vertical-align: 0.25em; margin: 0 -0.02em 0 0.01em; transform: rotate(-45deg); transform-origin: 0% 60%; overflow: visible; }
  .lema { font-family: 'Instrument Sans', sans-serif; font-size: ${tamano.fuente * 0.2}px; font-weight: 500; letter-spacing: 0.01em; }
</style></head><body>${cuerpo}</body></html>`;

const VARIANTES = [
  { nombre: 'logo-fondo-oscuro.png', fondo: TINTA, html: logo('#FFFFFF', 'rgba(255,255,255,.8)', TINTA), tamano: { w: 2400, h: 800, fuente: 300 } },
  { nombre: 'logo-fondo-claro.png', fondo: '#FFFFFF', html: logo(TINTA, 'rgba(15,36,64,.75)', '#FFFFFF'), tamano: { w: 2400, h: 800, fuente: 300 } },
  { nombre: 'logo-transparente-para-fondo-oscuro.png', fondo: 'transparent', transparente: true, html: logo('#FFFFFF', 'rgba(255,255,255,.8)', TINTA), tamano: { w: 2400, h: 800, fuente: 300 } },
  { nombre: 'logo-transparente-para-fondo-claro.png', fondo: 'transparent', transparente: true, html: logo(TINTA, 'rgba(15,36,64,.75)', '#FFFFFF'), tamano: { w: 2400, h: 800, fuente: 300 } },
  {
    nombre: 'publicacion-cuadrada-1080.png', fondo: TINTA, tamano: { w: 1080, h: 1080, fuente: 150 },
    html: `${logo('#FFFFFF', 'rgba(255,255,255,.8)', TINTA)}<span class="lema" style="color:rgba(255,255,255,.75)">Guías laborales para Colombia</span>`,
  },
  {
    nombre: 'portada-redes-1500x500.png', fondo: TINTA, tamano: { w: 1500, h: 500, fuente: 170 },
    html: `${logo('#FFFFFF', 'rgba(255,255,255,.8)', TINTA)}<span class="lema" style="color:rgba(255,255,255,.75)">Tus derechos laborales, con la ley en la mano · tuvozlaboral.com</span>`,
  },
];

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const v of VARIANTES) {
    await page.setViewportSize({ width: v.tamano.w, height: v.tamano.h });
    const archivo = path.join(SALIDA, '.tmp.html');
    fs.writeFileSync(archivo, pagina(v.html, v.fondo, v.tamano));
    await page.goto('file://' + archivo);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(SALIDA, v.nombre), omitBackground: Boolean(v.transparente) });
    fs.unlinkSync(archivo);
    console.log(v.nombre);
  }
  // Foto de perfil: el icono de la web (globo y ondas), centrado con margen
  // para que no se corte cuando la red social lo muestra en círculo.
  const icono = fs.readFileSync(path.join(RAIZ, 'public', 'favicon.svg'), 'utf8').replace(/<rect[^>]*\/>/, '');
  const svg = 'data:image/svg+xml;base64,' + Buffer.from(icono).toString('base64');
  for (const [nombre, lado] of [['perfil-redes-1080.png', 1080], ['icono-512.png', 512]]) {
    await page.setViewportSize({ width: lado, height: lado });
    await page.setContent(`<html><body style="margin:0;background:${TINTA};display:flex;align-items:center;justify-content:center;width:${lado}px;height:${lado}px"><img src="${svg}" style="width:${Math.round(lado * 0.72)}px;height:${Math.round(lado * 0.72)}px;transform:translate(2.2%,-3.4%)"></body></html>`);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(SALIDA, nombre) });
    console.log(nombre);
  }
  await browser.close();
})();
