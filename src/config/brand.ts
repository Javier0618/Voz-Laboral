// Identidad de la plataforma. Cambia aquí el nombre y los textos de marca;
// los colores están en src/index.css (:root).
// El nombre es provisional: la disponibilidad de dominio y marca se comprueba por separado.
export const brand = {
  name: 'TuVozLaboral',
  tagline: 'Guías laborales claras para trabajadores en Colombia: derechos, reformas y cambios en el trabajo, con experiencias reales y calculadoras',
  country: 'Colombia',
  /** Dominio público. Se usa para la dirección canónica, las vistas previas al compartir y el sitemap. */
  siteUrl: ((import.meta.env.VITE_SITE_URL as string | undefined) || 'https://tuvozlaboral.com').replace(/\/$/, ''),
  domain: 'tuvozlaboral.com',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL ?? '',
} as const;
