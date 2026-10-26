// Formato mínimo de las guías: bloques separados por una línea en blanco.
// «## Título» es un subtítulo, un bloque de líneas «- …» es una lista y el
// resto son párrafos. Así las guías se editan en la base de datos sin HTML.
export type GuideBlock =
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'paragraph'; text: string };

export function parseGuide(content: string): GuideBlock[] {
  const blocks: GuideBlock[] = [];
  for (const raw of content.replace(/\r\n/g, '\n').split(/\n\s*\n/)) {
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    if (lines[0].startsWith('## ')) {
      blocks.push({ type: 'heading', text: lines[0].slice(3).trim() });
      lines.shift();
      if (!lines.length) continue;
    }
    if (lines.every((l) => l.startsWith('- '))) {
      blocks.push({ type: 'list', items: lines.map((l) => l.slice(2).trim()) });
    } else {
      blocks.push({ type: 'paragraph', text: lines.join(' ') });
    }
  }
  return blocks;
}
