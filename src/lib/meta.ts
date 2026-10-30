import { brand } from '../config/brand';

// Título, descripción y etiquetas sociales de la página activa.
// Ayuda a buscadores que ejecutan JavaScript. WhatsApp, LinkedIn y similares
// leen el HTML inicial de index.html; para previews por ruta hace falta
// prerender o middleware en el hosting.

const DEFAULT_DESCRIPTION =
  'Experiencias laborales buenas, malas y mixtas en empresas de Colombia, contadas con un alias.';

const DEFAULT_TITLE = `${brand.name}: cómo es trabajar ahí, contado por quienes trabajan ahí`;

export type PageMeta = {
  title: string;
  description: string;
  /** URL absoluta o relativa al origen actual */
  image?: string | null;
  /** Ruta o URL canónica (p. ej. /derechos/slug) */
  path?: string | null;
  /** website | article */
  type?: 'website' | 'article';
  /** JSON-LD serializable; null lo elimina */
  jsonLd?: Record<string, unknown> | null;
};

function absoluteUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (!origin) return pathOrUrl;
  return pathOrUrl.startsWith('/') ? `${origin}${pathOrUrl}` : `${origin}/${pathOrUrl}`;
}

function setMetaByName(name: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setMetaByProperty(property: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setCanonical(href: string | undefined) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
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

function setJsonLd(data: Record<string, unknown> | null | undefined) {
  const id = 'vozlaboral-jsonld';
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!data) {
    script?.remove();
    return;
  }
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

/** Actualiza título, description, Open Graph, Twitter y opcionalmente JSON-LD. */
export function setPageMeta(meta: PageMeta | null) {
  const title = meta?.title ?? brand.name;
  const description = meta?.description ?? DEFAULT_DESCRIPTION;
  const type = meta?.type ?? 'website';
  const url = absoluteUrl(meta?.path ?? (typeof window !== 'undefined' ? window.location.pathname : undefined));
  const image = absoluteUrl(meta?.image ?? undefined);

  document.title = title;
  setMetaByName('description', description);

  setMetaByProperty('og:type', type);
  setMetaByProperty('og:site_name', brand.name);
  setMetaByProperty('og:title', title);
  setMetaByProperty('og:description', description);
  setMetaByProperty('og:locale', 'es_CO');
  if (url) setMetaByProperty('og:url', url);
  if (image) {
    setMetaByProperty('og:image', image);
    setMetaByName('twitter:image', image);
  }

  setMetaByName('twitter:card', image ? 'summary_large_image' : 'summary');
  setMetaByName('twitter:title', title);
  setMetaByName('twitter:description', description);

  setCanonical(url);
  setJsonLd(meta?.jsonLd ?? null);
}

export function defaultHomeMeta(): PageMeta {
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: '/',
    type: 'website',
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
