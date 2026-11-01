// Genera public/og-default.png (1200×630) a partir de og-default.html.
// Uso: node scripts/og/generar-og.cjs   (requiere Playwright con Chromium)
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto('file://' + path.join(__dirname, 'og-default.html'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(__dirname, '..', '..', 'public', 'og-default.png');
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  console.log(out);
})();
