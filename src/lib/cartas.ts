// Generador de cartas laborales. Funciones puras: arman el texto a partir de
// lo que la persona escribe en el formulario. No se guarda nada: todo ocurre
// en el navegador. Cada carta cita la norma que la respalda, verificada en la
// compilación normativa de Colpensiones (CST, Constitución y Ley 1755 de 2015).

export type CampoCarta = {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'email';
  options?: { value: string; label: string }[];
  optional?: boolean;
  hint?: string;
  placeholder?: string;
};

export type Carta = {
  slug: string;
  title: string;
  description: string;
  /** Consejos que se muestran junto al formulario. */
  consejos: string[];
  /** Guía que explica el derecho detrás de la carta. */
  guia: { slug: string; label: string };
  campos: CampoCarta[];
};

export type DatosCarta = Record<string, string>;

export type TextoCarta = {
  encabezado: string[];
  destinatario: string[];
  asunto: string;
  cuerpo: string[];
  firma: string[];
};

const PERSONA: CampoCarta[] = [
  { name: 'ciudad', label: 'Ciudad', type: 'text', placeholder: 'Bogotá' },
  { name: 'fecha', label: 'Fecha de la carta', type: 'date' },
  { name: 'nombre', label: 'Tu nombre completo', type: 'text' },
  { name: 'documento', label: 'Tu número de cédula', type: 'text', hint: 'Escribe solo el número; la carta agrega «C. C.».' },
];

const CONTACTO: CampoCarta[] = [
  { name: 'correo', label: 'Tu correo para la respuesta', type: 'email', optional: true },
  { name: 'telefono', label: 'Tu teléfono', type: 'text', optional: true },
  { name: 'direccion', label: 'Tu dirección', type: 'text', optional: true },
];

const EMPRESA: CampoCarta[] = [
  { name: 'empresa', label: 'Nombre de la empresa', type: 'text' },
  { name: 'destinatario', label: 'Dirigida a', type: 'text', optional: true, placeholder: 'Área de Recursos Humanos', hint: 'Si no sabes el nombre de la persona, deja «Área de Recursos Humanos».' },
  { name: 'cargo', label: 'Tu cargo', type: 'text' },
];

export const MOTIVOS_PETICION = [
  { value: 'prima', label: 'Pago de la prima de servicios' },
  { value: 'cesantias', label: 'Consignación de las cesantías' },
  { value: 'intereses', label: 'Pago de los intereses de las cesantías' },
  { value: 'liquidacion', label: 'Pago de la liquidación final' },
  { value: 'recargos', label: 'Pago de horas extra, recargos, domingos o festivos' },
  { value: 'salario', label: 'Pago de salarios atrasados' },
  { value: 'certificado', label: 'Certificado laboral' },
  { value: 'documentos', label: 'Copia de mi contrato, desprendibles y aportes' },
  { value: 'otro', label: 'Otro motivo' },
] as const;

