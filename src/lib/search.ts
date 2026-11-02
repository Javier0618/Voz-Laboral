/** Búsqueda en el navegador de lo que no está en la base de datos: calculadoras y temas. */
import { CALCULADORAS, type CalculadoraInfo } from './calculadoras';
import { TEMAS_GUIAS, type TemaGuia } from './temasGuias';

/** Igual que private.normalize_text: minúsculas, sin tildes y solo letras y números. */
export function normalizeQuery(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const STOPWORDS = new Set(['que', 'los', 'las', 'del', 'por', 'para', 'con', 'una', 'uno', 'como', 'cual', 'cuando', 'donde', 'mis', 'tus', 'sus', 'mas', 'sin']);
const words = (q: string) => normalizeQuery(q).split(' ').filter((w) => w.length >= 3 && !STOPWORDS.has(w));

/** Coincide si aparece al menos la mitad de las palabras con significado («prima diciembre» → 1 de 2). */
function matches(q: string, haystack: string) {
  const ws = words(q);
  const text = normalizeQuery(haystack);
  const hits = ws.filter((w) => text.includes(w)).length;
  return ws.length > 0 && hits >= Math.ceil(ws.length / 2);
}

export function searchCalculators(q: string): CalculadoraInfo[] {
  return CALCULADORAS.filter((c) => matches(q, `${c.title} ${c.description} ${c.match.join(' ')}`)).slice(0, 4);
}

export function searchTopics(q: string): TemaGuia[] {
  return TEMAS_GUIAS.filter((t) => matches(q, `${t.name} ${t.description}`)).slice(0, 3);
}
