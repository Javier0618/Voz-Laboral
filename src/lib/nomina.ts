// Motor de las calculadoras de nómina. Funciones puras: no guardan nada.
// Cada regla cita su norma; las que son práctica de empresa y no ley se
// señalan como tales en la interfaz.
import { esDominicalOFestivo, sumarDias } from './festivos';
import { VALORES_2026 } from './liquidacion';

export const UVT_2026 = 52_374; // Resolución DIAN 000238 de 2025
/** Horas al mes para el valor de la hora: 42 h semanales ÷ 6 días × 30 días. Es una convención usual, no un mandato legal. */
export const HORAS_MES_DEFECTO = 210;

// ---------------------------------------------------------------- recargos

/** Recargo por trabajar en domingo o festivo según la fecha (CST art. 179, gradual por la Ley 2466 de 2025). */
export function recargoDominical(fechaISO: string): number {
  if (fechaISO >= '2027-07-01') return 1;
  if (fechaISO >= '2026-07-01') return 0.9;
  if (fechaISO >= '2025-07-01') return 0.8;
  return 0.75;
}

/** Hora en que empieza el trabajo nocturno: 7 p. m. desde el 25 de diciembre de 2025, antes 9 p. m. (CST art. 160). */
export function inicioNocturno(fechaISO: string): number {
  return fechaISO >= '2025-12-25' ? 19 : 21;
}

export type TipoHora = 'RN' | 'RDD' | 'RDN' | 'HED' | 'HEN' | 'HEDD' | 'HEDN';

export const TIPOS_HORA: { tipo: TipoHora; nombre: string; explicacion: string }[] = [
  { tipo: 'RN', nombre: 'Recargo nocturno', explicacion: 'Horas de tu jornada normal entre la noche y las 6 a. m.' },
  { tipo: 'RDD', nombre: 'Recargo dominical o festivo diurno', explicacion: 'Horas de tu jornada normal en domingo o festivo, de día.' },
  { tipo: 'RDN', nombre: 'Recargo dominical o festivo nocturno', explicacion: 'Horas de tu jornada normal en domingo o festivo, de noche.' },
  { tipo: 'HED', nombre: 'Hora extra diurna', explicacion: 'Horas por encima de tu jornada, de día.' },
  { tipo: 'HEN', nombre: 'Hora extra nocturna', explicacion: 'Horas por encima de tu jornada, de noche.' },
  { tipo: 'HEDD', nombre: 'Hora extra dominical o festiva diurna', explicacion: 'Horas extra en domingo o festivo, de día.' },
  { tipo: 'HEDN', nombre: 'Hora extra dominical o festiva nocturna', explicacion: 'Horas extra en domingo o festivo, de noche.' },
];

/**
 * Factor sobre el valor de la hora ordinaria. Los recargos de la jornada
 * normal pagan solo el porcentaje (la hora ya está en el salario); las horas
 * extra pagan la hora completa más su recargo (CST arts. 168 y 179).
 */
export function factorHora(tipo: TipoHora, fechaISO: string): number {
  const dom = recargoDominical(fechaISO);
  switch (tipo) {
    case 'RN': return 0.35;
    case 'RDD': return dom;
    case 'RDN': return 0.35 + dom;
    case 'HED': return 1.25;
    case 'HEN': return 1.75;
    case 'HEDD': return 1 + 0.25 + dom;
    case 'HEDN': return 1 + 0.75 + dom;
  }
}

export type Horas = Record<TipoHora, number>;
export const horasVacias = (): Horas => ({ RN: 0, RDD: 0, RDN: 0, HED: 0, HEN: 0, HEDD: 0, HEDN: 0 });

// ---------------------------------------------------------------- turnos

export interface Turno {
  fecha: string; // día en que empieza el turno
  entrada: string; // HH:MM
  salida: string; // HH:MM; si es menor o igual que la entrada, termina al día siguiente
  descansoMin: number; // minutos no laborados dentro del turno
}

export type ModoExtras = { modo: 'diario'; horasJornada: number } | { modo: 'periodo'; horasUmbral: number };

const aMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Minutos laborados de un turno, con la fecha y el tramo de cada minuto. */
function minutosDeTurno(t: Turno): { fecha: string; nocturno: boolean; festivo: boolean }[] {
  const ini = aMin(t.entrada);
  let fin = aMin(t.salida);
  if (fin <= ini) fin += 1440;
  const dur = fin - ini;
  const descanso = Math.min(Math.max(0, t.descansoMin), dur);
  // shortcut: el descanso se descuenta a mitad del turno; si tu pausa es en otra hora, el reparto día/noche puede variar.
  const pausaIni = ini + Math.floor((dur - descanso) / 2);
  const out: { fecha: string; nocturno: boolean; festivo: boolean }[] = [];
  for (let m = ini; m < fin; m++) {
    if (m >= pausaIni && m < pausaIni + descanso) continue;
    const f = sumarDias(t.fecha, Math.floor(m / 1440));
    const delDia = m % 1440;
    out.push({ fecha: f, nocturno: delDia >= inicioNocturno(f) * 60 || delDia < 360, festivo: esDominicalOFestivo(f) });
  }
  return out;
}

export interface ResultadoTurnos {
  horas: Horas;
  /** Valor de cada tipo de hora, con el factor de la fecha en que se trabajó. */
  valores: Record<TipoHora, number>;
  horasTrabajadas: number;
  horasOrdinarias: number;
  turnos: number;
  /** Días (fecha del turno) y semanas (su lunes) que pasan el límite de horas extra del CST, art. 167A. */
  excesoLimite: { dias: string[]; semanas: string[] };
}

/**
 * Reparte los minutos de los turnos en ordinarios y extra, y en diurnos,
 * nocturnos y festivos. Las horas extra son las últimas en orden cronológico.
 */
export function calcularTurnos(turnos: Turno[], valorHora: number, extras: ModoExtras): ResultadoTurnos {
  const horas = horasVacias();
  const valores = horasVacias();
  let total = 0;
  let acumulado = 0;
  const umbral = extras.modo === 'periodo' ? extras.horasUmbral * 60 : Infinity;
  const ordenados = [...turnos].sort((a, b) => (a.fecha + a.entrada).localeCompare(b.fecha + b.entrada));
  const porDia = new Map<string, number>();
  const porSemana = new Map<string, number>();
  for (const t of ordenados) {
    let enTurno = 0;
    const lunes = sumarDias(t.fecha, -((new Date(`${t.fecha}T00:00:00`).getDay() + 6) % 7));
    for (const min of minutosDeTurno(t)) {
      enTurno++;
      acumulado++;
      total++;
      const extra = extras.modo === 'diario' ? enTurno > extras.horasJornada * 60 : acumulado > umbral;
      const tipo: TipoHora | null = extra
        ? (min.festivo ? (min.nocturno ? 'HEDN' : 'HEDD') : min.nocturno ? 'HEN' : 'HED')
        : min.festivo ? (min.nocturno ? 'RDN' : 'RDD') : min.nocturno ? 'RN' : null;
      if (extra) {
        porDia.set(t.fecha, (porDia.get(t.fecha) ?? 0) + 1);
        porSemana.set(lunes, (porSemana.get(lunes) ?? 0) + 1);
      }
      if (!tipo) continue;
      horas[tipo] += 1 / 60;
      valores[tipo] += (valorHora * factorHora(tipo, min.fecha)) / 60;
    }
  }
  const extrasH = horas.HED + horas.HEN + horas.HEDD + horas.HEDN;
  const pasan = (m: Map<string, number>, limiteH: number) => [...m].filter(([, min]) => min > limiteH * 60).map(([f]) => f);
  return {
    horas, valores, horasTrabajadas: total / 60, horasOrdinarias: total / 60 - extrasH, turnos: ordenados.length,
    excesoLimite: { dias: pasan(porDia, 2), semanas: pasan(porSemana, 12) },
  };
}

