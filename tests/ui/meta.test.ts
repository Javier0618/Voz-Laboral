// Etiquetas para buscadores y redes: siempre con el dominio oficial.
import { describe, expect, it } from 'vitest';
import { setPageMeta, setRouteDefaults } from '../../src/lib/meta';

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

  it('pone «noindex» solo donde se pide y lo quita al cambiar de página', () => {
    const robots = () => document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null;
    setPageMeta({ title: 'Empresa vacía', description: 'Sin experiencias', path: '/empresas/x', robots: 'noindex, follow' });
    expect(robots()).toBe('noindex, follow');
    setPageMeta({ title: 'Guía', description: 'Descripción', path: '/derechos/y' });
    expect(robots()).toBeNull();
    setPageMeta({ title: 'Empresa vacía', description: 'Sin experiencias', path: '/empresas/x', robots: 'noindex, follow' });
    setPageMeta(null);
    expect(robots()).toBeNull();
  });

  it('cada ruta tiene su propia dirección canónica, nunca la portada', () => {
    setRouteDefaults('/politicas/cookies');
    expect(canonical()).toBe('https://tuvozlaboral.com/politicas/cookies');
    expect(prop('og:url')).toBe('https://tuvozlaboral.com/politicas/cookies');
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('las rutas privadas no se indexan y el enlace de seguimiento no aparece', () => {
    setRouteDefaults('/seguimiento/token-secreto');
    expect(canonical()).toBe('https://tuvozlaboral.com/seguimiento');
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow');
    setRouteDefaults('/cuenta');
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow');
    setRouteDefaults('/derechos');
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('los datos estructurados llevan @context y varios objetos van en un @graph', () => {
    setPageMeta({ title: 'Guía', description: 'Descripción', path: '/derechos/x', jsonLd: [{ '@type': 'Article', headline: 'Guía' }, { '@type': 'BreadcrumbList', itemListElement: [] }] });
    const json = JSON.parse(document.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(json['@context']).toBe('https://schema.org');
    expect(json['@graph'].map((x: { '@type': string }) => x['@type'])).toEqual(['Article', 'BreadcrumbList']);
  });
});
