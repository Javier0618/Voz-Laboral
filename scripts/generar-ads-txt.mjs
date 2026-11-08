// Genera ads.txt desde la misma configuración de entorno que utiliza Vite.
// Solo IDs públicos de AdSense: nunca incluir credenciales privadas.
import { loadEnv } from 'vite';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { dirname } from 'node:path';

const output = process.env.ADS_TXT_OUT || 'dist/ads.txt';
const id = (loadEnv('production', process.cwd(), 'VITE_').VITE_ADSENSE_CLIENT || '').trim();
if (!id) {
  await rm(output, { force: true });
  console.log('→ AdSense no configurado: sin ads.txt.');
} else if (!/^ca-pub-\d{16}$/.test(id)) {
  throw new Error('VITE_ADSENSE_CLIENT debe ser ca-pub- seguido de 16 dígitos.');
} else {
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `google.com, ${id.slice(3)}, DIRECT, f08c47fec0942fa0\n`, 'utf8');
  console.log('✓ ads.txt generado para AdSense.');
}
