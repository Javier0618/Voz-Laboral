// Revisión de calidad y SEO de una guía antes de guardarla (ver CLAUDE.md,
// «Estándar de calidad de las guías»). La usa scripts/editorial.mjs.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const palabras = (t) => (t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').match(/[\p{L}\p{N}]+/gu) ?? []).length;
const SECCIONES = ['Qué dice la ley', 'En la práctica', 'Errores comunes', 'Qué puedes hacer'];

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

  for (const resto of ['Primer paso concreto', 'Primer malentendido', 'Resume aquí', 'Explica cómo se aplica', 'lorem ipsum', 'TODO', 'PENDIENTE', '[texto]'])
    if (content.toLowerCase().includes(resto.toLowerCase())) errores.push(`relleno: queda texto de plantilla («${resto}»).`);

  const largos = content.split(/\n\s*\n/).filter((b) => !/^\s*([-*>]|\d+\.|#)/.test(b) && palabras(b) > 120).length;
  if (largos) avisos.push(`legibilidad: ${largos} párrafo(s) de más de 120 palabras; divídelos.`);
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
