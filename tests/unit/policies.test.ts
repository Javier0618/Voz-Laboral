// Sin AdSense configurado, las políticas solo hablan de medición (Google Analytics).
import { describe, expect, it } from 'vitest';
import { policies } from '../../src/content/policies';

const texto = (slug: string) => {
  const p = policies.find((x) => x.slug === slug)!;
  return [p.summary, ...p.sections.flatMap((s) => [s.heading, ...s.paragraphs])].join('\n');
};

describe('políticas sin AdSense', () => {
  it('no mencionan AdSense ni la publicidad personalizada', () => {
    for (const slug of ['tratamiento-de-datos', 'privacidad', 'cookies', 'terminos']) {
      expect(texto(slug), slug).not.toMatch(/AdSense|publicidad personalizada|anuncios/i);
    }
  });
  it('explican Google Analytics y cómo desactivarlo', () => {
    expect(texto('cookies')).toMatch(/Google Analytics/);
    expect(texto('cookies')).toContain('https://tools.google.com/dlpage/gaoptout');
    expect(texto('tratamiento-de-datos')).toMatch(/medir qué páginas se visitan/);
  });
});
