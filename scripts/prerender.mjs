// Genera el HTML inicial de cada guía con su título, descripción, imagen y
// dirección propios. WhatsApp, Facebook, LinkedIn y algunos buscadores no
// ejecutan JavaScript: sin esto, al compartir una guía se ve la información
// genérica del sitio. La web se monta igual encima (el contenido lo pone React).

const MARCA = 'TuVozLaboral';

const attr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const text = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');

function setMeta(html, key, kind, value) {
  const re = new RegExp(`(<meta ${kind}="${key}" content=")[^"]*(")`);
  return re.test(html)
    ? html.replace(re, `$1${attr(value)}$2`)
    : html.replace('</head>', `    <meta ${kind}="${key}" content="${attr(value)}" />\n  </head>`);
}

/**
 * @param {string} template HTML de dist/index.html
 * @param {{slug:string,title:string,summary:string,cover_url?:string|null,updated_at?:string,last_verified_at?:string|null}} g
 * @param {string} site p. ej. https://tuvozlaboral.com
 */
export function htmlDeGuia(template, g, site) {
  const url = `${site}/derechos/${g.slug}`;
  const titulo = `${g.title} · ${MARCA}`;
  const imagen = g.cover_url || `${site}/og-default.png`;
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${text(titulo)}</title>`);
  html = setMeta(html, 'description', 'name', g.summary);
  html = setMeta(html, 'og:type', 'property', 'article');
  html = setMeta(html, 'og:title', 'property', titulo);
  html = setMeta(html, 'og:description', 'property', g.summary);
  html = setMeta(html, 'og:url', 'property', url);
  html = setMeta(html, 'og:image', 'property', imagen);
  html = setMeta(html, 'twitter:title', 'name', titulo);
  html = setMeta(html, 'twitter:description', 'name', g.summary);
  html = setMeta(html, 'twitter:image', 'name', imagen);
  if (g.cover_url) {
    // Las dimensiones y el texto alternativo por defecto son de og-default.png.
    html = html.replace(/\s*<meta property="og:image:(width|height|type|alt)"[^>]*>/g, '');
  }
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: g.title,
        description: g.summary,
        inLanguage: 'es-CO',
        mainEntityOfPage: url,
        image: [imagen],
        // La fecha de verificación jurídica no es la de publicación.
        // Omitimos datePublished hasta contar con una fecha editorial fiable.
        ...(g.updated_at ? { dateModified: g.updated_at } : {}),
        author: { '@type': 'Organization', name: MARCA },
        publisher: { '@type': 'Organization', name: MARCA },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Guías', item: `${site}/derechos` },
          { '@type': 'ListItem', position: 2, name: g.title, item: url },
        ],
      },
    ],
  };
  const extra = `    <link rel="canonical" href="${attr(url)}" />\n    <script type="application/ld+json" id="vl-jsonld">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>\n  </head>`;
  return html.replace('</head>', extra);
}
