/**
 * Guías destacadas («Empieza por estas» en /derechos y bloque de la portada).
 * Solo se muestran las que están publicadas, en este orden. El foco es el
 * trabajo en general —reformas, formas de trabajar, dignidad, defensa—, no
 * solo pagos.
 */
export const GUIAS_PRIORITARIAS = [
  // Reformas y nuevas formas de trabajar (partes 5 y 6)
  'reforma-laboral-ley-2466-que-cambio',
  'reforma-pensional-que-cambia',
  'teletrabajo-trabajo-remoto-y-desconexion',
  'plataformas-digitales-de-reparto',
  'sindicatos-asociacion-y-huelga',
  'contrato-de-aprendizaje-sena',
  'prestacion-de-servicios-vs-contrato-laboral',
  // Ya publicadas
  'jornada-horas-extra-y-recargos',
  'tipos-de-contrato-y-periodo-de-prueba',
  'acoso-laboral-que-es-y-donde-acudir',
  'a-donde-acudir-ministerio-y-derecho-de-peticion',
  'accidente-de-trabajo-y-enfermedad-laboral',
  'estabilidad-laboral-reforzada',
  'descanso-dominical-y-festivos',
  'despido-con-y-sin-justa-causa',
  'liquidacion-al-terminar-el-contrato',
] as const;

/** Ordena guías publicadas: primero las prioritarias, luego el resto por título. */
export function ordenarPorPrioridad<T extends { slug: string }>(guias: T[]): T[] {
  const rank = (slug: string) => {
    const i = (GUIAS_PRIORITARIAS as readonly string[]).indexOf(slug);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...guias].sort((a, b) => rank(a.slug) - rank(b.slug));
}

/**
 * Temas por CREAR (aún no hay guía). Calendario: una cada 7–10 días.
 * Ya redactadas: reforma laboral, teletrabajo, plataformas, aprendices y
 * sindicatos (parte 5, corregidas en la parte 6) y reforma pensional (parte 6).
 * Las licencias nuevas de la reforma ya están en la guía de licencias remuneradas.
 */
export const GUIAS_A_CREAR: { titulo: string; slugSugerido: string; eje: string }[] = [
  { titulo: 'Salud mental en el trabajo y riesgo psicosocial', slugSugerido: 'salud-mental-y-riesgo-psicosocial', eje: 'Salud, seguridad y licencias' },
  { titulo: 'Inclusión laboral y cuota de personas con discapacidad', slugSugerido: 'inclusion-laboral-discapacidad', eje: 'Igualdad, dignidad y acoso' },
  { titulo: 'Trabajo doméstico: derechos y deberes', slugSugerido: 'trabajo-domestico-derechos', eje: 'Contrato y formas de trabajar' },
  { titulo: 'Trabajadores migrantes en Colombia: derechos laborales', slugSugerido: 'trabajadores-migrantes-derechos', eje: 'Igualdad, dignidad y acoso' },
  { titulo: 'Inspección de trabajo: qué puede hacer y cómo pedirla', slugSugerido: 'inspeccion-de-trabajo', eje: 'A dónde acudir' },
  { titulo: 'Calendario laboral del año: fechas de pago y cambios', slugSugerido: 'calendario-laboral-del-ano', eje: 'Reformas y novedades' },
  { titulo: 'Trabajo en el campo: jornal y contrato agropecuario', slugSugerido: 'trabajo-agropecuario', eje: 'Contrato y formas de trabajar' },
];

/** Calculadora → guías relacionadas (slug de /derechos/…). */
export const GUIAS_POR_CALCULADORA: Record<string, { slug: string; label: string }[]> = {
  '/calculadoras/operativos': [
    { slug: 'jornada-horas-extra-y-recargos', label: 'Jornada, horas extra y recargos' },
    { slug: 'descanso-dominical-y-festivos', label: 'Descanso dominical y festivos' },
  ],
  '/calculadoras/vigilantes': [
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
    { slug: 'prestacion-de-servicios-vs-contrato-laboral', label: 'Prestación de servicios o contrato laboral' },
    { slug: 'cuando-existe-contrato-de-trabajo', label: 'Cuándo existe un contrato de trabajo' },
    { slug: 'seguridad-social-eps-pension-arl-y-caja', label: 'Seguridad social' },
  ],
  '/liquidacion': [
    { slug: 'liquidacion-al-terminar-el-contrato', label: 'La liquidación al terminar el contrato' },
    { slug: 'despido-con-y-sin-justa-causa', label: 'Despido con y sin justa causa' },
    { slug: 'renuncia-y-preaviso', label: 'Renunciar y preaviso' },
  ],
};
