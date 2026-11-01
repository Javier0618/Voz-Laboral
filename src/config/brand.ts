// Identidad de la plataforma. Cambia aquí el nombre y los textos de marca;
// los colores están en src/index.css (:root).
// El nombre es provisional: la disponibilidad de dominio y marca se comprueba por separado.
export const brand = {
  name: 'VozLaboral',
  tagline: 'Guías laborales claras para trabajadores en Colombia: derechos, reformas y cambios en el trabajo, con experiencias reales y calculadoras',
  country: 'Colombia',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL ?? '',
} as const;
