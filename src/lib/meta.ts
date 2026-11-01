import { brand } from '../config/brand';

// Título, descripción y etiquetas sociales de la página activa.
// Ayuda a buscadores que ejecutan JavaScript. WhatsApp, LinkedIn y similares
// leen el HTML inicial de index.html; para previews por ruta hace falta
// prerender o middleware en el hosting.

const DEFAULT_DESCRIPTION =
  'Guías sobre derechos laborales y reformas en Colombia, experiencias de trabajadores contadas con alias y calculadoras de nómina. Información clara, orientativa.';

const DEFAULT_TITLE = `${brand.name}: derechos laborales, experiencias y calculadoras en Colombia`;

/** Portada social por defecto (public/). Preferible WebP/PNG 1200×628 en producción. */
export const DEFAULT_OG_IMAGE = '/og-default.svg';

export type PageMeta = {
  title: string;
  description: string;
  /** URL absoluta o relativa al origen actual */
  image?: string | null;
  /** Ruta o URL canónica (p. ej. /derechos/slug) */
  path?: string | null;
  /** website | article */
  type?: 'website' | 'article';
  /** JSON-LD: un objeto o @graph (p. ej. Article + BreadcrumbList) */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
};

function absoluteUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (!origin) return pathOrUrl;
  return pathOrUrl.startsWith('/') ? `${origin}${pathOrUrl}` : `${origin}/${pathOrUrl}`;
}

function setMetaByName(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaByProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string | undefined) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!href) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

function setJsonLd(data: PageMeta['jsonLd']) {
  const id = 'vl-jsonld';
  document.getElementById(id)?.remove();
  if (!data) return;
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function setPageMeta(meta: PageMeta | null) {
  if (!meta) {
    document.title = DEFAULT_TITLE;
    setMetaByName('description', DEFAULT_DESCRIPTION);
    setMetaByProperty('og:title', DEFAULT_TITLE);
    setMetaByProperty('og:description', DEFAULT_DESCRIPTION);
    setMetaByProperty('og:type', 'website');
    setMetaByName('twitter:title', DEFAULT_TITLE);
    setMetaByName('twitter:description', DEFAULT_DESCRIPTION);
    setCanonical(undefined);
    setJsonLd(null);
    return;
  }
  document.title = meta.title;
  setMetaByName('description', meta.description);
  setMetaByProperty('og:title', meta.title);
  setMetaByProperty('og:description', meta.description);
  setMetaByProperty('og:type', meta.type ?? 'website');
  if (meta.image) setMetaByProperty('og:image', absoluteUrl(meta.image) ?? meta.image);
  setMetaByName('twitter:title', meta.title);
  setMetaByName('twitter:description', meta.description);
  if (meta.image) setMetaByName('twitter:image', absoluteUrl(meta.image) ?? meta.image);
  if (meta.path) setCanonical(absoluteUrl(meta.path));
  setJsonLd(meta.jsonLd ?? null);
}

export function defaultHomeMeta(): PageMeta {
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: '/',
    type: 'website',
    image: DEFAULT_OG_IMAGE,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: brand.name,
      description: DEFAULT_DESCRIPTION,
      url: typeof window !== 'undefined' ? window.location.origin : undefined,
      inLanguage: 'es-CO',
      publisher: {
        '@type': 'Organization',
        name: brand.name,
      },
    },
  };
}
