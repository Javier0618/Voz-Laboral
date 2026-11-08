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


/** Convierte el Markdown público a HTML semántico, sin insertar HTML sin escapar. */
function inlineHtml(value) {
  const input = String(value ?? '');
  const token = /(!?\[([^\]]*)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*)/g;
  let html = '';
  let start = 0;
  for (const match of input.matchAll(token)) {
    html += text(input.slice(start, match.index));
    if (match[4] !== undefined) {
      html += '<strong>' + text(match[4]) + '</strong>';
    } else {
      const href = match[3];
      // Solo URLs internas y enlaces web; nunca javascript:, data: u otros esquemas.
      if (/^(\/(?!\/)|https?:\/\/)/i.test(href)) {
        const label = text(match[2]);
        html += match[1].startsWith('!')
          ? '<img src="' + attr(href) + '" alt="' + attr(match[2]) + '" loading="lazy">'
          : '<a href="' + attr(href) + '">' + label + '</a>';
      } else {
        html += text(match[0]);
      }
    }
    start = match.index + match[0].length;
  }
  return html + text(input.slice(start));
}

function renderContent(markdown) {
  const html = [];
  let list = null;
  let paragraph = [];
  const endParagraph = () => {
    if (paragraph.length) html.push('<p>' + inlineHtml(paragraph.join(' ')) + '</p>');
    paragraph = [];
  };
  const endList = () => {
    if (list) html.push('</' + list + '>');
    list = null;
  };
  for (const raw of String(markdown ?? '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { endParagraph(); endList(); continue; }
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      endParagraph(); endList();
      const tag = heading[1].length === 2 ? 'h2' : 'h3';
      html.push('<' + tag + '>' + inlineHtml(heading[2]) + '</' + tag + '>');
      continue;
    }
    const image = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(line);
    if (image) {
      endParagraph(); endList();
      html.push('<figure>' + inlineHtml(line) + '</figure>');
      continue;
    }
    const item = /^([-*]|\d+\.)\s+(.+)$/.exec(line);
    if (item) {
      endParagraph();
      const tag = /^\d/.test(item[1]) ? 'ol' : 'ul';
      if (list !== tag) { endList(); html.push('<' + tag + '>'); list = tag; }
      html.push('<li>' + inlineHtml(item[2]) + '</li>');
      continue;
    }
    if (line.startsWith('> ')) {
      endParagraph(); endList();
      html.push('<blockquote><p>' + inlineHtml(line.slice(2)) + '</p></blockquote>');
      continue;
    }
    endList();
    paragraph.push(line);
  }
  endParagraph(); endList();
  return html.join('\n');
}

function initialArticle(g) {
  return '<main class="page py-10"><article class="mx-auto max-w-prose">'
    + '<h1>' + text(g.title) + '</h1>'
    + '<p>' + text(g.summary) + '</p>'
    + renderContent(g.content)
    + '</article></main>';
}

/**
 * @param {string} template HTML de dist/index.html
 * @param {{slug:string,title:string,summary:string,content?:string,cover_url?:string|null,cover_alt?:string|null,updated_at?:string,last_verified_at?:string|null}} g
 * @param {string} site p. ej. https://tuvozlaboral.com
 */
export function htmlDeGuia(template, g, site) {
  const url = `${site}/derechos/${g.slug}/`;
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
    // Eliminar los metadatos de la portada genérica.
    html = html.replace(/\s*<meta property="og:image:(width|height|type|alt)"[^>]*>/g, '');
    const pathname = new URL(g.cover_url, site).pathname.toLowerCase();
    const mime = pathname.endsWith('.webp') ? 'image/webp'
      : pathname.endsWith('.png') ? 'image/png'
      : /\.jpe?g$/.test(pathname) ? 'image/jpeg' : null;
    if (mime) html = setMeta(html, 'og:image:type', 'property', mime);
    html = setMeta(html, 'og:image:alt', 'property', g.cover_alt?.trim() || g.title);
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
  html = html.replace('</head>', extra);
  // Incluye el artículo en el HTML inicial. React sustituye este contenido al
  // montar la aplicación; los buscadores que no ejecutan JS pueden leerlo.
  return html.replace('<div id="root"></div>', '<div id="root">' + initialArticle(g) + '</div>');
}