export const CARTAS: Carta[] = [
  {
    slug: 'derecho-de-peticion',
    title: 'Derecho de petición a tu empleador',
    description: 'Solicita pagos o documentos al empleador con una petición clara. El plazo general de respuesta es de 15 días hábiles; para información y documentos es de 10, salvo normas especiales.',
    consejos: [
      'Cuenta los hechos con fechas y cifras: cuándo debían pagarte, cuánto y qué pasó.',
      'Entrégala con copia y pide que te firmen el recibido, o envíala por correo y guarda el mensaje.',
      'Un reclamo escrito recibido por el empleador puede interrumpir la prescripción una vez si identifica debidamente el derecho reclamado (art. 489 del CST). Conserva prueba de su recepción.',
      'Si no responden en el plazo legal aplicable, solicita orientación sobre los mecanismos para exigir respuesta. Un reclamo de pago y un derecho de petición no son lo mismo.',
    ],
    guia: { slug: 'a-donde-acudir-ministerio-y-derecho-de-peticion', label: 'A dónde acudir y cómo hacer un derecho de petición' },
    campos: [
      ...PERSONA,
      ...EMPRESA,
      { name: 'motivo', label: 'Qué vas a pedir', type: 'select', options: [...MOTIVOS_PETICION] },
      { name: 'periodo', label: 'Periodo al que corresponde', type: 'text', optional: true, placeholder: 'el segundo semestre de 2026', hint: 'Por ejemplo: «el segundo semestre de 2026» o «el mes de octubre de 2026».' },
      { name: 'hechos', label: 'Qué pasó', type: 'textarea', placeholder: 'Trabajo en la empresa desde el 1 de marzo de 2025. A la fecha no me han pagado…', hint: 'Escribe los hechos en orden, con fechas y cifras. Un hecho por línea.' },
      { name: 'peticion', label: 'Qué pides exactamente', type: 'textarea', optional: true, hint: 'Si lo dejas vacío, la carta usa una petición según el motivo que elegiste.' },
      ...CONTACTO,
    ],
  },
  {
    slug: 'carta-de-renuncia',
    title: 'Carta de renuncia',
    description: 'Renuncia voluntaria con la fecha de tu último día y la solicitud de tu liquidación y tu certificado laboral.',
    consejos: [
      'En el contrato a término indefinido, la ley pide avisar con 30 días de anticipación, pero no permite cobrarte una multa por no hacerlo (art. 47 del CST).',
      'En contratos a término fijo, distingue la renuncia voluntaria del aviso de no renovación. Revisa tu contrato y las circunstancias antes de fijar la fecha de salida.',
      'Al renunciar no pierdes las cesantías, la prima proporcional ni las vacaciones pendientes.',
      'Entrégala con copia y pide que te firmen el recibido.',
    ],
    guia: { slug: 'renuncia-y-preaviso', label: 'Renunciar: preaviso, liquidación y renuncia por justa causa' },
    campos: [
      ...PERSONA,
      ...EMPRESA,
      { name: 'ultimoDia', label: 'Tu último día de trabajo', type: 'date' },
      { name: 'agradecimiento', label: 'Agregar un agradecimiento', type: 'select', options: [{ value: 'si', label: 'Sí' }, { value: 'no', label: 'No' }] },
      ...CONTACTO,
    ],
  },
  {
    slug: 'renuncia-por-justa-causa',
    title: 'Renuncia por justa causa',
    description: 'Cuando renuncias por un incumplimiento grave del empleador. La carta debe decir el motivo, porque después no podrás alegar otro.',
    consejos: [
      'Solo puedes alegar el motivo que escribas en esta carta (art. 66 del CST). Sé concreto y completo.',
      'Reúne pruebas antes de entregarla: desprendibles, mensajes, correos y testigos.',
      'Si se prueba una justa causa imputable al empleador, puedes reclamar la indemnización correspondiente. No se reconoce automáticamente por presentar esta carta.',
      'Conviene que un abogado o el Ministerio del Trabajo revisen tu caso antes de renunciar.',
    ],
    guia: { slug: 'renuncia-y-preaviso', label: 'Renunciar: preaviso, liquidación y renuncia por justa causa' },
    campos: [
      ...PERSONA,
      ...EMPRESA,
      { name: 'ultimoDia', label: 'Tu último día de trabajo', type: 'date' },
      { name: 'hechos', label: 'Qué incumplió el empleador', type: 'textarea', placeholder: 'Desde agosto de 2026 la empresa me paga el salario con más de 20 días de retraso…', hint: 'Los hechos, con fechas. Ejemplos de justas causas: no pagarte el salario a tiempo, malos tratos o amenazas, exigirte trabajos distintos de los pactados o ponerte en peligro (art. 62 del CST).' },
      ...CONTACTO,
    ],
  },
  {
    slug: 'solicitud-de-vacaciones',
    title: 'Solicitud de vacaciones',
    description: 'Para pedir por escrito tus 15 días hábiles de vacaciones en las fechas que te sirven.',
    consejos: [
      'Por cada año trabajado tienes derecho a 15 días hábiles de vacaciones pagadas (art. 186 del CST).',
      'El empleador fija la fecha, pero las vacaciones también se conceden a petición del trabajador (art. 187 del CST).',
      'Propón fechas concretas y pide confirmación escrita. El empleador debe comunicar la fecha de disfrute con 15 días de anticipación (art. 187 del CST).',
    ],
    guia: { slug: 'vacaciones', label: 'Vacaciones: cuántos días te corresponden y cuándo tomarlas' },
    campos: [
      ...PERSONA,
      ...EMPRESA,
      { name: 'periodo', label: 'Año de trabajo al que corresponden', type: 'text', placeholder: '1 de marzo de 2025 a 28 de febrero de 2026' },
      { name: 'desde', label: 'Desde', type: 'date' },
      { name: 'hasta', label: 'Hasta', type: 'date' },
      ...CONTACTO,
    ],
  },
  {
    slug: 'correccion-historia-laboral',
    title: 'Corrección de la historia laboral',
    description: 'Para pedirle a Colpensiones o a tu fondo de pensiones que incluya semanas que faltan en tu historia laboral.',
    consejos: [
      'Antes, descarga tu historia laboral y anota exactamente qué periodos faltan.',
      'Adjunta pruebas: certificados laborales, desprendibles o planillas de pago de aportes.',
      'Si identificas aportes omitidos o impagos del empleador, indícalos y aporta soportes para que la administradora investigue y adelante las gestiones que correspondan.',
    ],
    guia: { slug: 'pension-de-vejez-requisitos', label: 'Pensión de vejez: requisitos, semanas y cómo pedirla' },
    campos: [
      ...PERSONA,
      { name: 'administradora', label: 'Administradora de pensiones', type: 'text', placeholder: 'Colpensiones' },
      { name: 'periodos', label: 'Periodos y empleadores que faltan', type: 'textarea', placeholder: 'Empresa ABC S. A. S., NIT 900.000.000, del 1 de enero de 2015 al 30 de junio de 2016.', hint: 'Uno por línea: empresa, NIT si lo tienes y fechas.' },
      { name: 'anexos', label: 'Pruebas que adjuntas', type: 'textarea', optional: true, placeholder: 'Certificado laboral de Empresa ABC S. A. S.' },
      ...CONTACTO,
    ],
  },
];

