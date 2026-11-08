import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sin tipos
import { htmlDeGuia, htmlDeCalculadora, htmlDeInicio } from '../../scripts/prerender.mjs';

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
  it('describe correctamente las portadas WebP', () => {
    const h: string = htmlDeGuia(plantilla, { ...guia,
      cover_url: 'https://x.supabase.co/guia.webp',
      cover_alt: 'Trabajadora entregando carta de renuncia',
    }, 'https://tuvozlaboral.com');
    expect(h).toContain('og:image:type" content="image/webp"');
    expect(h).toContain('og:image:alt" content="Trabajadora entregando carta de renuncia"');
    expect(h).not.toContain('og:image:width');
    expect(h).not.toContain('og:image:height');
  });
  it('usa la portada de la guía si tiene una', () => {
    const conPortada: string = htmlDeGuia(plantilla, { ...guia, cover_url: 'https://x.supabase.co/a.png' }, 'https://tuvozlaboral.com');
    expect(conPortada).toContain('<meta property="og:image" content="https://x.supabase.co/a.png" />');
    expect(conPortada).not.toContain('og:image:width');
    expect(conPortada).toContain('og:image:type" content="image/png"');
    expect(conPortada).toContain('og:image:alt" content="Reforma laboral:');
  });
});

describe('HTML inicial de calculadoras', () => {
  it('ofrece enlaces internos en la versión HTML inicial de páginas informativas', () => {
    const h: string = htmlDeCalculadora(plantilla, {
      path: '/herramientas',
      title: 'Herramientas laborales',
      description: 'Recursos para trabajadores.',
      links: [
        { path: '/herramientas/cartas/', title: 'Cartas y documentos' },
        { path: 'javascript:alert(1)', title: 'No permitido' },
      ],
    }, 'https://tuvozlaboral.com');
    expect(h).toContain('<link rel="canonical" href="https://tuvozlaboral.com/herramientas/" />');
    expect(h).toContain('<a href="/herramientas/cartas/">Cartas y documentos</a>');
    expect(h).not.toContain('href="javascript:');
  });

  it('genera la página índice de calculadoras con canonical y contenido propio', () => {
    const html: string = htmlDeCalculadora(plantilla, {
      path: '/calculadoras',
      title: 'Calculadoras laborales en Colombia',
      description: 'Herramientas de prima, cesantías y salario.',
    }, 'https://tuvozlaboral.com');
    expect(html).toContain('<link rel="canonical" href="https://tuvozlaboral.com/calculadoras/" />');
    expect(html).toContain('<h1>Calculadoras laborales en Colombia</h1>');
    expect(html).toContain('Herramientas de prima, cesantías y salario.');
  });
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

describe('Enlaces HTML iniciales de Inicio', () => {
  it('incluye navegación rastreable sin ejecutar React', () => {
    const html: string = htmlDeInicio(plantilla, [
      { path: '/derechos/salud-mental/', title: 'Salud mental y riesgo psicosocial' },
      { path: '/calculadoras/prima/', title: 'Calculadora de prima' },
    ], 'https://tuvozlaboral.com');
    expect(html).toContain('<a href="/derechos/salud-mental/">Salud mental y riesgo psicosocial</a>');
    expect(html).toContain('<a href="/calculadoras/prima/">Calculadora de prima</a>');
    expect(html).toContain('<link rel="canonical" href="https://tuvozlaboral.com/" />');
    expect(html).toContain('<div id="root"><main');
  });
  it('escapa etiquetas y rechaza rutas externas o peligrosas', () => {
    const html: string = htmlDeInicio(plantilla, [
      { path: '/derechos/ejemplo/', title: '<script>Malicioso</script>' },
      { path: 'javascript:alert(1)', title: 'Peligro' },
      { path: '//example.org/other', title: 'Externo' },
    ], 'https://tuvozlaboral.com');
    expect(html).toContain('&lt;script>Malicioso&lt;/script>');
    expect(html).not.toContain('<script>Malicioso</script>');
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toContain('href="//example.org/');
  });
});
