import { brand } from '../config/brand';

// Título, descripción y etiquetas sociales de la página activa.
// Ayuda a buscadores que ejecutan JavaScript. WhatsApp, LinkedIn y similares
// leen el HTML inicial de index.html; para previews por ruta hace falta
// prerender o middleware en el hosting.

const DEFAULT_DESCRIPTION =
  'Guías claras sobre derechos laborales, reformas y cambios en el trabajo en Colombia, con fuentes oficiales. Además, experiencias de trabajadores y calculadoras de nómina.';

const DEFAULT_TITLE = `${brand.name}: guías laborales para trabajadores en Colombia`;

/** Portada social por defecto (public/), PNG de 1200×630: WhatsApp y Facebook no aceptan SVG. */
export const DEFAULT_OG_IMAGE = '/og-default.png';

export type PageMeta = {
  title: string;
  description: string;
  /** URL absoluta o relativa al origen actual */
  image?: string | null;
  imageAlt?: string | null;
  /** Ruta o URL canónica (p. ej. /derechos/slug) */
  path?: string | null;
  /** website | article */
  type?: 'website' | 'article';
  /** Indicación para buscadores, p. ej. «noindex, follow» en páginas sin contenido propio. */
  robots?: string | null;
  /** JSON-LD: un objeto o @graph (p. ej. Article + BreadcrumbList) */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
};

function absoluteUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  // Siempre el dominio oficial: la dirección canónica y las vistas previas no
  // deben apuntar a www, a la IP del servidor ni a un entorno de pruebas.
  const origin = brand.siteUrl;
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

const DEFAULT_IMAGE_ALT = 'TuVozLaboral: guías laborales claras para trabajadores en Colombia.';

function setSocialImageDetails(url: string, alt?: string | null) {
  const pathname = new URL(url).pathname.toLowerCase();
  const mime = pathname.endsWith('.webp') ? 'image/webp'
    : pathname.endsWith('.png') ? 'image/png'
    : /\.jpe?g$/.test(pathname) ? 'image/jpeg' : null;
  const remove = (name: string) => document.querySelector('meta[property="' + name + '"]')?.remove();
  if (mime) setMetaByProperty('og:image:type', mime);
  else remove('og:image:type');
  setMetaByProperty('og:image:alt', alt?.trim() || DEFAULT_IMAGE_ALT);
  if (pathname.endsWith('/og-default.png')) {
    setMetaByProperty('og:image:width', '1200');
    setMetaByProperty('og:image:height', '630');
  } else {
    remove('og:image:width');
    remove('og:image:height');
  }
}

function setRobots(value: string | null | undefined) {
  const el = document.querySelector('meta[name="robots"]');
  if (!value) {
    el?.remove();
    return;
  }
  setMetaByName('robots', value);
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
  // Google exige @context. Varios objetos van en un @graph con un solo @context.
  const json = Array.isArray(data)
    ? { '@context': 'https://schema.org', '@graph': data.map(({ ['@context']: _c, ...rest }) => rest) }
    : { '@context': 'https://schema.org', ...data };
  script.textContent = JSON.stringify(json);
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
    setMetaByProperty('og:image', absoluteUrl(DEFAULT_OG_IMAGE)!);
    setMetaByName('twitter:image', absoluteUrl(DEFAULT_OG_IMAGE)!);
    setSocialImageDetails(absoluteUrl(DEFAULT_OG_IMAGE)!);
    setMetaByProperty('og:url', absoluteUrl('/')!);
    setCanonical(undefined);
    setRobots(null);
    setJsonLd(null);
    return;
  }
  document.title = meta.title;
  setMetaByName('description', meta.description);
  setMetaByProperty('og:title', meta.title);
  setMetaByProperty('og:description', meta.description);
  setMetaByProperty('og:type', meta.type ?? 'website');
  // Sin imagen propia se usa la de por defecto: así no queda la de la página anterior.
  const image = absoluteUrl(meta.image || DEFAULT_OG_IMAGE)!;
  setMetaByProperty('og:image', image);
  setSocialImageDetails(image, meta.imageAlt);
  setMetaByName('twitter:title', meta.title);
  setMetaByName('twitter:description', meta.description);
  setMetaByName('twitter:image', image);
  if (meta.path) {
    setCanonical(absoluteUrl(meta.path));
    setMetaByProperty('og:url', absoluteUrl(meta.path)!);
  }
  setRobots(meta.robots);
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
      url: brand.siteUrl,
      inLanguage: 'es-CO',
      publisher: {
        '@type': 'Organization',
        name: brand.name,
      },
    },
  };
}

/** Rutas privadas o personales: nunca se indexan. */
const RUTAS_PRIVADAS = /^\/(cuenta|moderacion|seguimiento|avisos)(\/|$)/;

/**
 * Valores por defecto al cambiar de ruta: la dirección canónica y og:url son
 * los de la propia página (nunca la portada), y las rutas privadas llevan
 * «noindex». Cada página puede sobrescribirlos después con setPageMeta.
 */
export function setRouteDefaults(pathname: string) {
  const path = pathname.replace(/^\/seguimiento\/[^/]+/, '/seguimiento');
  // El servidor publica cada guía como /derechos/slug/ (directorio con index.html).
  const canonicalPath = /^\/derechos\/[^/]+\/?$/.test(path) ? `${path.replace(/\/$/, '')}/` : path;
  const url = absoluteUrl(canonicalPath || '/')!;
  setCanonical(url);
  setMetaByProperty('og:url', url);
  setRobots(RUTAS_PRIVADAS.test(pathname) ? 'noindex, nofollow' : null);
}
