// Graba promo.html cuadro por cuadro y arma el MP4 con ffmpeg.
// Uso:
//   node video/render.cjs [salida.mp4] [--url vozlaboral.co] [--fps 30] [--frames 0,120,300]
// Con --frames solo guarda esos cuadros como PNG, para revisar el diseño.
// Requiere Playwright (Chromium) y ffmpeg instalados.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const out = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : 'vozlaboral-presentacion.mp4');
const fps = Number(opt('fps', 30));
const url = opt('url', '');
const frames = opt('frames', '');
const DURATION = 57;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.addInitScript(() => { window.__rendering = true; });
  const file = 'file://' + path.join(__dirname, 'promo.html') + (url ? `?url=${encodeURIComponent(url)}` : '');
  await page.goto(file, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));

  if (frames) {
    for (const f of frames.split(',').map(Number)) {
      await page.evaluate((t) => window.seek(t), f / fps);
      const png = out.replace(/\.mp4$/, '') + `-${String(f).padStart(4, '0')}.png`;
      await page.screenshot({ path: png });
      console.log(png);
    }
    await browser.close();
    return;
  }

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = DURATION * fps;
  for (let f = 0; f < total; f++) {
    await page.evaluate((t) => window.seek(t), f / fps);
    const jpg = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % (fps * 5) === 0) console.log(`${Math.round((f / total) * 100)} %`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log(out);
})();
