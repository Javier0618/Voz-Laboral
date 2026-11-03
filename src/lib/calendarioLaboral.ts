// Calendario laboral: fechas de pago, festivos y cambios de norma de un año,
// y su archivo .ics para agregarlas al calendario del celular. Funciones puras.
import { festivos } from './festivos';

export type TipoFecha = 'pago' | 'festivo' | 'cambio';

export type FechaLaboral = {
  /** AAAA-MM-DD */
  fecha: string;
  tipo: TipoFecha;
  titulo: string;
  detalle: string;
  norma?: string;
  enlace?: { to: string; label: string };
};

/** Cambios de norma con fecha cierta. Se agregan aquí cuando una ley o una sentencia fija una fecha. */
const CAMBIOS: FechaLaboral[] = [
  {
    fecha: '2026-07-01', tipo: 'cambio', titulo: 'El recargo dominical y festivo sube al 90 %',
    detalle: 'Cada hora trabajada en domingo o festivo se paga con un recargo del 90 % sobre la hora ordinaria.',
    norma: 'CST, art. 179, modificado por la Ley 2466 de 2025',
    enlace: { to: '/derechos/descanso-dominical-y-festivos', label: 'Trabajar domingos y festivos' },
  },
  {
    fecha: '2027-04-01', tipo: 'cambio', titulo: 'Empieza el nuevo sistema pensional',
    detalle: 'Entran a regir los artículos de la reforma pensional que la Corte Constitucional declaró ajustados a la Constitución.',
    norma: 'Ley 2381 de 2024 y sentencia C-264 de 2026',
    enlace: { to: '/derechos/reforma-pensional-que-cambia', label: 'Reforma pensional: qué cambia' },
  },
  {
    fecha: '2027-07-01', tipo: 'cambio', titulo: 'El recargo dominical y festivo llega al 100 %',
    detalle: 'Termina la subida gradual: cada hora en domingo o festivo se paga con un recargo del 100 %.',
    norma: 'CST, art. 179, modificado por la Ley 2466 de 2025',
    enlace: { to: '/derechos/descanso-dominical-y-festivos', label: 'Trabajar domingos y festivos' },
  },
];

const DOTACION = { to: '/derechos/salario-minimo-auxilio-de-transporte-y-dotacion', label: 'Salario mínimo, auxilio de transporte y dotación' };

/** Fechas laborales del año, en orden. */
export function calendarioLaboral(anio: number): FechaLaboral[] {
  const a = String(anio);
  const pagos: FechaLaboral[] = [
    {
      fecha: `${a}-01-31`, tipo: 'pago', titulo: 'Último día para pagarte los intereses de las cesantías',
      detalle: 'El empleador te paga directamente el 12 % anual sobre las cesantías acumuladas a 31 de diciembre.',
      norma: 'Ley 52 de 1975', enlace: { to: '/derechos/cesantias-e-intereses', label: 'Cesantías e intereses' },
    },
    {
      fecha: `${a}-02-14`, tipo: 'pago', titulo: 'Último día para consignar tus cesantías',
      detalle: 'Las cesantías del año anterior deben quedar consignadas en tu fondo antes del 14 de febrero.',
      norma: 'Ley 50 de 1990, art. 99', enlace: { to: '/calculadoras/cesantias', label: 'Calculadora de cesantías' },
    },
    {
      fecha: `${a}-04-30`, tipo: 'pago', titulo: 'Primera entrega de dotación',
      detalle: 'Un par de zapatos y un vestido de trabajo, si ganas hasta dos salarios mínimos y llevas más de tres meses.',
      norma: 'CST, art. 230', enlace: DOTACION,
    },
    {
      fecha: `${a}-06-30`, tipo: 'pago', titulo: 'Último día para pagarte la prima de junio',
      detalle: 'La primera mitad de la prima de servicios: 15 días de salario por el semestre, o en proporción al tiempo trabajado.',
      norma: 'CST, art. 306', enlace: { to: '/calculadoras/prima', label: 'Calculadora de prima' },
    },
    {
      fecha: `${a}-08-31`, tipo: 'pago', titulo: 'Segunda entrega de dotación',
      detalle: 'Si ganas hasta dos salarios mínimos y llevas más de tres meses con el empleador.',
      norma: 'CST, art. 230', enlace: DOTACION,
    },
    {
      fecha: `${a}-12-20`, tipo: 'pago', titulo: 'Último día para pagarte la prima de diciembre',
      detalle: 'La segunda mitad de la prima de servicios, dentro de los primeros 20 días de diciembre.',
      norma: 'CST, art. 306', enlace: { to: '/calculadoras/prima', label: 'Calculadora de prima' },
    },
    {
      fecha: `${a}-12-20`, tipo: 'pago', titulo: 'Tercera entrega de dotación',
      detalle: 'La última del año, si ganas hasta dos salarios mínimos y llevas más de tres meses.',
      norma: 'CST, art. 230', enlace: DOTACION,
    },
  ];
  const dias: FechaLaboral[] = [...festivos(anio)].map(([fecha, nombre]) => ({
    fecha, tipo: 'festivo', titulo: `Festivo: ${nombre}`,
    detalle: 'Día de descanso obligatorio y pagado. Si lo trabajas, te deben el recargo dominical y festivo.',
    norma: 'Ley 51 de 1983 y CST, art. 177',
    enlace: { to: '/derechos/descanso-dominical-y-festivos', label: 'Trabajar domingos y festivos' },
  }));
  const cambios = CAMBIOS.filter((c) => c.fecha.startsWith(a));
  return [...pagos, ...dias, ...cambios].sort((x, y) => x.fecha.localeCompare(y.fecha) || orden(x.tipo) - orden(y.tipo));
}