/** Aviso del límite de horas extra (CST, art. 167A, Ley 2466 de 2025), o null si no se pasa. */
export function avisoLimiteExtras({ dias, semanas }: ResultadoTurnos['excesoLimite']): string | null {
  if (!dias.length && !semanas.length) return null;
  const partes = [
    dias.length ? `${dias.length} ${dias.length === 1 ? 'día' : 'días'} con más de 2 horas extra` : '',
    semanas.length ? `${semanas.length} ${semanas.length === 1 ? 'semana' : 'semanas'} con más de 12` : '',
  ].filter(Boolean).join(' y ');
  return `Tienes ${partes}. La ley no permite pasar de 2 horas extra al día ni de 12 a la semana (CST, art. 167A). Aun así, toda hora extra trabajada se debe pagar. Los sectores de seguridad privada y salud están exceptuados.`;
}

/** Valor de horas escritas a mano (calculadora de administrativos), con los factores de la fecha indicada. */
export function valorarHoras(horas: Horas, valorHora: number, fechaISO: string): Record<TipoHora, number> {
  const v = horasVacias();
  (Object.keys(horas) as TipoHora[]).forEach((t) => (v[t] = horas[t] * valorHora * factorHora(t, fechaISO)));
  return v;
}

// ---------------------------------------------------------------- nómina

export interface Novedades {
  incapacidad: number;
  vacaciones: number;
  ausencia: number;
  permisoRemunerado: number;
  permisoNoRemunerado: number;
}
export const novedadesVacias = (): Novedades => ({ incapacidad: 0, vacaciones: 0, ausencia: 0, permisoRemunerado: 0, permisoNoRemunerado: 0 });

export interface OtrosConceptos {
  auxiliosNoSalariales: number;
  bonificacionesSalariales: number;
  bonificacionesNoSalariales: number;
  anticipos: number;
  prestamos: number;
  otrosDescuentos: number;
}
export const otrosVacios = (): OtrosConceptos => ({
  auxiliosNoSalariales: 0, bonificacionesSalariales: 0, bonificacionesNoSalariales: 0, anticipos: 0, prestamos: 0, otrosDescuentos: 0,
});

export interface Linea { clave: string; nombre: string; valor: number; detalle?: string; norma?: string }

export interface Desprendible {
  devengados: Linea[];
  deducciones: Linea[];
  totalDevengado: number;
  totalDeducciones: number;
  neto: number;
  ibc: number;
  excesoNoSalarial: number;
  valorHora: number;
  aplicaAuxilio: boolean;
  avisos: string[];
}

export interface DatosNomina {
  salarioMensual: number;
  diasPeriodo: number; // 30 mensual, 15 quincena
  fechaReferencia: string; // para recargos y avisos
  horasMes: number;
  novedades: Novedades;
  /** Valor ya calculado de recargos y extras del período. */
  horasValoradas: { horas: Horas; valores: Record<TipoHora, number> };
  otros: OtrosConceptos;
}

const pesos = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;
const dec = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 2 });

