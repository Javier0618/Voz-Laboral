/** Guías prioritarias (Fase 3 / calendario editorial). Orden = impacto. */
export const GUIAS_PRIORITARIAS = [
  'descanso-dominical-y-festivos',
  'jornada-horas-extra-y-recargos',
  'liquidacion-al-terminar-el-contrato',
  'salario-minimo-auxilio-de-transporte-y-dotacion',
  'incapacidad-por-enfermedad',
  'a-donde-acudir-ministerio-y-derecho-de-peticion',
  'accidente-de-trabajo-y-enfermedad-laboral',
  'tipos-de-contrato-y-periodo-de-prueba',
  'prima-de-servicios',
  'cesantias-e-intereses',
] as const;

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
