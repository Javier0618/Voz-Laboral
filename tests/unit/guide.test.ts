import { describe, expect, it } from 'vitest';
import { parseGuide } from '../../src/lib/guide';

describe('formato de las guías', () => {
  it('separa subtítulos, listas y párrafos', () => {
    const blocks = parseGuide('## Qué dice la ley\nPrimer párrafo\nque sigue.\n\n- Uno\n- Dos\n\n## Otro\n\nFinal.');
    expect(blocks).toEqual([
      { type: 'heading', text: 'Qué dice la ley' },
      { type: 'paragraph', text: 'Primer párrafo que sigue.' },
      { type: 'list', items: ['Uno', 'Dos'] },
      { type: 'heading', text: 'Otro' },
      { type: 'paragraph', text: 'Final.' },
    ]);
  });

  it('un bloque con líneas mezcladas es un párrafo, no una lista', () => {
    expect(parseGuide('- Uno\nTexto suelto')).toEqual([{ type: 'paragraph', text: '- Uno Texto suelto' }]);
  });

  it('ignora líneas en blanco extra y finales de línea de Windows', () => {
    expect(parseGuide('\r\n\r\n## Título\r\nTexto\r\n\r\n\r\n')).toEqual([
      { type: 'heading', text: 'Título' },
      { type: 'paragraph', text: 'Texto' },
    ]);
  });

  it('reconoce imágenes https en su propio bloque y rechaza otros esquemas', () => {
    expect(parseGuide('![Tabla de recargos](https://x.supabase.co/storage/v1/object/public/guias/a.png)')).toEqual([
      { type: 'image', alt: 'Tabla de recargos', src: 'https://x.supabase.co/storage/v1/object/public/guias/a.png' },
    ]);
    expect(parseGuide('![x](javascript:alert(1))')[0].type).toBe('paragraph');
    expect(parseGuide('![x](http://inseguro.test/a.png)')[0].type).toBe('paragraph');
  });
});
