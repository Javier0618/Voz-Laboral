import { brand } from '../config/brand';

// Título y descripción de la página activa. Ayuda a buscadores que ejecutan
// JavaScript; las vistas previas de WhatsApp y redes usan las etiquetas fijas
// de index.html hasta que el servidor genere las de cada página.
const DEFAULT_DESCRIPTION = 'Experiencias laborales buenas, malas y mixtas en empresas de Colombia, contadas con un alias.';

export function setPageMeta(meta: { title: string; description: string } | null) {
  document.title = meta?.title ?? brand.name;
  let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = 'description';
    document.head.appendChild(tag);
  }
  tag.content = meta?.description ?? DEFAULT_DESCRIPTION;
}
