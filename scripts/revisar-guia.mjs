// Revisión de calidad y SEO de una guía antes de guardarla (ver CLAUDE.md,
// «Estándar de calidad de las guías»). La usa scripts/editorial.mjs.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const palabras = (t) => (t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').match(/[\p{L}\p{N}]+/gu) ?? []).length;
// Obligatorias en las guías legales. Entre «Qué dice la ley» y «Errores comunes» va al menos una sección práctica, con el nombre que necesite.
const SECCIONES = ['Qué dice la ley', 'Errores comunes', 'Qué puedes hacer'];
const FIJAS = /^(Qué dice la ley|Errores comunes|Qué puedes hacer|Preguntas frecuentes|Herramientas y lecturas)/i;
// Estilo editorial (docs/estilo-editorial.md): anzuelos prohibidos en el título y muletillas que restan ritmo.
const ANZUELOS = /no (vas a )?creer[aá]s?|impactante|incre[ií]ble|lo que nadie te (dice|cuenta)|no quiere que sepas|te sorprender[aá]|atenci[oó]n:/i;
const MULETILLAS = ['es importante destacar', 'es importante mencionar', 'cabe resaltar', 'cabe destacar', 'cabe mencionar', 'vale la pena mencionar', 'sin lugar a dudas', 'en este artículo', 'en esta guía te explicamos', 'en esta guía encontrarás', 'es importante conocer', 'es importante tener en cuenta', 'cabe señalar', 'hoy te explicamos', 'en conclusión', 'en resumen,'];

/**
 * Revisa una guía contra el estándar de CLAUDE.md. Errores bloquean; avisos no.
 * tipo «legal»: explica derechos u obligaciones; exige las secciones de la
 * plantilla y citar la norma. tipo «informativa»: tendencias, posibles cambios,
 * consejos o temas generales del trabajo; estructura libre y sin cita de norma.
 */
