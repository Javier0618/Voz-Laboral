// Etiquetas para buscadores y redes: siempre con el dominio oficial.
import { describe, expect, it } from 'vitest';
import { setPageMeta } from '../../src/lib/meta';

const prop = (p: string) => document.querySelector(`meta[property="${p}"]`)?.getAttribute('content');
const canonical = () => document.querySelector('link[rel="canonical"]')?.getAttribute('href');

describe('setPageMeta', () => {
  it('usa el dominio oficial en la dirección canónica, og:url y la imagen', () => {
    setPageMeta({ title: 'Guía', description: 'Descripción', path: '/derechos/x', image: '/portada.png' });
    expect(canonical()).toBe('https://tuvozlaboral.com/derechos/x');
    expect(prop('og:url')).toBe('https://tuvozlaboral.com/derechos/x');
    expect(prop('og:image')).toBe('https://tuvozlaboral.com/portada.png');
  });

  it('sin imagen propia usa la imagen por defecto y no la de la página anterior', () => {
    setPageMeta({ title: 'Otra', description: 'Descripción', path: '/derechos/y' });
    expect(prop('og:image')).toBe('https://tuvozlaboral.com/og-default.png');
  });

  it('respeta las imágenes con dirección completa (portadas en Supabase)', () => {
    setPageMeta({ title: 'Con portada', description: 'Descripción', path: '/derechos/z', image: 'https://x.supabase.co/storage/v1/object/public/guias/z/a.png' });
    expect(prop('og:image')).toBe('https://x.supabase.co/storage/v1/object/public/guias/z/a.png');
  });
});
