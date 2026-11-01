/**
 * Taxonomía editorial de las guías (Fase 2.2).
 *
 * Las guías hablan del trabajo en general (reformas, formas de trabajar,
 * dignidad, derechos colectivos…), no solo de pagos. Estos temas ordenan el
 * índice /derechos; son independientes de las categorías de experiencias,
 * que se siguen usando para enlazar cada guía con sus relatos.
 *
 * Para clasificar una guía nueva: añade su slug en GUIA_TEMA. Si no lo haces,
 * se deduce de su categoría (o del título, si habla de una reforma).
 */

export type TemaGuia = { slug: string; name: string; description: string };

export const TEMAS_GUIAS: TemaGuia[] = [
  {
    slug: 'reformas',
    name: 'Reformas y novedades',
    description: 'Qué cambió en la ley laboral, desde cuándo aplica y qué falta por entrar en vigor.',
  },
  {
    slug: 'formas-de-trabajar',
    name: 'Contrato y formas de trabajar',
    description: 'Tipos de contrato, teletrabajo, plataformas, aprendices y lo que te pueden exigir.',
  },
  {
    slug: 'jornada',
    name: 'Jornada y descanso',
    description: 'Horario máximo, trabajo nocturno, horas extra, domingos, festivos y vacaciones.',
  },
  {
    slug: 'salud',
    name: 'Salud, seguridad y licencias',
    description: 'Seguridad social, riesgos laborales, incapacidades y licencias.',
  },
  {
    slug: 'dignidad',
    name: 'Igualdad, dignidad y acoso',
    description: 'Discriminación, acoso laboral y sexual, e igualdad de trato y de salario.',
  },
  {
    slug: 'colectivos',
    name: 'Sindicatos y derechos colectivos',
    description: 'Asociación sindical, negociación colectiva y huelga.',
  },
  {
    slug: 'salario',
    name: 'Salario y prestaciones',
    description: 'Salario mínimo, pagos, prima y cesantías.',
  },
  {
    slug: 'terminacion',
    name: 'Fin del contrato',
    description: 'Despido, renuncia, liquidación y estabilidad laboral reforzada.',
  },
  {
    slug: 'tramites',
    name: 'A dónde acudir',
    description: 'Derecho de petición, Ministerio del Trabajo e inspección.',
  },
];

export const TEMA_OTROS: TemaGuia = { slug: 'otros', name: 'Otros temas', description: '' };

const POR_SLUG = new Map([...TEMAS_GUIAS, TEMA_OTROS].map((t) => [t.slug, t]));

/** Clasificación explícita de cada guía (slug de la guía → tema). */
export const GUIA_TEMA: Record<string, string> = {
  'reforma-laboral-ley-2466-que-cambio': 'reformas',

  'cuando-existe-contrato-de-trabajo': 'formas-de-trabajar',
  'tipos-de-contrato-y-periodo-de-prueba': 'formas-de-trabajar',
  'limites-de-las-ordenes-del-empleador': 'formas-de-trabajar',
  'teletrabajo-trabajo-remoto-y-desconexion': 'formas-de-trabajar',
  'plataformas-digitales-de-reparto': 'formas-de-trabajar',
  'contrato-de-aprendizaje-sena': 'formas-de-trabajar',

  'jornada-horas-extra-y-recargos': 'jornada',
  'descanso-dominical-y-festivos': 'jornada',
  vacaciones: 'jornada',

  'seguridad-y-salud-en-el-trabajo': 'salud',
  'seguridad-social-eps-pension-arl-y-caja': 'salud',
  'accidente-de-trabajo-y-enfermedad-laboral': 'salud',
  'incapacidad-por-enfermedad': 'salud',
  'licencias-remuneradas': 'salud',
  'licencias-de-maternidad-y-paternidad': 'salud',

  'acoso-laboral-que-es-y-donde-acudir': 'dignidad',
  'acoso-sexual-en-el-trabajo': 'dignidad',
  'igualdad-y-no-discriminacion': 'dignidad',
  'igual-trabajo-igual-salario': 'dignidad',

  'sindicatos-asociacion-y-huelga': 'colectivos',

  'pago-del-salario': 'salario',
  'salario-minimo-auxilio-de-transporte-y-dotacion': 'salario',
  'prima-de-servicios': 'salario',
  'cesantias-e-intereses': 'salario',

  'liquidacion-al-terminar-el-contrato': 'terminacion',
  'despido-con-y-sin-justa-causa': 'terminacion',
  'renuncia-y-preaviso': 'terminacion',
  'estabilidad-laboral-reforzada': 'terminacion',

  'a-donde-acudir-ministerio-y-derecho-de-peticion': 'tramites',
};

/** Si la guía no está en GUIA_TEMA, se deduce de su categoría de experiencias. */
const TEMA_POR_CATEGORIA: Record<string, string> = {
  'pago-salarios': 'salario',
  'ascensos-ajustes': 'salario',
  'contrato-condiciones': 'formas-de-trabajar',
  'organizacion-administracion': 'formas-de-trabajar',
  'jornadas-descansos': 'jornada',
  'seguridad-salud': 'salud',
  'abuso-autoridad': 'dignidad',
  'posible-acoso-laboral': 'dignidad',
  discriminacion: 'dignidad',
};

const PALABRAS_REFORMA = /(reforma|ley 2466|novedad|nueva ley|qué cambió)/i;

export function temaDeGuia(guia: { slug: string; title?: string; category_slug: string | null }): TemaGuia {
  const explicito = GUIA_TEMA[guia.slug];
  if (explicito) return POR_SLUG.get(explicito) ?? TEMA_OTROS;
  if (guia.title && PALABRAS_REFORMA.test(guia.title)) return POR_SLUG.get('reformas')!;
  const porCategoria = guia.category_slug ? TEMA_POR_CATEGORIA[guia.category_slug] : undefined;
  return (porCategoria && POR_SLUG.get(porCategoria)) || TEMA_OTROS;
}

/**
 * Resuelve el parámetro ?tema= de la URL. Acepta los temas editoriales y,
 * para no romper enlaces antiguos, también las categorías de experiencias.
 */
export function resolverTema(param: string): TemaGuia | null {
  if (!param) return null;
  const directo = POR_SLUG.get(param);
  if (directo) return directo;
  const porCategoria = TEMA_POR_CATEGORIA[param];
  return porCategoria ? POR_SLUG.get(porCategoria) ?? null : null;
}

export function ordenTema(slug: string): number {
  const i = TEMAS_GUIAS.findIndex((t) => t.slug === slug);
  return i === -1 ? TEMAS_GUIAS.length : i;
}
