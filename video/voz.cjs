// Une la locución al video: corta el audio por frases y pone cada una en su escena.
// Uso: node video/voz.cjs <locucion.mp3> <video.mp4> <salida.mp4>
// Los cortes corresponden a la locución de ElevenLabs (voz «Diego», 44 s). Si
// grabas otra, ajusta `desde` y `hasta` de cada frase con los silencios que
// muestra: ffmpeg -i locucion.mp3 -af silencedetect=noise=-35dB:d=0.25 -f null -
const { execFileSync } = require('child_process');

// desde/hasta: segundos en el audio. en: segundo del video donde empieza.
const frases = [
  { desde: 0.0, hasta: 4.15, en: 0.2 },    // Antes de aceptar un trabajo…
  { desde: 4.5, hasta: 9.15, en: 4.9 },    // ¿Pagan a tiempo? … quienes trabajan ahí.
  { desde: 9.48, hasta: 13.55, en: 10.2 }, // Voz Laboral reúne experiencias…
  { desde: 13.7, hasta: 17.45, en: 15.0 }, // Y no solo quejas: lo bueno, lo malo y lo mixto.
  { desde: 17.75, hasta: 26.85, en: 22.0 }, // Busca la empresa… antes de publicarla.
  { desde: 26.98, hasta: 32.22, en: 32.2 }, // Los demás pueden reaccionar… te avisamos.
  { desde: 32.4, hasta: 37.1, en: 39.0 },  // Además, hay veinticuatro guías…
  { desde: 37.33, hasta: 39.73, en: 46.4 }, // Tu nombre y tu correo nunca se publican.
  { desde: 39.96, hasta: 44.2, en: 51.4 }, // Tu experiencia puede ayudar… Entra a Voz Laboral.
];

const [audio, video, salida] = process.argv.slice(2);
if (!salida) {
  console.error('Uso: node video/voz.cjs <locucion.mp3> <video.mp4> <salida.mp4>');
  process.exit(1);
}

const partes = frases.map((f, i) => {
  const ms = Math.round(f.en * 1000);
  return `[1:a]atrim=${f.desde}:${f.hasta},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st=${(f.hasta - f.desde - 0.06).toFixed(2)}:d=0.06,adelay=${ms}|${ms}[f${i}]`;
});
const mezcla = `${frases.map((_, i) => `[f${i}]`).join('')}amix=inputs=${frases.length}:normalize=0,apad,atrim=0:57,loudnorm=I=-14:TP=-1.5:LRA=11[voz]`;

execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-i', audio,
  '-filter_complex', [...partes, mezcla].join(';'),
  '-map', '0:v', '-map', '[voz]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2',
  '-shortest', '-movflags', '+faststart', salida], { stdio: 'inherit' });
console.log(salida);
