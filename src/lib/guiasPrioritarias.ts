/** Guías prioritarias (calendario editorial). Incluye temas existentes y huecos a crear. */
export const GUIAS_PRIORITARIAS = [
  // Ya publicadas — reforzar cuando toque
  'a-donde-acudir-ministerio-y-derecho-de-peticion',
  'accidente-de-trabajo-y-enfermedad-laboral',
  'acoso-laboral-que-es-y-donde-acudir',
  'tipos-de-contrato-y-periodo-de-prueba',
  'jornada-horas-extra-y-recargos',
  'descanso-dominical-y-festivos',
  // Prestaciones y fin de contrato (útiles, no el único foco)
  'liquidacion-al-terminar-el-contrato',
  'despido-con-y-sin-justa-causa',
  'prima-de-servicios',
  'incapacidad-por-enfermedad',
] as const;

/**
 * Temas prioritarios a CREAR (aún no hay slug en la base).
 * Reformas, sistema laboral y vida en el trabajo — no solo salario.
 */
export const GUIAS_A_CREAR: { titulo: string; slugSugerido: string; eje: string }[] = [
  {
    titulo: 'Qué cambió con la reforma laboral reciente',
    slugSugerido: 'reforma-laboral-que-cambio',
    eje: 'Reformas y novedades',
  },
  {
    titulo: 'Jornada laboral de 42 horas: cómo se aplica',
    slugSugerido: 'jornada-42-horas-como-se-aplica',
    eje: 'Reformas y novedades',
  },
  {
    titulo: 'Teletrabajo, trabajo remoto e híbrido',
    slugSugerido: 'teletrabajo-remoto-hibrido',
    eje: 'Formas de trabajar',
  },
  {
    titulo: 'Contrato de prestación de servicios vs. contrato laboral',
    slugSugerido: 'ops-vs-contrato-laboral',
    eje: 'Contrato y vínculo',
  },
  {
    titulo: 'Sindicatos, derecho de asociación y huelga',
    slugSugerido: 'sindicatos-asociacion-y-huelga',
    eje: 'Derechos colectivos',
  },
  {
    titulo: 'Discriminación y acoso: qué dice la ley y dónde denunciar',
    slugSugerido: 'discriminacion-en-el-trabajo',
    eje: 'Igualdad y dignidad',
  },
  {
    titulo: 'Salud mental en el trabajo y factores de riesgo psicosocial',
    slugSugerido: 'salud-mental-y-riesgo-psicosocial',
    eje: 'Salud y seguridad',
  },
  {
    titulo: 'Trabajo doméstico: derechos y deberes',
    slugSugerido: 'trabajo-domestico-derechos',
    eje: 'Sectores',
  },
  {
    titulo: 'Aprendices SENA y contratos de aprendizaje',
    slugSugerido: 'contrato-de-aprendizaje-sena',
    eje: 'Contrato y vínculo',
  },
  {
    titulo: 'Inspección de trabajo: qué puede hacer y cómo solicitarla',
    slugSugerido: 'inspeccion-de-trabajo',
    eje: 'Trámites y defensa',
  },
];

/** Calculadora → guías relacionadas (slug de /derechos/…). */
export const GUIAS_POR_CALCULADORA: Record<string, { slug: string; label: string }[]> = {
  '/calculadoras/turnos': [
    { slug: 'jornada-horas-extra-y-recargos', label: 'Jornada, horas extra y recargos' },
    { slug: 'descanso-dominical-y-festivos', label: 'Descanso dominical y festivos' },
  ],
  '/calculadoras/administrativos': [
    { slug: 'jornada-horas-extra-y-recargos', label: 'Jornada, horas extra y recargos' },
    { slug: 'descanso-dominical-y-festivos', label: 'Descanso dominical y festivos' },
  ],
  '/calculadoras/por-dias': [
    { slug: 'jornada-horas-extra-y-recargos', label: 'Jornada, horas extra y recargos' },
    { slug: 'pago-del-salario', label: 'Cuándo y cómo deben pagarte el salario' },
  ],
  '/calculadoras/prima': [
    { slug: 'prima-de-servicios', label: 'Prima de servicios' },
  ],
  '/calculadoras/cesantias': [
    { slug: 'cesantias-e-intereses', label: 'Cesantías e intereses' },
  ],
  '/calculadoras/salario-neto': [
    { slug: 'salario-minimo-auxilio-de-transporte-y-dotacion', label: 'Salario mínimo, auxilio y dotación' },
    { slug: 'pago-del-salario', label: 'Cuándo y cómo deben pagarte el salario' },
  ],
  '/calculadoras/prestacion-servicios': [
    { slug: 'cuando-existe-contrato-de-trabajo', label: 'Cuándo existe un contrato de trabajo' },
    { slug: 'seguridad-social-eps-pension-arl-y-caja', label: 'Seguridad social' },
  ],
  '/liquidacion': [
    { slug: 'liquidacion-al-terminar-el-contrato', label: 'La liquidación al terminar el contrato' },
    { slug: 'despido-con-y-sin-justa-causa', label: 'Despido con y sin justa causa' },
    { slug: 'renuncia-y-preaviso', label: 'Renunciar y preaviso' },
  ],
};
