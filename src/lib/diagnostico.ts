// «¿Me están pagando bien?»: diagnóstico rápido con preguntas de sí o no.
// No guarda respuestas. Cada punto lleva a la guía, la calculadora y la carta
// que sirven para resolverlo. Cifras de 2026 (Decretos 1469 y 1470 de 2025).

export type Respuesta = 'si' | 'no' | 'nose' | 'na';

export type PreguntaDiagnostico = {
  id: string;
  pregunta: string;
  ayuda?: string;
  /** Si «No aplica» es una opción válida. */
  puedeNoAplicar?: boolean;
  siNo: string;
  enlaces: { to: string; label: string }[];
};

export const DIAGNOSTICO: PreguntaDiagnostico[] = [
  {
    id: 'afiliacion',
    pregunta: '¿Estás afiliado a EPS, pensión y ARL por cuenta de tu empleador?',
    ayuda: 'Puedes comprobarlo en la página de tu EPS, tu fondo de pensiones y tu ARL con tu número de documento.',
    siNo: 'El empleador debe afiliarte desde el primer día. Sin ARL, un accidente de trabajo queda sin cobertura.',
    enlaces: [{ to: '/derechos/seguridad-social-eps-pension-arl-y-caja', label: 'Seguridad social: EPS, pensión, ARL y caja' }],
  },
  {
    id: 'minimo',
    pregunta: '¿Ganas al menos el salario mínimo, $1.750.905 al mes, por una jornada completa?',
    siNo: 'Por jornada completa nadie puede ganar menos del salario mínimo. Si trabajas menos horas, se paga en proporción.',
    enlaces: [
      { to: '/derechos/salario-minimo-auxilio-de-transporte-y-dotacion', label: 'Salario mínimo y auxilio de transporte' },
      { to: '/herramientas/cartas/derecho-de-peticion', label: 'Carta para reclamar el pago' },
    ],
  },
  {
    id: 'transporte',
    pregunta: 'Si ganas hasta dos salarios mínimos, ¿te pagan el auxilio de transporte de $249.095?',
    puedeNoAplicar: true,
    siNo: 'Quien gana hasta dos salarios mínimos tiene derecho al auxilio de transporte, salvo casos especiales como el teletrabajo, que recibe un auxilio de conectividad.',
    enlaces: [{ to: '/derechos/salario-minimo-auxilio-de-transporte-y-dotacion', label: 'Salario mínimo y auxilio de transporte' }],
  },
  {
    id: 'prima',
    pregunta: '¿Te pagaron la prima de junio, completa o en proporción al tiempo trabajado?',
    puedeNoAplicar: true,
    ayuda: 'Responde «No aplica» si empezaste a trabajar después de junio.',
    siNo: 'La prima se paga a más tardar el 30 de junio y el 20 de diciembre. Si trabajaste parte del semestre, te toca en proporción.',
    enlaces: [
      { to: '/calculadoras/prima', label: 'Calculadora de prima' },
      { to: '/herramientas/cartas/derecho-de-peticion', label: 'Carta para reclamar la prima' },
    ],
  },
  {
    id: 'cesantias',
    pregunta: '¿Te consignaron las cesantías del año pasado en tu fondo antes del 14 de febrero?',
    puedeNoAplicar: true,
    ayuda: 'Puedes verlo en la aplicación o la página de tu fondo de cesantías.',
    siNo: 'Las cesantías deben quedar consignadas antes del 14 de febrero, y los intereses se pagan en enero.',
    enlaces: [
      { to: '/derechos/cesantias-e-intereses', label: 'Cesantías e intereses' },
      { to: '/herramientas/cartas/derecho-de-peticion', label: 'Carta para reclamar las cesantías' },
    ],
  },
  {
    id: 'recargos',
    pregunta: 'Si trabajas de noche, domingos, festivos u horas extra, ¿te pagan los recargos?',
    puedeNoAplicar: true,
    siNo: 'Las horas nocturnas, extra, dominicales y festivas tienen recargo. Desde julio de 2026, el dominical y festivo es del 90 %.',
    enlaces: [
      { to: '/derechos/descanso-dominical-y-festivos', label: 'Trabajar domingos y festivos' },
      { to: '/calculadoras/operativos', label: 'Calculadora de turnos' },
    ],
  },
  {
    id: 'jornada',
    pregunta: '¿Trabajas máximo 42 horas a la semana, o te pagan como extra lo que pasa de ahí?',
    siNo: 'La jornada máxima es de 42 horas semanales. Lo que pase de ahí son horas extra y tienen recargo.',
    enlaces: [{ to: '/derechos/jornada-horas-extra-y-recargos', label: 'Jornada máxima, horas extra y recargos' }],
  },
  {
    id: 'vacaciones',
    pregunta: '¿Te han dado vacaciones pagadas por cada año trabajado?',
    puedeNoAplicar: true,
    ayuda: 'Responde «No aplica» si llevas menos de un año.',
    siNo: 'Por cada año trabajado tienes 15 días hábiles de vacaciones pagadas. Se pueden acumular solo en casos limitados.',
    enlaces: [
      { to: '/derechos/vacaciones', label: 'Vacaciones' },
      { to: '/herramientas/cartas/solicitud-de-vacaciones', label: 'Carta para pedir vacaciones' },
    ],
  },
  {
    id: 'descuentos',
    pregunta: '¿Entiendes todos los descuentos de tu desprendible y los autorizaste cuando hacía falta?',
    siNo: 'Fuera de salud, pensión y lo que permite la ley, todo descuento necesita tu autorización escrita.',
    enlaces: [
      { to: '/derechos/descuentos-y-embargos-del-salario', label: 'Descuentos y embargos del salario' },
      { to: '/calculadoras/salario-neto', label: 'Calculadora de salario neto' },
    ],
  },
  {
    id: 'contrato',
    pregunta: '¿Sabes qué tipo de contrato tienes y tienes una copia?',
    siNo: 'Pide copia de tu contrato. Si trabajas con horario y órdenes, pero te pagan por prestación de servicios, puede haber un contrato laboral escondido.',
    enlaces: [
      { to: '/derechos/tipos-de-contrato-y-periodo-de-prueba', label: 'Tipos de contrato y periodo de prueba' },
      { to: '/herramientas/cartas/derecho-de-peticion', label: 'Carta para pedir copia del contrato' },
    ],
  },
];

export type Resultado = { ok: PreguntaDiagnostico[]; revisar: PreguntaDiagnostico[]; dudas: PreguntaDiagnostico[] };

export function resultadoDiagnostico(respuestas: Record<string, Respuesta | undefined>): Resultado {
  const r: Resultado = { ok: [], revisar: [], dudas: [] };
  for (const p of DIAGNOSTICO) {
    const a = respuestas[p.id];
    if (a === 'si') r.ok.push(p);
    else if (a === 'no') r.revisar.push(p);
    else if (a === 'nose') r.dudas.push(p);
  }
  return r;
}