export function calcularNomina(d: DatosNomina, v = VALORES_2026): Desprendible {
  const avisos: string[] = [];
  const diario = d.salarioMensual / 30;
  const valorHora = d.salarioMensual / d.horasMes;
  const n = d.novedades;
  const diasNoLaborados = n.incapacidad + n.vacaciones + n.ausencia + n.permisoRemunerado + n.permisoNoRemunerado;
  const diasLaborados = Math.max(0, d.diasPeriodo - diasNoLaborados);
  if (diasNoLaborados > d.diasPeriodo) avisos.push(`Las novedades suman ${diasNoLaborados} días, más que los ${d.diasPeriodo} del período.`);

  const devengados: Linea[] = [];
  const add = (l: Linea) => { if (l.valor) devengados.push(l); };
  add({ clave: 'salario', nombre: `Salario (${dec(diasLaborados)} días laborados)`, valor: (d.salarioMensual * diasLaborados) / 30, detalle: `${pesos(diario)} por día` });
  add({ clave: 'vacaciones', nombre: `Vacaciones (${dec(n.vacaciones)} días)`, valor: diario * n.vacaciones, detalle: 'Se pagan con el salario ordinario', norma: 'CST, art. 192' });
  add({ clave: 'permiso', nombre: `Permiso remunerado (${dec(n.permisoRemunerado)} días)`, valor: diario * n.permisoRemunerado, norma: 'CST, art. 57' });
  if (n.incapacidad > 0) {
    // 2/3 del salario, sin bajar del mínimo diario; el empleador paga los dos primeros días y la EPS los siguientes.
    const valorDia = Math.max((diario * 2) / 3, v.salarioMinimo / 30);
    const empleador = Math.min(2, n.incapacidad);
    add({ clave: 'incapacidad_empleador', nombre: `Incapacidad, a cargo del empleador (${dec(empleador)} días)`, valor: valorDia * empleador, detalle: `${pesos(valorDia)} por día: 2/3 del salario, sin bajar del mínimo`, norma: 'CST, art. 227; Decreto 2943 de 2013' });
    add({ clave: 'incapacidad_eps', nombre: `Incapacidad, a cargo de la EPS (${dec(n.incapacidad - empleador)} días)`, valor: valorDia * (n.incapacidad - empleador), detalle: 'La EPS reembolsa o paga estos días', norma: 'CST, art. 227; Decreto 2943 de 2013' });
    avisos.push('La incapacidad se estima por enfermedad general. Si es por accidente de trabajo o enfermedad laboral, se paga al 100 % y la asume la ARL.');
  }
  if (n.ausencia || n.permisoNoRemunerado) {
    avisos.push(`No se pagan ${dec(n.ausencia + n.permisoNoRemunerado)} días de ausencia o permiso no remunerado. Una ausencia sin justa causa también puede hacerte perder el pago del domingo (CST, art. 173).`);
  }

  TIPOS_HORA.forEach(({ tipo, nombre }) => {
    const h = d.horasValoradas.horas[tipo];
    if (h > 0) add({ clave: tipo, nombre: `${nombre} (${dec(h)} h)`, valor: d.horasValoradas.valores[tipo], detalle: `${dec(h)} h × ${pesos(valorHora)} × factor`, norma: tipo.startsWith('H') ? 'CST, arts. 168 y 179' : 'CST, arts. 168 y 179' });
  });

  const recargosYExtras = Object.values(d.horasValoradas.valores).reduce((s, x) => s + x, 0);
  // Auxilio de transporte: hasta 2 salarios mínimos, solo por días laborados (Decreto 1470 de 2025).
  const aplicaAuxilio = d.salarioMensual <= 2 * v.salarioMinimo;
  if (aplicaAuxilio) add({ clave: 'auxilio', nombre: `Auxilio de transporte (${dec(diasLaborados)} días)`, valor: (v.auxilioTransporte * diasLaborados) / 30, detalle: `${pesos(v.auxilioTransporte)} al mes`, norma: 'Decreto 1470 de 2025' });
  add({ clave: 'bonif_salariales', nombre: 'Bonificaciones y comisiones salariales', valor: d.otros.bonificacionesSalariales, norma: 'CST, art. 127' });
  add({ clave: 'auxilios_no_salariales', nombre: 'Otros auxilios no salariales', valor: d.otros.auxiliosNoSalariales });
  add({ clave: 'bonif_no_salariales', nombre: 'Bonificaciones no salariales', valor: d.otros.bonificacionesNoSalariales });

  // Base de cotización: pagos salariales + exceso de los no salariales sobre el 40 % del total (Ley 1393 de 2010, art. 30).
  const salariales = devengados.filter((l) => !['auxilio', 'auxilios_no_salariales', 'bonif_no_salariales'].includes(l.clave)).reduce((s, l) => s + l.valor, 0);
  const noSalariales = d.otros.auxiliosNoSalariales + d.otros.bonificacionesNoSalariales;
  const excesoNoSalarial = Math.max(0, noSalariales - 0.4 * (salariales + noSalariales));
  const diasCotizables = Math.max(0, d.diasPeriodo - n.ausencia - n.permisoNoRemunerado);
  const ibc = Math.max(salariales + excesoNoSalarial, (v.salarioMinimo * diasCotizables) / 30);
  const ibcMensual = (ibc * 30) / d.diasPeriodo;

  const deducciones: Linea[] = [];
  const sub = (l: Linea) => { if (l.valor) deducciones.push(l); };
  sub({ clave: 'salud', nombre: 'Salud (4 %)', valor: ibc * 0.04, detalle: `4 % de ${pesos(ibc)}`, norma: 'Ley 100 de 1993, art. 204' });
  sub({ clave: 'pension', nombre: 'Pensión (4 %)', valor: ibc * 0.04, detalle: `4 % de ${pesos(ibc)}`, norma: 'Ley 100 de 1993, art. 20' });
  const fsp = fondoSolidaridad(ibcMensual, v.salarioMinimo);
  if (fsp > 0) sub({ clave: 'fsp', nombre: `Fondo de Solidaridad Pensional (${dec(fsp * 100)} %)`, valor: ibc * fsp, detalle: `${dec(fsp * 100)} % de ${pesos(ibc)}`, norma: 'Ley 100 de 1993, art. 27' });
  sub({ clave: 'anticipos', nombre: 'Anticipos de nómina', valor: d.otros.anticipos });
  sub({ clave: 'prestamos', nombre: 'Préstamos o libranzas', valor: d.otros.prestamos, detalle: 'Solo con tu autorización escrita', norma: 'CST, art. 59' });
  sub({ clave: 'otros', nombre: 'Otros descuentos autorizados', valor: d.otros.otrosDescuentos, norma: 'CST, art. 59' });

  if (excesoNoSalarial > 0) avisos.push(`Tus pagos no salariales superan el 40 % del total: ${pesos(excesoNoSalarial)} se suman a la base de cotización (Ley 1393 de 2010, art. 30). La interpretación de esta regla ha sido discutida; revisa tu caso.`);
  const ingresosMes = ((salariales + noSalariales) * 30) / d.diasPeriodo;
  if (ingresosMes > 95 * UVT_2026) avisos.push(`Tus ingresos del mes superan 95 UVT (${pesos(95 * UVT_2026)}): puede aplicar retención en la fuente, que no se calcula aquí (Estatuto Tributario, art. 383).`);
  if (recargosYExtras > 0) avisos.push(`El valor de la hora se calcula con ${d.horasMes} horas al mes (42 h semanales ÷ 6 × 30). Algunas empresas usan otro divisor.`);

  const r = (l: Linea): Linea => ({ ...l, valor: Math.round(l.valor) });
  const dev = devengados.map(r);
  const ded = deducciones.map(r);
  const totalDevengado = dev.reduce((s, l) => s + l.valor, 0);
  const totalDeducciones = ded.reduce((s, l) => s + l.valor, 0);
  return { devengados: dev, deducciones: ded, totalDevengado, totalDeducciones, neto: totalDevengado - totalDeducciones, ibc: Math.round(ibc), excesoNoSalarial: Math.round(excesoNoSalarial), valorHora, aplicaAuxilio, avisos };
}

