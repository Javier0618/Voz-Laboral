import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sin tipos
import { htmlDeGuia, htmlDeCalculadora } from '../../scripts/prerender.mjs';

const plantilla = readFileSync('index.html', 'utf8');
const guia = { slug: 'reforma-laboral', title: 'Reforma laboral: "qué" cambió & <más>', summary: 'Resumen de la guía.', cover_url: null, updated_at: '2026-11-01T00:00:00Z', last_verified_at: '2026-11-01' };

describe('HTML inicial de cada guía', () => {
  const html: string = htmlDeGuia(plantilla, guia, 'https://tuvozlaboral.com');
  it('pone el título, la descripción y las etiquetas para redes de la guía', () => {
    expect(html).toContain('<title>Reforma laboral: "qué" cambió &amp; &lt;más> · TuVozLaboral</title>');
    expect(html).toContain('<meta name="description" content="Resumen de la guía." />');
    expect(html).toContain('<meta property="og:title" content="Reforma laboral: &quot;qué&quot; cambió &amp; &lt;más> · TuVozLaboral" />');
    expect(html).toContain('<meta property="og:type" content="article" />');
    expect(html).toContain('<meta property="og:url" content="https://tuvozlaboral.com/derechos/reforma-laboral/" />');
    expect(html).toContain('<link rel="canonical" href="https://tuvozlaboral.com/derechos/reforma-laboral/" />');
    expect(html).toContain('"@type":"Article"');
    expect(html).not.toContain('"datePublished"');
    expect(html).toContain('"dateModified":"2026-11-01T00:00:00Z"');
    expect(html).not.toContain('content="TuVozLaboral: guías laborales para trabajadores en Colombia"');
  });
  it('mantiene la web intacta: el mismo contenedor y los mismos scripts', () => {
    expect(html).toContain('<div id="root"><main');
    expect(html.match(/<script/g)?.length).toBe((plantilla.match(/<script/g)?.length ?? 0) + 1);
  });
  it('entrega también el contenido público de la guía en el HTML inicial', () => {
    const contenido = 'Introducción visible.\n\n## Qué dice la ley\nTexto **importante** con [guía relacionada](/derechos/otra/).\n\n- Primer paso\n- Segundo paso';
    const h: string = htmlDeGuia(plantilla, { ...guia, content: contenido }, 'https://tuvozlaboral.com');
    expect(h).toContain('<h1>Reforma laboral: "qué" cambió &amp; &lt;más></h1>');
    expect(h).toContain('<h2>Qué dice la ley</h2>');
    expect(h).toContain('<strong>importante</strong>');
    expect(h).toContain('<a href="/derechos/otra/">guía relacionada</a>');
    expect(h).toContain('<li>Primer paso</li>');
    expect(h).toContain('<li>Segundo paso</li>');
    expect(h).toContain('<div id="root"><main');
  });
  it('escapa etiquetas y no acepta enlaces inseguros de la guía', () => {
    const h: string = htmlDeGuia(plantilla, { ...guia, content: '<script>alert(1)</script> [clic](javascript:alert(1))' }, 'https://tuvozlaboral.com');
    expect(h).not.toContain('<script>alert(1)</script>');
    expect(h).toContain('&lt;script>alert(1)&lt;/script>');
    expect(h).not.toContain('href="javascript:');
  });
  it('usa la portada de la guía si tiene una', () => {
    const conPortada: string = htmlDeGuia(plantilla, { ...guia, cover_url: 'https://x.supabase.co/a.png' }, 'https://tuvozlaboral.com');
    expect(conPortada).toContain('<meta property="og:image" content="https://x.supabase.co/a.png" />');
    expect(conPortada).not.toContain('og:image:width');
  });
});

describe('HTML inicial de calculadoras', () => {
  it('incluye título, descripción, canonical y contenido propio antes de React', () => {
    const info = {
      path: '/calculadoras/prima',
      title: 'Calculadora de prima de servicios en Colombia',
      description: 'Calcula la prima de servicios.',
    };
    const html: string = htmlDeCalculadora(plantilla, info, 'https://tuvozlaboral.com');
    expect(html).toContain('<title>Calculadora de prima de servicios en Colombia · TuVozLaboral</title>');
    expect(html).toContain('<meta name="description" content="Calcula la prima de servicios." />');
    expect(html).toContain('<link rel="canonical" href="https://tuvozlaboral.com/calculadoras/prima/" />');
    expect(html).toContain('<meta property="og:url" content="https://tuvozlaboral.com/calculadoras/prima/" />');
    expect(html).toContain('<div id="root"><main');
    expect(html).toContain('<h1>Calculadora de prima de servicios en Colombia</h1>');
    expect(html).toContain('"@type":"WebPage"');
  });
  it('escapa valores del catálogo en el HTML', () => {
    const html: string = htmlDeCalculadora(plantilla, {
      path: '/calculadoras/prima', title: 'Prima & <riesgo>',
      description: 'Texto con <script>alert(1)</script>',
    }, 'https://tuvozlaboral.com');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('Prima &amp; &lt;riesgo>');
    expect(html).toContain('Texto con &lt;script>alert(1)&lt;/script>');
  });
});
