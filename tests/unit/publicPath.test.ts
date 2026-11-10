// URLs canónicas de las páginas públicas (auditoría SEO de noviembre de 2026):
// los enlaces internos apuntan a la versión con barra final, sin pasar por un 301.
import { describe, expect, it } from 'vitest';
import { publicPath } from '../../src/lib/publicPath.mjs';
import { seoPageFor } from '../../src/lib/seoPages.mjs';
// @ts-expect-error módulo de Node sin tipos
import { htmlDeGuia, htmlDeInicio } from '../../scripts/prerender.mjs';

describe('publicPath', () => {
  it('añade la barra a las páginas públicas y conserva consulta y ancla', () => {
    expect(publicPath('/derechos/vacaciones')).toBe('/derechos/vacaciones/');
    expect(publicPath('/derechos/vacaciones/')).toBe('/derechos/vacaciones/');
    expect(publicPath('/derechos')).toBe('/derechos/');
    expect(publicPath('/derechos?tema=salario')).toBe('/derechos/?tema=salario');
    expect(publicPath('/derechos/prima-de-servicios#cuando')).toBe('/derechos/prima-de-servicios/#cuando');
    expect(publicPath('/calculadoras/prima')).toBe('/calculadoras/prima/');
    expect(publicPath('/herramientas/cartas/carta-de-renuncia')).toBe('/herramientas/cartas/carta-de-renuncia/');
    expect(publicPath('/liquidacion')).toBe('/liquidacion/');
  });

  it('no toca rutas privadas, perfiles, la portada ni URLs externas', () => {
    for (const href of ['/', '/cuenta', '/moderacion', '/empresas/acme-bogota', '/experiencias/123', '/buscar', '//otro.com/x', 'https://x.co/derechos']) {
      expect(publicPath(href)).toBe(href);
    }
  });
});

describe('títulos de las páginas fijas', () => {
  it('una sola fuente para el HTML inicial y React', () => {
    expect(seoPageFor('/liquidacion/')?.title).toBe('Calculadora de liquidación laboral en Colombia');
    expect(seoPageFor('/calculadoras/prima')?.title).toBe('Calculadora de prima de servicios en Colombia');
    expect(seoPageFor('/calculadoras/?x=1')?.title).toBe('Calculadoras laborales en Colombia');
    expect(seoPageFor('/derechos/vacaciones/')).toBeUndefined();
  });
});

describe('prerender', () => {
  const plantilla = '<html><head><title>x</title><meta property="og:url" content="" /></head><body><div id="root"></div></body></html>';
  it('las guías enlazan sin redirecciones y muestran sus fechas', () => {
    const html: string = htmlDeGuia(plantilla, {
      slug: 'vacaciones', title: 'Vacaciones', summary: 'Resumen',
      content: 'Mira la [prima](/derechos/prima-de-servicios) y la [calculadora](/calculadoras/prima).',
      updated_at: '2026-10-27T13:45:46+00:00', last_verified_at: '2026-10-27',
    }, 'https://tuvozlaboral.com');
    expect(html).toContain('href="/derechos/prima-de-servicios/"');
    expect(html).toContain('href="/calculadoras/prima/"');
    expect(html).toContain('Verificada contra la fuente oficial: <time datetime="2026-10-27">27 de octubre de 2026</time>');
    expect(html).toContain('"item":"https://tuvozlaboral.com/derechos/"');
  });

  it('la portada declara su URL y su identidad', () => {
    const html: string = htmlDeInicio(plantilla, [{ path: '/derechos/vacaciones/', title: 'Vacaciones' }, { path: '/liquidacion', title: 'Liquidación' }], 'https://tuvozlaboral.com');
    expect(html).toContain('<meta property="og:url" content="https://tuvozlaboral.com/" />');
    expect(html).toContain('"@type":"WebSite"');
    expect(html).toContain('href="/liquidacion/"');
  });
});
