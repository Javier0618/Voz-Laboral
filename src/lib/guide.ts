// Formato de las guías: bloques separados por una línea en blanco, sin HTML.
// - «## Título» y «### Título» son subtítulos (solo en la primera línea del bloque).
// - Líneas «- …» forman una lista; líneas «1. …» una lista numerada.
// - Un bloque de líneas «> …» es un recuadro destacado («Importante»).
// - «![descripción](https://…)» sola en su bloque es una imagen.
// - Dentro del texto: **negrita**, [enlace](https://…) y enlaces internos
//   [otra guía](/derechos/slug).
// Así las guías se editan en la base de datos y nunca se inserta HTML.
export type GuideBlock =
  | { type: 'heading'; text: string; level?: 3 }
  | { type: 'image'; alt: string; src: string }
  | { type: 'list'; items: string[]; ordered?: true }
  | { type: 'note'; text: string }
  | { type: 'paragraph'; text: string };

const ORDERED = /^\d{1,3}[.)]\s+/;

export function parseGuide(content: string): GuideBlock[] {
  const blocks: GuideBlock[] = [];
  for (const raw of content.replace(/\r\n/g, '\n').split(/\n\s*\n/)) {
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const startIndex = blocks.length;
    if (lines[0].startsWith('### ')) {
      blocks.push({ type: 'heading', text: lines[0].slice(4).trim(), level: 3 });
      lines.shift();
    } else if (lines[0].startsWith('## ')) {
      blocks.push({ type: 'heading', text: lines[0].slice(3).trim() });
      lines.shift();
    }
    if (!lines.length) continue;
    const image = lines.length === 1 ? /^!\[([^\]]*)\]\((https:\/\/[^\s)]+)\)$/.exec(lines[0]) : null;
    if (image) {
      blocks.push({ type: 'image', alt: image[1].trim(), src: image[2] });
      continue;
    }
    if (lines.every((l) => l.startsWith('>'))) {
      blocks.push({ type: 'note', text: lines.map((l) => l.replace(/^>\s?/, '')).join(' ').trim() });
      continue;
    }
    // Dentro de un bloque, las líneas de lista seguidas forman una lista y el resto, párrafos.
    for (const line of lines) {
      const last = blocks[blocks.length - 1];
      const fresh = last !== undefined && blocks.length > startIndex;
      const ordered = ORDERED.test(line);
      if (line.startsWith('- ') || ordered) {
        const item = ordered ? line.replace(ORDERED, '').trim() : line.slice(2).trim();
        if (fresh && last.type === 'list' && Boolean(last.ordered) === ordered) last.items.push(item);
        else blocks.push(ordered ? { type: 'list', items: [item], ordered: true } : { type: 'list', items: [item] });
      } else if (fresh && last.type === 'paragraph') {
        last.text += ` ${line}`;
      } else {
        blocks.push({ type: 'paragraph', text: line });
      }
    }
  }
  return blocks;
}

export type InlineNode =
  | { type: 'text'; text: string }
  | { type: 'strong'; text: string }
  | { type: 'link'; text: string; href: string; internal?: true };

// Solo se reconocen enlaces https y rutas internas como «/derechos/slug»: la ruta
// empieza por «/» y una letra o número, así «//» o «/\» nunca llevan a otro sitio.
// Cualquier otro esquema queda como texto.
const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https:\/\/[^\s)]+|\/[a-z0-9][\w\-/#?=&.]*)\)/gi;

export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) nodes.push({ type: 'text', text: text.slice(last, m.index) });
    if (m[1] !== undefined) nodes.push({ type: 'strong', text: m[1] });
    else if (m[3].startsWith('/')) nodes.push({ type: 'link', text: m[2], href: m[3], internal: true });
    else nodes.push({ type: 'link', text: m[2], href: m[3] });
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push({ type: 'text', text: text.slice(last) });
  return nodes;
}

/** Texto plano, sin marcas de formato: para buscar y para el índice. */
export function plainText(text: string): string {
  return parseInline(text).map((n) => n.text).join('');
}

export function slugifyHeading(text: string): string {
  return (
    plainText(text)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'seccion'
  );
}

/** Identificadores únicos para cada subtítulo, en orden. */
export function headingIds(blocks: GuideBlock[]): Map<number, string> {
  const ids = new Map<number, string>();
  const used = new Map<string, number>();
  blocks.forEach((b, i) => {
    if (b.type !== 'heading') return;
    const base = slugifyHeading(b.text);
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    ids.set(i, n ? `${base}-${n + 1}` : base);
  });
  return ids;
}

/** Subtítulos principales («##») con su identificador, para el índice de la guía. */
export function guideOutline(content: string): { id: string; text: string }[] {
  const blocks = parseGuide(content);
  const ids = headingIds(blocks);
  return blocks.flatMap((b, i) => (b.type === 'heading' && !b.level ? [{ id: ids.get(i)!, text: plainText(b.text) }] : []));
}

/** Minutos de lectura aproximados (200 palabras por minuto, mínimo 1). */
export function readingMinutes(content: string): number {
  const words = plainText(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
