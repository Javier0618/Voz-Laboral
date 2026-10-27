import { describe, expect, it } from 'vitest';
import { guideOutline, parseGuide, parseInline, plainText, readingMinutes } from '../../src/lib/guide';

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

describe('formato enriquecido de las guías', () => {
  it('reconoce subtítulos menores, listas numeradas y recuadros', () => {
    expect(parseGuide('### Detalle\nTexto.\n\n1. Primero\n2. Segundo\n\n> Guarda copia\n> de todo.')).toEqual([
      { type: 'heading', text: 'Detalle', level: 3 },
      { type: 'paragraph', text: 'Texto.' },
      { type: 'list', items: ['Primero', 'Segundo'], ordered: true },
      { type: 'note', text: 'Guarda copia de todo.' },
    ]);
  });

  it('no mezcla una lista con viñetas y una numerada seguidas', () => {
    expect(parseGuide('- a\n1. b')).toEqual([
      { type: 'list', items: ['a'] },
      { type: 'list', items: ['b'], ordered: true },
    ]);
  });

  it('separa negrita y enlaces https, y deja como texto otros esquemas', () => {
    expect(parseInline('Mira **esto** y [la ley](https://www.secretariasenado.gov.co/x).')).toEqual([
      { type: 'text', text: 'Mira ' },
      { type: 'strong', text: 'esto' },
      { type: 'text', text: ' y ' },
      { type: 'link', text: 'la ley', href: 'https://www.secretariasenado.gov.co/x' },
      { type: 'text', text: '.' },
    ]);
    expect(parseInline('[x](javascript:alert(1))')).toEqual([{ type: 'text', text: '[x](javascript:alert(1))' }]);
    expect(parseInline('[x](http://inseguro.test)')[0].type).toBe('text');
  });

  it('reconoce enlaces internos a otras guías y rechaza rutas a otros sitios', () => {
    expect(parseInline('Lee [la prima](/derechos/prima-de-servicios#cuando).')).toEqual([
      { type: 'text', text: 'Lee ' },
      { type: 'link', text: 'la prima', href: '/derechos/prima-de-servicios#cuando', internal: true },
      { type: 'text', text: '.' },
    ]);
    expect(parseInline('[x](//otro.test)')[0].type).toBe('text');
    expect(parseInline('[x](/\\otro.test)')[0].type).toBe('text');
    expect(plainText('[la prima](/derechos/prima-de-servicios)')).toBe('la prima');
  });

  it('genera el índice con identificadores únicos y sin tildes', () => {
    expect(guideOutline('## Qué es\nA\n\n### Sub\nB\n\n## Qué es\nC')).toEqual([
      { id: 'que-es', text: 'Qué es' },
      { id: 'que-es-2', text: 'Qué es' },
    ]);
  });

  it('calcula el tiempo de lectura', () => {
    expect(readingMinutes('palabra '.repeat(50))).toBe(1);
    expect(readingMinutes('palabra '.repeat(1000))).toBe(5);
  });
});