export const cartaPorSlug = (slug: string | undefined) => CARTAS.find((c) => c.slug === slug);

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** «2026-11-03» → «3 de noviembre de 2026». Vacío o inválido → «___». */
export function fechaLarga(iso: string | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!m) return '___';
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return '___';
  return `${day} de ${MESES[month - 1]} de ${year}`;
}

const v = (d: DatosCarta, k: string, vacio = '___') => (d[k] ?? '').trim() || vacio;
const lineas = (t: string | undefined) => (t ?? '').split('\n').map((l) => l.trim()).filter(Boolean);

function peticionPorMotivo(d: DatosCarta): string {
  const periodo = (d.periodo ?? '').trim();
  // «a el primer semestre» → «al primer semestre».
  const del = periodo ? ` correspondiente a ${periodo}`.replace(/ a el /i, ' al ') : '';
  switch (d.motivo) {
    case 'prima': return `Que se me pague la prima de servicios${del}, según el artículo 306 del Código Sustantivo del Trabajo, y se me entregue el detalle del cálculo.`;
    case 'cesantias': return `Que se consignen en mi fondo de cesantías las cesantías${del}, según el artículo 249 del Código Sustantivo del Trabajo y el artículo 99 de la Ley 50 de 1990, y se me entregue el soporte de la consignación.`;
    case 'intereses': return `Que se me paguen los intereses sobre las cesantías${del}, del 12 % anual, según la Ley 52 de 1975, y se me entregue el detalle del cálculo.`;
    case 'liquidacion': return 'Que se me pague la liquidación final del contrato: salarios pendientes, cesantías y sus intereses, prima proporcional y vacaciones pendientes, con el detalle de cada valor.';
    case 'recargos': return `Que se me paguen las horas extra y los recargos nocturnos, dominicales y festivos${del}, según los artículos 168 y 179 del Código Sustantivo del Trabajo, con el detalle de las horas y los valores.`;
    case 'salario': return `Que se me pague el salario${del}, según el numeral 4 del artículo 57 del Código Sustantivo del Trabajo.`;
    case 'certificado': return 'Que se me expida un certificado laboral con el tiempo de servicio, el cargo y el salario, según el numeral 7 del artículo 57 del Código Sustantivo del Trabajo.';
    case 'documentos': return 'Que se me entregue copia de mi contrato de trabajo y de sus otrosíes, de mis desprendibles de pago y de las planillas de pago de mis aportes a seguridad social.';
    default: return '___';
  }
}

