// Glosario laboral: definiciones cortas, en lenguaje claro, de los términos
// que más aparecen en las guías. Se muestran en /herramientas/glosario y, en
// las guías, al tocar la primera aparición de cada término.

export type Termino = {
  id: string;
  termino: string;
  /** Otras formas en que aparece en un texto (plural, sigla…). Se buscan sin distinguir mayúsculas. */
  variantes?: string[];
  definicion: string;
  guia?: { slug: string; label: string };
};

export const GLOSARIO: Termino[] = [
  { id: 'arl', termino: 'ARL', variantes: ['administradora de riesgos laborales'], definicion: 'Administradora de riesgos laborales. Cubre los accidentes de trabajo y las enfermedades laborales. La paga por completo el empleador.', guia: { slug: 'accidente-de-trabajo-y-enfermedad-laboral', label: 'Accidente de trabajo y enfermedad laboral' } },
  { id: 'auxilio-de-transporte', termino: 'Auxilio de transporte', definicion: 'Pago mensual para quienes ganan hasta dos salarios mínimos, para ayudar con el transporte al trabajo. En 2026 es de $249.095.', guia: { slug: 'salario-minimo-auxilio-de-transporte-y-dotacion', label: 'Salario mínimo y auxilio de transporte' } },
  { id: 'calculo-actuarial', termino: 'Cálculo actuarial', definicion: 'Valor que debe pagar un empleador a la administradora de pensiones por los aportes que no hizo, para que ese tiempo cuente en tu pensión.' },
  { id: 'caja-de-compensacion', termino: 'Caja de compensación', variantes: ['caja de compensación familiar'], definicion: 'Entidad a la que el empleador te afilia y que da subsidio familiar, recreación, educación y el subsidio de desempleo. La paga el empleador.', guia: { slug: 'seguridad-social-eps-pension-arl-y-caja', label: 'Seguridad social' } },
  { id: 'cesantias', termino: 'Cesantías', definicion: 'Ahorro que el empleador te consigna cada año en un fondo: un mes de salario por año trabajado. Sirve para cuando te quedas sin empleo, para vivienda o para estudio.', guia: { slug: 'cesantias-e-intereses', label: 'Cesantías e intereses' } },
  { id: 'contrato-a-termino-fijo', termino: 'Contrato a término fijo', variantes: ['contratos a término fijo'], definicion: 'Contrato con fecha de terminación. Debe constar por escrito y no puede durar más de cuatro años.', guia: { slug: 'tipos-de-contrato-y-periodo-de-prueba', label: 'Tipos de contrato' } },
  { id: 'contrato-a-termino-indefinido', termino: 'Contrato a término indefinido', variantes: ['contratos a término indefinido'], definicion: 'Contrato sin fecha de terminación. Dura mientras las dos partes quieran seguir.', guia: { slug: 'tipos-de-contrato-y-periodo-de-prueba', label: 'Tipos de contrato' } },
  { id: 'derecho-de-peticion', termino: 'Derecho de petición', definicion: 'Solicitud escrita que puedes presentar a una entidad o a una empresa, que debe responderte de fondo, en general dentro de 15 días.', guia: { slug: 'a-donde-acudir-ministerio-y-derecho-de-peticion', label: 'A dónde acudir y derecho de petición' } },
  { id: 'descanso-compensatorio', termino: 'Descanso compensatorio', definicion: 'Día de descanso pagado que te deben dar cuando trabajas en tu día de descanso obligatorio, como el domingo o un festivo.', guia: { slug: 'descanso-dominical-y-festivos', label: 'Trabajar domingos y festivos' } },
  { id: 'desprendible', termino: 'Desprendible de nómina', variantes: ['desprendible de pago', 'desprendible', 'desprendibles'], definicion: 'Documento que muestra cuánto te pagaron en un periodo y por qué: salario, recargos, auxilios y cada descuento.', guia: { slug: 'pago-del-salario', label: 'Cuándo y cómo deben pagarte el salario' } },
  { id: 'dotacion', termino: 'Dotación', definicion: 'Un par de zapatos y un vestido de trabajo que el empleador entrega gratis cada cuatro meses a quien gana hasta dos salarios mínimos.', guia: { slug: 'salario-minimo-auxilio-de-transporte-y-dotacion', label: 'Salario mínimo y dotación' } },
  { id: 'eps', termino: 'EPS', variantes: ['entidad promotora de salud'], definicion: 'Entidad promotora de salud. Te presta los servicios de salud y paga las incapacidades por enfermedad desde el tercer día.', guia: { slug: 'seguridad-social-eps-pension-arl-y-caja', label: 'Seguridad social' } },
  { id: 'estabilidad-laboral-reforzada', termino: 'Estabilidad laboral reforzada', definicion: 'Protección que impide despedir sin autorización previa a ciertas personas, como trabajadoras embarazadas o personas con problemas de salud que afectan su trabajo.', guia: { slug: 'estabilidad-laboral-reforzada', label: 'Estabilidad laboral reforzada' } },
  { id: 'historia-laboral', termino: 'Historia laboral', definicion: 'Registro de tu administradora de pensiones con las semanas cotizadas, los empleadores y los salarios. Con ella se decide tu pensión.', guia: { slug: 'pension-de-vejez-requisitos', label: 'Pensión de vejez' } },
  { id: 'hora-extra', termino: 'Horas extra', variantes: ['hora extra', 'trabajo suplementario'], definicion: 'Horas que trabajas por encima de tu jornada. Se pagan completas y con un recargo: 25 % las diurnas y 75 % las nocturnas.', guia: { slug: 'jornada-horas-extra-y-recargos', label: 'Jornada, horas extra y recargos' } },
  { id: 'ibl', termino: 'Ingreso base de liquidación', variantes: ['IBL'], definicion: 'Promedio de los salarios sobre los que cotizaste en los últimos 10 años, actualizado con la inflación. Sobre él se calcula tu pensión.', guia: { slug: 'pension-de-vejez-requisitos', label: 'Pensión de vejez' } },
  { id: 'incapacidad', termino: 'Incapacidad', variantes: ['incapacidades'], definicion: 'Periodo en que un médico certifica que no puedes trabajar por enfermedad o accidente. Durante ese tiempo recibes un auxilio en lugar del salario.', guia: { slug: 'incapacidad-por-enfermedad', label: 'Incapacidad por enfermedad' } },
  { id: 'indemnizacion', termino: 'Indemnización', variantes: ['indemnización por despido'], definicion: 'Pago que te debe el empleador si te despide sin justa causa. Depende de tu tipo de contrato y del tiempo trabajado.', guia: { slug: 'despido-con-y-sin-justa-causa', label: 'Despido con y sin justa causa' } },
  { id: 'intereses-cesantias', termino: 'Intereses sobre las cesantías', variantes: ['intereses de las cesantías', 'intereses sobre cesantías'], definicion: 'El 12 % anual sobre tus cesantías, que el empleador te paga directamente a más tardar el 31 de enero.', guia: { slug: 'cesantias-e-intereses', label: 'Cesantías e intereses' } },
  { id: 'jornada-maxima', termino: 'Jornada máxima', variantes: ['jornada ordinaria'], definicion: 'El máximo de horas que se pueden trabajar sin que sean horas extra: hoy, 42 horas a la semana.', guia: { slug: 'jornada-horas-extra-y-recargos', label: 'Jornada máxima' } },
  { id: 'justa-causa', termino: 'Justa causa', definicion: 'Motivo que la ley acepta para terminar el contrato sin pagar indemnización. Debe decirse por escrito al terminarlo.', guia: { slug: 'despido-con-y-sin-justa-causa', label: 'Despido con y sin justa causa' } },
  { id: 'liquidacion', termino: 'Liquidación', definicion: 'Lo que te deben pagar al terminar el contrato: salarios pendientes, cesantías e intereses, prima proporcional y vacaciones pendientes.', guia: { slug: 'liquidacion-al-terminar-el-contrato', label: 'La liquidación' } },
  { id: 'otrosi', termino: 'Otrosí', definicion: 'Documento firmado por las dos partes que cambia o agrega algo al contrato de trabajo.' },
  { id: 'periodo-de-prueba', termino: 'Periodo de prueba', variantes: ['período de prueba'], definicion: 'Primera etapa del contrato, pactada por escrito, en la que cualquiera de las partes puede terminarlo sin aviso y sin indemnización.', guia: { slug: 'tipos-de-contrato-y-periodo-de-prueba', label: 'Periodo de prueba' } },
  { id: 'preaviso', termino: 'Preaviso', definicion: 'Aviso por escrito, con anticipación, de que vas a terminar el contrato o de que no se va a renovar.', guia: { slug: 'renuncia-y-preaviso', label: 'Renuncia y preaviso' } },
  { id: 'prescripcion', termino: 'Prescripción', definicion: 'Plazo después del cual ya no puedes reclamar un derecho. En lo laboral, en general son 3 años desde que te debían pagar.', guia: { slug: 'a-donde-acudir-ministerio-y-derecho-de-peticion', label: 'A dónde acudir' } },
  { id: 'prima', termino: 'Prima de servicios', definicion: 'Pago de 30 días de salario por año, en dos partes: a más tardar el 30 de junio y el 20 de diciembre.', guia: { slug: 'prima-de-servicios', label: 'Prima de servicios' } },
  { id: 'prima-media', termino: 'Prima media', variantes: ['régimen de prima media'], definicion: 'Régimen de pensiones que administra Colpensiones. La pensión depende de la edad, las semanas y tu ingreso base, no de un ahorro propio.', guia: { slug: 'pension-de-vejez-requisitos', label: 'Pensión de vejez' } },
  { id: 'ahorro-individual', termino: 'Ahorro individual', variantes: ['régimen de ahorro individual'], definicion: 'Régimen de pensiones de los fondos privados. Cada persona tiene una cuenta propia y la pensión depende del dinero ahorrado.', guia: { slug: 'pension-de-vejez-requisitos', label: 'Pensión de vejez' } },
  { id: 'recargo', termino: 'Recargo', variantes: ['recargos'], definicion: 'Valor extra que se suma al pago de una hora de trabajo por hacerla de noche, en domingo o en un festivo.', guia: { slug: 'jornada-horas-extra-y-recargos', label: 'Jornada, horas extra y recargos' } },
  { id: 'salario-minimo', termino: 'Salario mínimo', variantes: ['SMMLV'], definicion: 'Lo menos que se puede pagar por una jornada completa. En 2026 es de $1.750.905 al mes.', guia: { slug: 'salario-minimo-auxilio-de-transporte-y-dotacion', label: 'Salario mínimo' } },
  { id: 'semanas-cotizadas', termino: 'Semanas cotizadas', variantes: ['semana cotizada'], definicion: 'Cada periodo de 7 días en que se pagaron aportes a pensión a tu nombre. Las necesitas para pensionarte.', guia: { slug: 'pension-de-vejez-requisitos', label: 'Pensión de vejez' } },
];