const orden = (t: TipoFecha) => ({ cambio: 0, pago: 1, festivo: 2 })[t];

// ------------------------------------------------------------------ .ics

const escIcs = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

const bytes = (s: string) => new TextEncoder().encode(s).length;

/** Parte las líneas en máximo 75 octetos, como pide RFC 5545, sin cortar una letra con tilde. */
function plegar(linea: string): string {
  const partes: string[] = [];
  let actual = '';
  for (const ch of linea) {
    const limite = partes.length ? 74 : 75; // las líneas de continuación empiezan con un espacio
    if (bytes(actual + ch) > limite) {
      partes.push(actual);
      actual = '';
    }
    actual += ch;
  }
  partes.push(actual);
  return partes.map((p, i) => (i ? ' ' : '') + p).join('\r\n');
}

const sinGuiones = (iso: string) => iso.replace(/-/g, '');
function diaSiguiente(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Archivo .ics con eventos de día completo. Los pagos y cambios llevan un
 * recordatorio a las 9 a. m. del día anterior; los festivos, ninguno.
 */
export function generarIcs(fechas: FechaLaboral[], sitio: string, ahora = new Date()): string {
  const stamp = ahora.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TuVozLaboral//Calendario laboral//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Calendario laboral · TuVozLaboral'];
  for (const f of fechas) {
    const url = f.enlace ? `${sitio}${f.enlace.to}` : sitio;
    lineas.push(
      'BEGIN:VEVENT',
      `UID:${sinGuiones(f.fecha)}-${f.tipo}-${f.titulo.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').slice(0, 40)}@tuvozlaboral.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${sinGuiones(f.fecha)}`,
      `DTEND;VALUE=DATE:${sinGuiones(diaSiguiente(f.fecha))}`,
      `SUMMARY:${escIcs(f.titulo)}`,
      `DESCRIPTION:${escIcs(`${f.detalle}${f.norma ? ` (${f.norma}).` : ''}\nMás información: ${url}`)}`,
      `URL:${url}`,
      'TRANSP:TRANSPARENT',
    );
    if (f.tipo !== 'festivo') {
      lineas.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escIcs(f.titulo)}`, 'TRIGGER:-PT15H', 'END:VALARM');
    }
    lineas.push('END:VEVENT');
  }
  lineas.push('END:VCALENDAR');
  return lineas.map(plegar).join('\r\n') + '\r\n';
}

/** Enlace para agregar una fecha a Google Calendar sin descargar nada. */
export function enlaceGoogleCalendar(f: FechaLaboral, sitio: string): string {
  const url = f.enlace ? `${sitio}${f.enlace.to}` : sitio;
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: f.titulo,
    dates: `${sinGuiones(f.fecha)}/${sinGuiones(diaSiguiente(f.fecha))}`,
    details: `${f.detalle}${f.norma ? ` (${f.norma}).` : ''}\nMás información: ${url}`,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
