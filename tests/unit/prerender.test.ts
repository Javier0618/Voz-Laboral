import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sin tipos
import { htmlDeGuia } from '../../scripts/prerender.mjs';

const plantilla = readFileSync('index.html', 'utf8');
const guia = { slug: 'reforma-laboral', title: 'Reforma laboral: "qué" cambió & <más>', summary: 'Resumen de la guía.', cover_url: null, updated_at: '2026-11-01T00:00:00Z', last_verified_at: '2026-11-01' };

describe('HTML inicial de cada guía', () => {
  const html: string = htmlDeGuia(plantilla, guia, 'https://tuvozlaboral.com');
  it('pone el título, la descripción y las etiquetas para redes de la guía', () => {
    expect(html).toContain('<title>Reforma laboral: "qué" cambió &amp; &lt;más> · TuVozLaboral</title>');
    expect(html).toContain('<meta name="description" content="Resumen de la guía." />');
    expect(html).toContain('<meta property="og:title" content="Reforma laboral: &quot;qué&quot; cambió &amp; &lt;más> · TuVozLaboral" />');
    expect(html).toContain('<meta property="og:type" content="article" />');
    expect(html).toContain('<meta property="og:url" content="https://tuvozlaboral.com/derechos/reforma-laboral" />');
    expect(html).toContain('<link rel="canonical" href="https://tuvozlaboral.com/derechos/reforma-laboral" />');
    expect(html).toContain('"@type":"Article"');
    expect(html).not.toContain('"datePublished"');
    expect(html).toContain('"dateModified":"2026-11-01T00:00:00Z"');
    expect(html).not.toContain('content="TuVozLaboral: guías laborales para trabajadores en Colombia"');
  });
  it('mantiene la web intacta: el mismo contenedor y los mismos scripts', () => {
    expect(html).toContain('<div id="root"></div>');
    expect(html.match(/<script/g)?.length).toBe((plantilla.match(/<script/g)?.length ?? 0) + 1);
  });
  it('usa la portada de la guía si tiene una', () => {
    const conPortada: string = htmlDeGuia(plantilla, { ...guia, cover_url: 'https://x.supabase.co/a.png' }, 'https://tuvozlaboral.com');
    expect(conPortada).toContain('<meta property="og:image" content="https://x.supabase.co/a.png" />');
    expect(conPortada).not.toContain('og:image:width');
  });
});