// Las variantes más largas primero, para que «régimen de prima media» gane sobre «prima media».
const FORMAS = GLOSARIO.flatMap((t) => [t.termino, ...(t.variantes ?? [])].map((forma) => ({ forma, id: t.id })))
  .sort((a, b) => b.forma.length - a.forma.length);

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Bordes de palabra que entienden tildes y eñes.
const PATRON = new RegExp(`(?<![\\p{L}\\p{N}])(${FORMAS.map((f) => escapar(f.forma)).join('|')})(?![\\p{L}\\p{N}])`, 'giu');
const POR_FORMA = new Map(FORMAS.map((f) => [f.forma.toLowerCase(), f.id]));
export const terminoPorId = (id: string) => GLOSARIO.find((t) => t.id === id);

export type ParteGlosario = string | { texto: string; id: string };

/**
 * Parte un texto marcando la primera aparición de cada término. `vistos`
 * guarda los ya marcados en la guía, para no repetir la marca.
 */
export function partesGlosario(texto: string, vistos: Set<string>): ParteGlosario[] {
  const partes: ParteGlosario[] = [];
  let desde = 0;
  for (const m of texto.matchAll(PATRON)) {
    const id = POR_FORMA.get(m[0].toLowerCase());
    if (!id || vistos.has(id)) continue;
    vistos.add(id);
    if (m.index! > desde) partes.push(texto.slice(desde, m.index));
    partes.push({ texto: m[0], id });
    desde = m.index! + m[0].length;
  }
  if (desde < texto.length) partes.push(texto.slice(desde));
  return partes;
}