export function revisarGuia({ slug, title, summary, content, sources, tipo = 'legal' }, { propuesta = false } = {}) {
  const legal = tipo !== 'informativa';
  const errores = [];
  const avisos = [];
  const h2 = [...content.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
  const n = palabras(content);

  if (!propuesta) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug ?? '') || slug.length > 60) errores.push('slug: solo minúsculas, números y guiones, máximo 60 caracteres.');
    else if (slug.split('-').length > 7) avisos.push('slug: más de 7 palabras; acórtalo a la búsqueda principal.');
    const t = (title ?? '').trim().length;
    if (t < 20 || t > 90) errores.push(`título: ${t} caracteres; debe tener entre 20 y 90 (ideal, 40 a 60).`);
    else if (t < 40 || t > 60) avisos.push(`título: ${t} caracteres; lo ideal son 40 a 60 para que Google no lo corte.`);
    if (ANZUELOS.test(title ?? '') || /[!¡]/.test(title ?? '') || /[A-ZÁÉÍÓÚÑ]{4,}\s+[A-ZÁÉÍÓÚÑ]{4,}/.test(title ?? ''))
      errores.push('título: parece un anzuelo (exclamaciones, mayúsculas o fórmulas como «no vas a creer»); di el dato o la consecuencia concreta.');
    const r = (summary ?? '').trim().length;
    if (r < 70 || r > 300) errores.push(`resumen: ${r} caracteres; debe tener entre 70 y 300 (ideal, 120 a 160).`);
    else if (r < 120 || r > 160) avisos.push(`resumen: ${r} caracteres; lo ideal son 120 a 160 (es la meta descripción).`);
    if (!Array.isArray(sources) || !sources.length) errores.push(`fuentes: hace falta al menos una fuente${legal ? ' oficial' : ' confiable'}.`);
    else if (sources.some((f) => !/^https?:\/\//.test(f.url ?? '') || !(f.label ?? '').trim())) errores.push('fuentes: cada una necesita nombre y dirección http(s).');
  }

  if (n < 800) errores.push(`longitud: ${n} palabras; el mínimo es 800 (ideal, 1.000 a 2.000).`);
  else if (n < 1000) avisos.push(`longitud: ${n} palabras; lo ideal son 1.000 a 2.000, si el tema lo permite sin relleno.`);
  else if (n > 3000) avisos.push(`longitud: ${n} palabras; más de 3.000. Considera dividir el tema en dos guías.`);

  if (/^# /m.test(content)) errores.push('estructura: no uses «# »; el título de la página ya es el H1. Usa «## » y «### ».');
  if (legal) {
    for (const s of SECCIONES) if (!h2.some((h) => h.toLowerCase().startsWith(s.toLowerCase()))) errores.push(`estructura: falta la sección «## ${s}» (guía legal).`);
    if (!h2.some((h) => !FIJAS.test(h))) errores.push('estructura: falta una sección práctica entre «Qué dice la ley» y «Errores comunes» («## En la práctica» o una con la pregunta que responde, con el ejemplo en cifras).');
  } else if (h2.filter((h) => !/^Preguntas frecuentes/i.test(h)).length < 3) {
    errores.push('estructura: un artículo informativo necesita al menos 3 secciones «## » además de las preguntas frecuentes.');
  }
  const faq = content.match(/^## Preguntas frecuentes[\s\S]*?(?=^## |(?![\s\S]))/m)?.[0] ?? '';
  const preguntas = (faq.match(/^### ¿.+\?\s*$/gm) ?? []).length;
  if (preguntas < 3) (legal ? errores : avisos).push(`preguntas frecuentes: ${legal ? 'hacen falta' : 'conviene incluir'} al menos 3 («## Preguntas frecuentes» con «### ¿…?»); hay ${preguntas}.`);

  const internos = new Set([...content.matchAll(/\]\((\/(?:derechos|calculadoras)\/[a-z0-9-]+[^)]*)\)/g)].map((m) => m[1]));
  if (internos.size < 2) errores.push(`enlaces internos: hay ${internos.size}; incluye al menos 2 a guías o calculadoras existentes.`);
  if (/\]\(\/(?:derechos|calculadoras)\/\)/.test(content)) errores.push('enlaces internos: hay enlaces de plantilla sin completar («/derechos/» o «/calculadoras/»).');
  if (/\]\([^)]*\s[^)]*\)/.test(content)) errores.push('enlaces: una dirección tiene espacios.');

  for (const resto of ['Primer paso concreto', 'Primer malentendido', 'Resume aquí', 'Explica cómo se aplica', 'Abre con una entradilla', 'lorem ipsum', '[texto]'])
    if (content.toLowerCase().includes(resto.toLowerCase())) errores.push(`relleno: queda texto de plantilla («${resto}»).`);
  // Marcas de trabajo pendiente: solo en mayúsculas y como palabra, para no confundirlas con «todos» o «pendientes».
  for (const marca of content.match(/\b(TODO|PENDIENTE)\b/g) ?? []) errores.push(`relleno: queda texto de plantilla («${marca}»).`);

  const parrafos = content.split(/\n\s*\n/).filter((b) => !/^\s*([-*>|!]|\d+\.|#)/.test(b));
  const largos = parrafos.filter((b) => palabras(b) > 80).length;
  if (largos) avisos.push(`legibilidad: ${largos} párrafo(s) de más de 80 palabras; deja una idea por párrafo, de 1 a 3 frases.`);
  // Formato que el sitio no muestra o que ya pone solo.
  if (/^\s*\|?\s*:?-{3,}:?\s*\|/m.test(content)) errores.push('formato: hay una tabla y el sitio no las muestra (saldrían las rayas «|---|»); usa una lista o un gráfico.');
  const duplicadas = h2.filter((h) => /^(Fuentes|Referencias|Normas consultadas|Bibliografía)/i.test(h));
  if (duplicadas.length) errores.push(`estructura: quita «## ${duplicadas[0]}»; las fuentes van en la ficha y el sitio ya las muestra.`);
  if (/^\*\*(Verificación normativa|Última actualización|Fecha de actualización|Aviso)\b[^*]*\*\*/im.test(content)) errores.push('estructura: quita las líneas de fecha o aviso del final («Última actualización», «Verificación normativa», «Aviso»); el sitio ya las muestra.');
  // Un texto hecho casi todo de listas parece un esquema, no una persona explicando.
  const bloques = content.split(/\n\s*\n/).map((b) => b.trim()).filter((b) => b && !b.startsWith('#') && !b.startsWith('!['));
  const palabrasLista = bloques.filter((b) => /^([-*]|\d+\.)\s/.test(b)).reduce((t, b) => t + palabras(b), 0);
  const palabrasTotal = bloques.reduce((t, b) => t + palabras(b), 0);
  if (palabrasTotal > 0 && palabrasLista / palabrasTotal > 0.55) avisos.push(`voz: el ${Math.round((100 * palabrasLista) / palabrasTotal)} % del texto está en listas y parece un esquema; explica en prosa lo que necesita razonamiento y deja las listas para pasos y requisitos.`);
  // Las fuentes orientan, no se copian: una cita literal larga suele ser texto copiado.
  const citasLargas = [...content.matchAll(/[«"“]([^»"”]{20,})[»"”]/g)].filter((m) => palabras(m[1]) > 25).length;
  if (citasLargas) avisos.push(`originalidad: ${citasLargas} cita(s) textual(es) de más de 25 palabras; explica con tus palabras y deja entre comillas solo lo que necesita las palabras exactas.`);
  const sinEmbargo = (content.match(/sin embargo/gi) ?? []).length;
  if (sinEmbargo > 3) avisos.push(`estilo: «sin embargo» aparece ${sinEmbargo} veces; varía los conectores o divide las ideas.`);
  const imagenes = [...content.matchAll(/^!\[([^\]]*)\]\(([^)]*)\)\s*$/gm)];
  for (const [, alt, url] of imagenes) {
    if (!/^https:\/\//.test(url)) errores.push(`imágenes: «${url}» no es una dirección https; súbela con «editorial.mjs imagen».`);
    if (alt.trim().length < 20) errores.push('imágenes: cada gráfico necesita una descripción de al menos 20 caracteres que diga qué muestra (texto alternativo).');
  }
  if (imagenes.length > 3) avisos.push(`imágenes: hay ${imagenes.length}; usa solo las que explican algo mejor que el texto (máximo recomendado, 3).`);
  if (/^!\[[^\]]*\]\([^)]*\)/m.test(content.split(/^## /m)[0] ?? '')) avisos.push('imágenes: no pongas un gráfico en la entradilla; va junto al párrafo que explica.');
  const entradilla = palabras((content.split(/^## /m)[0] ?? '').replace(/!\[[^\]]*\]\([^)]*\)/g, ''));
  if (!entradilla) avisos.push('estilo: no hay entradilla; abre con 2 o 3 párrafos antes del primer «## »: el gancho y la respuesta directa (docs/estilo-editorial.md).');
  else if (entradilla > 150) avisos.push(`estilo: la entradilla tiene ${entradilla} palabras; déjala en 60 a 100 y lleva el detalle a las secciones.`);
  const bajo = content.toLowerCase();
  const usadas = MULETILLAS.filter((m) => bajo.includes(m));
  if (usadas.length) avisos.push(`estilo: muletillas que restan ritmo («${usadas.join('», «')}»); quítalas o di la idea directamente.`);
  if ((content.match(/!(?!\[)/g) ?? []).length > 1) avisos.push('estilo: hay signos de exclamación; el tono de TuVozLaboral es cercano, no alarmista.');
  if (!/\d/.test(content)) avisos.push('valor: no hay ninguna cifra; añade un ejemplo con montos, plazos o porcentajes si el tema lo permite.');
  if (legal && !/(art(ículo|\.)\s*\d|Ley \d|Decreto \d|Resolución \d|Sentencia [A-Z]+-?\d)/i.test(content)) errores.push('fuente en el texto: una guía legal cita al menos una norma o sentencia (artículo, ley, decreto…). Si el texto no trata de derechos u obligaciones, márcalo como «informativa».');

  return { errores, avisos, palabras: n };
}

export function imprimirRevision({ errores, avisos, palabras: n }) {
  console.log(`Palabras: ${n}`);
  for (const e of errores) console.log(`✗ ${e}`);
  for (const a of avisos) console.log(`! ${a}`);
  if (!errores.length) console.log(avisos.length ? '✓ Cumple el estándar (con avisos).' : '✓ Cumple el estándar.');
  return errores.length === 0;
}

export function leerGuia(ruta, tipo) {
  if (ruta.endsWith('.md')) return { content: readFileSync(ruta, 'utf8'), propuesta: true, tipo: tipo ?? 'legal' };
  const g = JSON.parse(readFileSync(ruta, 'utf8'));
  return { ...g, content: g.content ?? readFileSync(resolve(dirname(ruta), g.content_file), 'utf8') };
}