/** HTML inicial específico de las calculadoras para buscadores sin JavaScript. */
export function htmlDeCalculadora(template, info, site) {
  // Las calculadoras pregeneradas son directorios con index.html.
  const url = site + info.path + '/';
  const titulo = info.title + ' · ' + MARCA;
  let html = template.replace(/<title>[^<]*<\/title>/, '<title>' + text(titulo) + '</title>');
  html = setMeta(html, 'description', 'name', info.description);
  html = setMeta(html, 'og:title', 'property', titulo);
  html = setMeta(html, 'og:description', 'property', info.description);
  html = setMeta(html, 'og:url', 'property', url);
  html = setMeta(html, 'twitter:title', 'name', titulo);
  html = setMeta(html, 'twitter:description', 'name', info.description);
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: info.title,
    description: info.description,
    url,
    inLanguage: 'es-CO',
  };
  html = html.replace('</head>',
    '    <link rel="canonical" href="' + attr(url) + '" />\n'
    + '    <script type="application/ld+json" id="vl-jsonld">'
    + JSON.stringify(structured).replace(/</g, '\\u003c') + '</script>\n  </head>');
  // React reemplaza este contenido al iniciarse; sin JS se conservan el
  // encabezado y enlaces internos reales de las secciones informativas.
  const links = Array.isArray(info.links) ? info.links.filter((link) =>
    /^\/(?!\/)[a-zA-Z0-9/_-]+\/?$/.test(link.path)) : [];
  const nav = links.length ? '<nav aria-label="Más contenidos"><h2>Explorar contenidos relacionados</h2><ul>'
    + links.map((link) => '<li><a href="' + attr(link.path) + '">'
      + text(link.title) + '</a></li>').join('') + '</ul></nav>' : '';
  return html.replace('<div id="root"></div>',
    '<div id="root"><main class="page py-10"><h1>'
    + text(info.title) + '</h1><p>' + text(info.description) + '</p>'
    + nav + '</main></div>');
}


/**
 * Índice navegable del contenido público disponible incluso sin JavaScript.
 * React sustituye este HTML al iniciar la aplicación, sin duplicar páginas.
 * Solo acepta rutas internas absolutas de la propia web.
 */
export function htmlDeInicio(template, links, site) {
  const valid = links.filter((item) => item.path !== '/'
    && /^\/[a-zA-Z0-9/_-]+\/?$/.test(item.path));
  const guideLinks = valid.filter((item) => item.path.startsWith('/derechos/') && item.path !== '/derechos/');
  const otherLinks = valid.filter((item) => !guideLinks.includes(item));
  const makeList = (items) => '<ul>' + items.map((item) =>
    '<li><a href="' + attr(item.path) + '">' + text(item.title) + '</a></li>'
  ).join('\n') + '</ul>';
  const content = '<main class="page py-10"><h1>TuVozLaboral: guías laborales en Colombia</h1>'
    + '<p>Consulta derechos laborales, calculadoras y herramientas para trabajadores.</p>'
    + '<nav aria-label="Secciones y herramientas"><h2>Secciones y herramientas</h2>'
    + makeList(otherLinks) + '</nav>'
    + '<nav aria-label="Guías laborales"><h2>Guías laborales</h2>'
    + makeList(guideLinks) + '</nav></main>';
  const canonical = site.replace(/\/$/, '') + '/';
  return template.replace('</head>', '    <link rel="canonical" href="' + attr(canonical) + '" />\n  </head>')
    .replace('<div id="root"></div>', '<div id="root">' + content + '</div>');
}
