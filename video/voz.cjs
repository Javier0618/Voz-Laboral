// Une la locución al video: pone cada bloque del guion en su escena.
//
// Uso (recomendado): una carpeta con 9 clips, uno por bloque del guion
// (01.mp3 … 09.mp3, en orden; vale .mp3, .wav o .m4a):
//   node video/voz.cjs clips/ video/sin-voz.mp4 video/con-voz.mp4
//
// Uso alternativo: un solo audio con todo el guion. Se corta por sus 8
// silencios más largos, así que deja una pausa clara entre bloques:
//   node video/voz.cjs locucion.mp3 video/sin-voz.mp4 video/con-voz.mp4
//
// El guion, con sus etiquetas de ElevenLabs, está en video/README.md.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DURACION = 57;
// Segundo del video en que empieza cada bloque y hasta cuándo dura su escena.
const ESCENAS = [
  { en: 0.3, fin: 4.6, nombre: 'Gancho' },
  { en: 4.9, fin: 9.6, nombre: 'Preguntas' },
  { en: 10.0, fin: 14.4, nombre: 'Marca' },
  { en: 14.8, fin: 23.8, nombre: 'Guías' },
  { en: 24.2, fin: 31.0, nombre: 'Cada guía' },
  { en: 31.3, fin: 36.8, nombre: 'Calculadoras' },
  { en: 37.2, fin: 45.8, nombre: 'Experiencias' },
  { en: 46.1, fin: 50.8, nombre: 'Garantías' },
  { en: 51.2, fin: 57.0, nombre: 'Llamado a la acción' },
];

const [fuente, video, salida] = process.argv.slice(2);
if (!salida) {
  console.error('Uso: node video/voz.cjs <carpeta-de-clips | locucion.mp3> <video.mp4> <salida.mp4>');
  process.exit(1);
}

const duracion = (f) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

let entradas; // archivos de audio que entran a ffmpeg
let cortes; // por bloque: { entrada, desde, hasta }

if (fs.statSync(fuente).isDirectory()) {
  const clips = fs.readdirSync(fuente).filter((n) => /\.(mp3|wav|m4a)$/i.test(n)).sort();
  if (clips.length !== ESCENAS.length) {
    console.error(`La carpeta debe tener ${ESCENAS.length} clips (01 … 09). Tiene ${clips.length}.`);
    process.exit(1);
  }
  entradas = clips.map((n) => path.join(fuente, n));
  cortes = entradas.map((f, i) => ({ entrada: i, desde: 0, hasta: duracion(f) }));
} else {
  entradas = [fuente];
  const total = duracion(fuente);
  // ffmpeg informa los silencios en stderr; se capturan con spawnSync.
  const { spawnSync } = require('child_process');
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', fuente, '-af', 'silencedetect=noise=-35dB:d=0.2', '-f', 'null', '-'], { encoding: 'utf8' });
  const log = `${r.stdout}${r.stderr}`;
  const inicios = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const finales = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  const huecos = inicios
    .map((ini, i) => ({ ini, fin: finales[i] ?? total }))
    .filter((h) => h.ini > 0.05 && h.fin < total - 0.05); // ni el silencio inicial ni el final
  if (huecos.length < ESCENAS.length - 1) {
    console.error(`Solo encontré ${huecos.length} pausas; hacen falta ${ESCENAS.length - 1}. Deja una pausa más larga entre bloques o usa una carpeta de clips.`);
    process.exit(1);
  }
  const elegidos = [...huecos].sort((a, b) => (b.fin - b.ini) - (a.fin - a.ini)).slice(0, ESCENAS.length - 1).sort((a, b) => a.ini - b.ini);
  const limites = [0, ...elegidos.flatMap((h) => [h.ini, h.fin]), total];
  cortes = ESCENAS.map((_, i) => ({ entrada: 0, desde: limites[i * 2], hasta: limites[i * 2 + 1] }));
}

// Avisa si algún bloque no cabe en su escena.
cortes.forEach((c, i) => {
  const largo = c.hasta - c.desde;
  const hueco = ESCENAS[i].fin - ESCENAS[i].en;
  console.log(`${String(i + 1).padStart(2, '0')} ${ESCENAS[i].nombre}: ${largo.toFixed(2)} s de ${hueco.toFixed(1)} s disponibles${largo > hueco ? '  ← NO CABE: acórtalo o habla más rápido' : ''}`);
});

const partes = cortes.map((c, i) => {
  const ms = Math.round(ESCENAS[i].en * 1000);
  const largo = c.hasta - c.desde;
  return `[${c.entrada + 1}:a]atrim=${c.desde.toFixed(3)}:${c.hasta.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st=${Math.max(0, largo - 0.06).toFixed(2)}:d=0.06,adelay=${ms}|${ms}[f${i}]`;
});
const mezcla = `${cortes.map((_, i) => `[f${i}]`).join('')}amix=inputs=${cortes.length}:normalize=0,apad,atrim=0:${DURACION},loudnorm=I=-14:TP=-1.5:LRA=11[voz]`;

execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, ...entradas.flatMap((f) => ['-i', f]),
  '-filter_complex', [...partes, mezcla].join(';'),
  '-map', '0:v', '-map', '[voz]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2',
  '-shortest', '-movflags', '+faststart', salida], { stdio: 'inherit' });
console.log(salida);
