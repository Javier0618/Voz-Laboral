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

  it('separa una frase introductoria de la lista que la sigue en el mismo bloque', () => {
    expect(parseGuide('Según el artículo 168:\n- Nocturno 35 %\n- Extra 25 %\nTexto final.')).toEqual([
      { type: 'paragraph', text: 'Según el artículo 168:' },
      { type: 'list', items: ['Nocturno 35 %', 'Extra 25 %'] },
      { type: 'paragraph', text: 'Texto final.' },
    ]);
  });

  it('un subtítulo seguido de lista en el mismo bloque', () => {
    expect(parseGuide('## Vacaciones\n- 15 días hábiles')).toEqual([
      { type: 'heading', text: 'Vacaciones' },
      { type: 'list', items: ['15 días hábiles'] },
    ]);
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