function contacto(d: DatosCarta): string[] {
  const partes = [
    d.correo?.trim() && `correo electrónico ${d.correo.trim()}`,
    d.telefono?.trim() && `teléfono ${d.telefono.trim()}`,
    d.direccion?.trim() && `dirección ${d.direccion.trim()}`,
  ].filter(Boolean) as string[];
  return partes.length ? [`Recibiré la respuesta en: ${partes.join(', ')}.`] : [];
}

function firma(d: DatosCarta, extra: string[] = []): string[] {
  return ['Atentamente,', '', '', '______________________________', v(d, 'nombre'), `C. C. ${v(d, 'documento')}`, ...extra];
}

/** Arma el texto de la carta. Los campos vacíos quedan como «___» para completarlos a mano. */
export function generarCarta(slug: string, d: DatosCarta): TextoCarta {
  const encabezado = [`${v(d, 'ciudad')}, ${fechaLarga(d.fecha)}`];
  const destinatarioEmpresa = ['Señores', v(d, 'empresa'), v(d, 'destinatario', 'Área de Recursos Humanos'), 'Ciudad'];
  const yo = `Yo, ${v(d, 'nombre')}, identificado(a) con la cédula de ciudadanía número ${v(d, 'documento')}`;

  switch (slug) {
    case 'derecho-de-peticion': {
      const motivo = MOTIVOS_PETICION.find((m) => m.value === d.motivo);
      const pedido = (d.peticion ?? '').trim() || peticionPorMotivo(d);
      const hechos = lineas(d.hechos);
      return {
        encabezado,
        destinatario: destinatarioEmpresa,
        asunto: `Derecho de petición: ${motivo && motivo.value !== 'otro' ? motivo.label.toLowerCase() : 'solicitud laboral'}`,
        cuerpo: [
          `${yo}, en ejercicio del derecho de petición que consagran el artículo 23 de la Constitución Política y la Ley 1755 de 2015 (artículo 32, peticiones ante organizaciones privadas), presento la siguiente petición.`,
          'Hechos',
          `1. Trabajo o trabajé en ${v(d, 'empresa')} en el cargo de ${v(d, 'cargo')}.`,
          ...(hechos.length ? hechos.map((h, i) => `${i + 2}. ${h.replace(/^\d+[.)]\s*/, '')}`) : ['2. ___']),
          'Petición',
          pedido,
          'Solicito una respuesta de fondo dentro del plazo legal aplicable: por regla general, 15 días hábiles; para peticiones de información o documentos, 10 días hábiles, salvo disposiciones especiales (art. 14 de la Ley 1755 de 2015).',
          'En cuanto a derechos laborales debidamente identificados en este escrito, dejo constancia de mi reclamación ante el empleador para los efectos que correspondan conforme al artículo 489 del Código Sustantivo del Trabajo.',
          ...contacto(d),
        ],
        firma: firma(d),
      };
    }
    case 'carta-de-renuncia':
      return {
        encabezado,
        destinatario: destinatarioEmpresa,
        asunto: 'Renuncia voluntaria',
        cuerpo: [
          `${yo}, presento mi renuncia voluntaria al cargo de ${v(d, 'cargo')} en ${v(d, 'empresa')}. Mi último día de trabajo será el ${fechaLarga(d.ultimoDia)}.`,
          ...(d.agradecimiento === 'no' ? [] : ['Agradezco la oportunidad de trabajar con ustedes y lo aprendido durante este tiempo.']),
          'Solicito la liquidación detallada y el pago de los conceptos pendientes que correspondan (salarios, cesantías, intereses, prima y vacaciones), así como mi certificado laboral conforme al numeral 7 del artículo 57 del Código Sustantivo del Trabajo.',
          ...contacto(d),
        ],
        firma: firma(d),
      };
    case 'renuncia-por-justa-causa': {
      const hechos = lineas(d.hechos);
      return {
        encabezado,
        destinatario: destinatarioEmpresa,
        asunto: 'Terminación del contrato por justa causa imputable al empleador',
        cuerpo: [
          `${yo}, en mi calidad de trabajador(a) en el cargo de ${v(d, 'cargo')}, comunico que doy por terminado mi contrato de trabajo con ${v(d, 'empresa')} por justa causa imputable al empleador, con fundamento en el artículo 62, literal b), del Código Sustantivo del Trabajo. Mi último día de trabajo será el ${fechaLarga(d.ultimoDia)}.`,
          'De acuerdo con el parágrafo del artículo 62 y con el artículo 66 del mismo Código, estos son los hechos que motivan mi decisión:',
          ...(hechos.length ? hechos.map((h, i) => `${i + 1}. ${h.replace(/^\d+[.)]\s*/, '')}`) : ['1. ___']),
          'Solicito la liquidación detallada y el pago de los conceptos pendientes. Asimismo, reclamo la indemnización que corresponda conforme al artículo 64 del Código Sustantivo del Trabajo, en caso de acreditarse la justa causa imputable al empleador, y la expedición de mi certificado laboral.',
          ...contacto(d),
        ],
        firma: firma(d),
      };
    }
    case 'solicitud-de-vacaciones':
      return {
        encabezado,
        destinatario: destinatarioEmpresa,
        asunto: 'Solicitud de vacaciones',
        cuerpo: [
          `${yo}, en el cargo de ${v(d, 'cargo')}, solicito el disfrute de mis vacaciones correspondientes al periodo ${v(d, 'periodo')}, entre el ${fechaLarga(d.desde)} y el ${fechaLarga(d.hasta)}.`,
          'Presento esta solicitud de acuerdo con los artículos 186 y 187 del Código Sustantivo del Trabajo, que regulan el descanso anual remunerado y la fijación de las fechas de vacaciones.',
          'Agradezco confirmar por escrito las fechas autorizadas y, si no es posible atender las fechas propuestas, informarme una alternativa para coordinar el disfrute.',
          ...contacto(d),
        ],
        firma: firma(d),
      };
    case 'correccion-historia-laboral': {
      const periodos = lineas(d.periodos);
      const anexos = lineas(d.anexos);
      return {
        encabezado,
        destinatario: ['Señores', v(d, 'administradora'), 'Ciudad'],
        asunto: 'Derecho de petición: corrección de historia laboral',
        cuerpo: [
          `${yo}, afiliado(a) a ${v(d, 'administradora')}, en ejercicio del derecho de petición del artículo 23 de la Constitución Política y de la Ley 1755 de 2015, solicito la corrección de mi historia laboral.`,
          'Solicito que se incluyan los siguientes periodos, que no aparecen o aparecen incompletos:',
          ...(periodos.length ? periodos.map((p, i) => `${i + 1}. ${p}`) : ['1. ___']),
          'Si se evidencia mora u omisión del empleador en alguno de estos periodos, solicito que se realicen las verificaciones y gestiones de cobro correspondientes, y se me informe por escrito el resultado.',
          ...(anexos.length ? ['Anexos:', ...anexos.map((a, i) => `${i + 1}. ${a}`)] : []),
          'Solicito respuesta dentro del término legal aplicable, de acuerdo con la Ley 1755 de 2015 y las reglas especiales que correspondan a este trámite.',
          ...contacto(d),
        ],
        firma: firma(d),
      };
    }
    default:
      throw new Error(`Carta desconocida: ${slug}`);
  }
}

/** Texto plano de la carta, para copiar o descargar. */
export function cartaComoTexto(c: TextoCarta): string {
  return [...c.encabezado, '', ...c.destinatario, '', `Asunto: ${c.asunto}`, '', ...c.cuerpo.flatMap((p) => [p, '']), ...c.firma].join('\n');
}