/** Porcentaje adicional al Fondo de Solidaridad Pensional según el ingreso mensual (Ley 100 de 1993, art. 27). */
export function fondoSolidaridad(ibcMensual: number, smmlv: number): number {
  const veces = ibcMensual / smmlv;
  if (veces < 4) return 0;
  if (veces < 16) return 0.01;
  if (veces < 17) return 0.012;
  if (veces < 18) return 0.014;
  if (veces < 19) return 0.016;
  if (veces < 20) return 0.018;
  return 0.02;
}

// ---------------------------------------------------------------- por días

export interface DatosPorDias {
  valorDia: number;
  horasJornada: number;
  turnos: Turno[];
  cotizacion: 'ordinaria' | 'semanas';
  otrosIngresos: number;
  otrosDescuentos: number;
}

export function calcularPorDias(d: DatosPorDias, v = VALORES_2026): Desprendible & { dias: number; horas: ResultadoTurnos } {
  const avisos: string[] = [];
  const dias = new Set(d.turnos.map((t) => t.fecha)).size;
  const valorHora = d.valorDia / d.horasJornada;
  const t = calcularTurnos(d.turnos, valorHora, { modo: 'diario', horasJornada: d.horasJornada });
  const limite = avisoLimiteExtras(t.excesoLimite);
  if (limite) avisos.push(limite);
  const devengados: Linea[] = [];
  const add = (l: Linea) => { if (l.valor) devengados.push(l); };
  add({ clave: 'jornadas', nombre: `Jornadas (${dias} días)`, valor: d.valorDia * dias, detalle: `${pesos(d.valorDia)} por día` });
  TIPOS_HORA.forEach(({ tipo, nombre }) => {
    const h = t.horas[tipo];
    if (h > 0) add({ clave: tipo, nombre: `${nombre} (${dec(h)} h)`, valor: t.valores[tipo], detalle: `${dec(h)} h × ${pesos(valorHora)} × factor`, norma: 'CST, arts. 168 y 179' });
  });
  const aplicaAuxilio = d.valorDia * 30 <= 2 * v.salarioMinimo;
  if (aplicaAuxilio) add({ clave: 'auxilio', nombre: `Auxilio de transporte (${dias} días)`, valor: (v.auxilioTransporte * dias) / 30, norma: 'Decreto 1470 de 2025' });
  add({ clave: 'otros', nombre: 'Otros ingresos', valor: d.otrosIngresos });

  const salariales = devengados.filter((l) => l.clave !== 'auxilio' && l.clave !== 'otros').reduce((s, l) => s + l.valor, 0);
  const deducciones: Linea[] = [];
  let ibc: number;
  if (d.cotizacion === 'semanas' && salariales < v.salarioMinimo && dias < 30) {
    // Cotización por semanas: solo pensión, sobre 1 a 4 cuartos de salario mínimo (Decreto 2616 de 2013, arts. 5 y 6).
    const semanas = dias <= 7 ? 1 : dias <= 14 ? 2 : dias <= 21 ? 3 : 4;
    ibc = (v.salarioMinimo / 4) * semanas;
    deducciones.push({ clave: 'pension', nombre: `Pensión (4 % de ${semanas} cotización${semanas > 1 ? 'es' : ''} mínima${semanas > 1 ? 's' : ''} semanal${semanas > 1 ? 'es' : ''})`, valor: ibc * 0.04, detalle: `4 % de ${pesos(ibc)}`, norma: 'Decreto 2616 de 2013, art. 6' });
    avisos.push('En la cotización por semanas no hay descuento de salud: la cobertura en salud depende de tu afiliación (por ejemplo, como beneficiario o en el régimen subsidiado).');
  } else {
    if (d.cotizacion === 'semanas') avisos.push('La cotización por semanas solo aplica si trabajas menos de 30 días y ganas menos de un salario mínimo en el mes. Se usó la cotización ordinaria.');
    ibc = Math.max(salariales, v.salarioMinimo);
    deducciones.push({ clave: 'salud', nombre: 'Salud (4 %)', valor: ibc * 0.04, detalle: `4 % de ${pesos(ibc)}`, norma: 'Ley 100 de 1993, art. 204' });
    deducciones.push({ clave: 'pension', nombre: 'Pensión (4 %)', valor: ibc * 0.04, detalle: `4 % de ${pesos(ibc)}`, norma: 'Ley 100 de 1993, art. 20' });
    if (salariales < v.salarioMinimo) avisos.push(`En la cotización ordinaria la base mínima es un salario mínimo (${pesos(v.salarioMinimo)}), aunque hayas ganado menos.`);
  }
  if (d.otrosDescuentos) deducciones.push({ clave: 'otros_desc', nombre: 'Otros descuentos', valor: d.otrosDescuentos, norma: 'CST, art. 59' });
  avisos.push('Los trabajadores por días también tienen derecho, en proporción, a prima, cesantías y vacaciones (CST, art. 306).');

  const r = (l: Linea): Linea => ({ ...l, valor: Math.round(l.valor) });
  const dev = devengados.map(r);
  const ded = deducciones.map(r);
  const totalDevengado = dev.reduce((s, l) => s + l.valor, 0);
  const totalDeducciones = ded.reduce((s, l) => s + l.valor, 0);
  return { devengados: dev, deducciones: ded, totalDevengado, totalDeducciones, neto: totalDevengado - totalDeducciones, ibc: Math.round(ibc), excesoNoSalarial: 0, valorHora, aplicaAuxilio, avisos, dias, horas: t };
}
