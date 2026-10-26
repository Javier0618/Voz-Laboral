// Formato mínimo de las guías: bloques separados por una línea en blanco.
// «## Título» es un subtítulo, un bloque de líneas «- …» es una lista,
// «![descripción](https://…)» sola en su bloque es una imagen y el resto son
// párrafos. Así las guías se editan en la base de datos sin HTML.
export type GuideBlock =
  | { type: 'heading'; text: string }
  | { type: 'image'; alt: string; src: string }
  | { type: 'list'; items: string[] }
  | { type: 'paragraph'; text: string };

export function parseGuide(content: string): GuideBlock[] {
  const blocks: GuideBlock[] = [];
  for (const raw of content.replace(/\r\n/g, '\n').split(/\n\s*\n/)) {
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const startIndex = blocks.length;
    if (lines[0].startsWith('## ')) {
      blocks.push({ type: 'heading', text: lines[0].slice(3).trim() });
      lines.shift();
      if (!lines.length) continue;
    }
    const image = lines.length === 1 ? /^!\[([^\]]*)\]\((https:\/\/[^\s)]+)\)$/.exec(lines[0]) : null;
    if (image) {
      blocks.push({ type: 'image', alt: image[1].trim(), src: image[2] });
      continue;
    }
    // Dentro de un bloque, las líneas «- …» seguidas forman una lista y el resto, párrafos.
    for (const line of lines) {
      const last = blocks[blocks.length - 1];
      const fresh = last !== undefined && blocks.length > startIndex;
      if (line.startsWith('- ')) {
        if (fresh && last.type === 'list') last.items.push(line.slice(2).trim());
        else blocks.push({ type: 'list', items: [line.slice(2).trim()] });
      } else if (fresh && last.type === 'paragraph') {
        last.text += ` ${line}`;
      } else {
        blocks.push({ type: 'paragraph', text: line });
      }
    }
  }
  return blocks;
}
