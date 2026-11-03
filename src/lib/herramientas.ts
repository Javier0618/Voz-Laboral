/** Catálogo de herramientas: lo usan el índice, la portada y el mapa del sitio. */
export type Herramienta = { path: string; title: string; description: string };

export const HERRAMIENTAS: Herramienta[] = [
  {
    path: '/herramientas/cartas',
    title: 'Cartas y documentos',
    description: 'Arma en minutos un derecho de petición, tu carta de renuncia o una solicitud de vacaciones, con la norma citada. Lista para imprimir.',
  },
  {
    path: '/herramientas/diagnostico',
    title: '¿Me están pagando bien?',
    description: 'Diez preguntas de sí o no para revisar tu salario, tus prestaciones y tu seguridad social, con lo que puedes hacer en cada caso.',
  },
  {
    path: '/herramientas/quiz',
    title: '¿Mito o realidad?',
    description: 'Pon a prueba lo que sabes de tus derechos laborales en 2 minutos y reta a tus compañeros por WhatsApp.',
  },
  {
    path: '/herramientas/calendario',
    title: 'Calendario laboral',
    description: 'Las fechas de pago de prima, cesantías y dotación, los festivos y los cambios de la ley. Agrégalas a tu celular para que te avise.',
  },
  {
    path: '/herramientas/glosario',
    title: 'Glosario laboral',
    description: 'Qué significan cesantías, IBL, preaviso, recargo y otras palabras que aparecen en tu contrato y tu desprendible.',
  },
];
