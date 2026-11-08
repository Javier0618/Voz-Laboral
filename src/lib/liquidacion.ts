// Calculadora orientativa de liquidación de un contrato de trabajo en Colombia.
// Convención 30/360 (meses de 30 días, año de 360), la usual en nómina.
// Cada regla cita su norma; los valores de referencia están verificados en el
// texto oficial (ver VALORES_2026).

export const VALORES_2026 = {
  anio: 2026,
  salarioMinimo: 1_750_905, // Decreto 1469 de 2025 (suspensión levantada por el Consejo de Estado el 9/07/2026)
  auxilioTransporte: 249_095, // Decreto 1470 de 2025
} as const;

export type ValoresAnio = { anio: number; salarioMinimo: number; auxilioTransporte: number; decretoSalario: string; decretoAuxilio: string };

/** Salario mínimo y auxilio de transporte de cada año, verificados en el texto de cada decreto (compilación de Colpensiones). */
export const VALORES_POR_ANIO: Record<number, ValoresAnio> = {
  2020: { anio: 2020, salarioMinimo: 877_803, auxilioTransporte: 102_854, decretoSalario: 'Decreto 2360 de 2019', decretoAuxilio: 'Decreto 2361 de 2019' },
  2021: { anio: 2021, salarioMinimo: 908_526, auxilioTransporte: 106_454, decretoSalario: 'Decreto 1785 de 2020', decretoAuxilio: 'Decreto 1786 de 2020' },
  2022: { anio: 2022, salarioMinimo: 1_000_000, auxilioTransporte: 117_172, decretoSalario: 'Decreto 1724 de 2021', decretoAuxilio: 'Decreto 1725 de 2021' },
  2023: { anio: 2023, salarioMinimo: 1_160_000, auxilioTransporte: 140_606, decretoSalario: 'Decreto 2613 de 2022', decretoAuxilio: 'Decreto 2614 de 2022' },
  2024: { anio: 2024, salarioMinimo: 1_300_000, auxilioTransporte: 162_000, decretoSalario: 'Decreto 2292 de 2023', decretoAuxilio: 'Decreto 2293 de 2023' },
  2025: { anio: 2025, salarioMinimo: 1_423_500, auxilioTransporte: 200_000, decretoSalario: 'Decreto 1572 de 2024', decretoAuxilio: 'Decreto 1573 de 2024' },
  2026: { anio: 2026, salarioMinimo: VALORES_2026.salarioMinimo, auxilioTransporte: VALORES_2026.auxilioTransporte, decretoSalario: 'Decreto 1469 de 2025', decretoAuxilio: 'Decreto 1470 de 2025' },
};
export const PRIMER_ANIO = 2020;
export const ULTIMO_ANIO = 2026;

/** Valores de un año. Si aún no se conocen (o son anteriores a la tabla), usa el año conocido más cercano y lo marca. */
export function valoresDe(anio: number): ValoresAnio & { aproximado: boolean } {
  const conocido = VALORES_POR_ANIO[anio];
  if (conocido) return { ...conocido, aproximado: false };
  const cercano = VALORES_POR_ANIO[anio > ULTIMO_ANIO ? ULTIMO_ANIO : PRIMER_ANIO];
  return { ...cercano, anio, aproximado: true };
}

export type TipoContrato = 'indefinido' | 'fijo';
export type MotivoRetiro = 'renuncia' | 'despido_sin_justa_causa' | 'despido_justa_causa' | 'fin_plazo';

export interface DatosLiquidacion {
  tipoContrato: TipoContrato;
  motivo: MotivoRetiro;
  fechaIngreso: string; // AAAA-MM-DD
  fechaRetiro: string;
  /** Solo contrato a término fijo despedido sin justa causa: fecha en que vencía el contrato. */
  fechaFinPactada?: string;
  salarioMensual: number;
  /** Promedio mensual de horas extra, recargos y comisiones (pagos salariales variables). */
  variableMensual: number;
  /** Base mensual de vacaciones informada por el usuario: salario fijo vigente o promedio pertinente si es variable. Sin auxilio de transporte. */
  baseVacacionesMensual?: number;
  diasVacacionesDisfrutados: number;
  diasSalarioPendiente: number;
  /**
   * Salario fijo de cada año del contrato. Si falta un año, se usa `salarioMensual`.
   * `salarioMensual` es siempre el último salario: con él se pagan las vacaciones, el salario pendiente y la indemnización.
   */
  salarioPorAnio?: Record<number, number>;
  /** Las cesantías de años anteriores nunca se consignaron: se pagan en la liquidación con sus intereses (Ley 50 de 1990, art. 99, num. 4). */
  incluirCesantiasAnteriores?: boolean;
  /** Las primas de semestres anteriores no se pagaron. */
  incluirPrimasAnteriores?: boolean;
}

/** Lo causado en cada año del contrato, con el salario mínimo y el auxilio de ese año. */
export interface FilaAnio {
  anio: number;
  dias: number;
  salario: number;
  auxilio: number;
  base: number;
  cesantias: number;
  intereses: number;
  prima: number;
  /** Prima de semestres ya vencidos (pagada en junio o diciembre, en principio). */
  primaAnterior: number;
  /** El año en que termina el contrato: sus cesantías van en la liquidación. */
  esUltimo: boolean;
  /** Los valores del año no están en la tabla: se usaron los del año conocido más cercano. */
  aproximado: boolean;
}

export interface Concepto { clave: string; nombre: string; valor: number; detalle: string; norma: string }

export interface ResultadoLiquidacion {
  aplicaAuxilio: boolean;
  diasLaborados: number;
  conceptos: Concepto[];
  deducciones: Concepto[];
  totalConceptos: number;
  totalDeducciones: number;
  neto: number;
  avisos: string[];
  porAnio: FilaAnio[];
}

/** Días entre dos fechas, ambas incluidas, con la convención 30/360. */
export function dias360(desde: string, hasta: string): number {
  const [y1, m1, d1] = desde.split('-').map(Number);
  const [y2, m2, d2] = hasta.split('-').map(Number);
  const finDeMes = (y: number, m: number, d: number) => d === new Date(y, m, 0).getDate();
  const a = d1 === 31 || (m1 === 2 && finDeMes(y1, m1, d1)) ? 30 : d1;
  const b = d2 === 31 || (m2 === 2 && finDeMes(y2, m2, d2)) ? 30 : d2;
  return (y2 - y1) * 360 + (m2 - m1) * 30 + (b - a) + 1;
}

const mayor = (a: string, b: string) => (a > b ? a : b);
const menor = (a: string, b: string) => (a < b ? a : b);
const redondear = (n: number) => Math.round(n);
const pesos = (n: number) => `$${redondear(n).toLocaleString('es-CO')}`;
const decimal = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 2 });

/** Valida los datos y devuelve los errores por campo (vacío si todo es correcto). */
export function validarLiquidacion(d: DatosLiquidacion): Record<string, string> {
  const e: Record<string, string> = {};
  const fecha = (iso: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
    const [y, m, dia] = iso.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1, dia));
    return d.getUTCFullYear() === y && d.getUTCMonth() === m - 1 && d.getUTCDate() === dia;
  };
  if (!fecha(d.fechaIngreso)) e.fechaIngreso = 'Indica una fecha de ingreso válida.';
  if (!fecha(d.fechaRetiro)) e.fechaRetiro = 'Indica una fecha de retiro válida.';
  else if (fecha(d.fechaIngreso) && d.fechaRetiro < d.fechaIngreso) e.fechaRetiro = 'La fecha de retiro no puede ser anterior a la de ingreso.';
  if (!(d.salarioMensual > 0)) e.salarioMensual = 'Indica tu salario mensual.';
  if (d.salarioPorAnio && Object.values(d.salarioPorAnio).some((x) => !(x > 0))) e.salarioPorAnio = 'Indica el salario de cada año.';
  if (!Number.isFinite(d.variableMensual) || d.variableMensual < 0) e.variableMensual = 'Indica un promedio válido, sin valores negativos.';
  if (d.baseVacacionesMensual !== undefined && (!Number.isFinite(d.baseVacacionesMensual) || d.baseVacacionesMensual <= 0)) e.baseVacacionesMensual = 'Indica una base mensual de vacaciones válida.';
  if (d.diasVacacionesDisfrutados < 0) e.diasVacacionesDisfrutados = 'No puede ser negativo.';
  if (d.diasSalarioPendiente < 0 || d.diasSalarioPendiente > 30) e.diasSalarioPendiente = 'Indica entre 0 y 30 días.';
  if (d.tipoContrato === 'indefinido' && d.motivo === 'fin_plazo') e.motivo = 'El vencimiento del plazo solo aplica a contratos a término fijo.';
  if (d.tipoContrato === 'fijo' && d.motivo === 'despido_sin_justa_causa') {
    if (!d.fechaFinPactada || !fecha(d.fechaFinPactada)) e.fechaFinPactada = 'Indica la fecha en que vencía tu contrato.';
    else if (d.fechaFinPactada <= d.fechaRetiro) e.fechaFinPactada = 'Debe ser posterior a la fecha de retiro.';
  }
  return e;
}

/**
 * Lo causado en cada año calendario del contrato. Cada año usa su propio
 * salario y el salario mínimo y el auxilio de transporte de ese año: el 31 de
 * diciembre se liquidan las cesantías del año (Ley 50 de 1990, art. 99, num. 1).
 */
export function liquidacionPorAnio(d: DatosLiquidacion): FilaAnio[] {
  const filas: FilaAnio[] = [];
  const anioIngreso = Number(d.fechaIngreso.slice(0, 4));
  const anioRetiro = Number(d.fechaRetiro.slice(0, 4));
  const inicioSemestre = Number(d.fechaRetiro.slice(5, 7)) <= 6 ? `${anioRetiro}-01-01` : `${anioRetiro}-07-01`;
  for (let anio = anioIngreso; anio <= anioRetiro; anio++) {
    const desde = mayor(`${anio}-01-01`, d.fechaIngreso);
    const hasta = menor(`${anio}-12-31`, d.fechaRetiro);
    if (hasta < desde) continue;
    const val = valoresDe(anio);
    const salario = d.salarioPorAnio?.[anio] ?? d.salarioMensual;
    // Auxilio de transporte: hasta 2 salarios mínimos del año. Se suma a la base de cesantías, intereses y prima, no a la de vacaciones (Ley 1 de 1963, art. 7).
    const auxilio = salario + d.variableMensual <= 2 * val.salarioMinimo ? val.auxilioTransporte : 0;
    const base = salario + d.variableMensual + auxilio;
    const dias = dias360(desde, hasta);
    const cesantias = (base * dias) / 360;
    // Prima por semestre (CST, art. 306): la del semestre en que termina el contrato va en la liquidación; las anteriores ya vencieron.
    let prima = 0;
    let primaAnterior = 0;
    for (const [ini, fin] of [[`${anio}-01-01`, `${anio}-06-30`], [`${anio}-07-01`, `${anio}-12-31`]]) {
      const a = mayor(ini, desde);
      const b = menor(fin, hasta);
      if (b < a) continue;
      const valor = (base * dias360(a, b)) / 360;
      if (ini >= inicioSemestre) prima += valor;
      else primaAnterior += valor;
    }
    filas.push({
      anio, dias, salario, auxilio, base, cesantias,
      intereses: (cesantias * dias * 0.12) / 360,
      prima, primaAnterior, esUltimo: anio === anioRetiro, aproximado: val.aproximado,
    });
  }
  return filas;
}

export function calcularLiquidacion(d: DatosLiquidacion): ResultadoLiquidacion {
  const avisos: string[] = [];
  const anioRetiro = Number(d.fechaRetiro.slice(0, 4));
  const v = valoresDe(anioRetiro);
  const porAnio = liquidacionPorAnio(d);
  const ultimo = porAnio[porAnio.length - 1];
  const anteriores = porAnio.filter((f) => !f.esUltimo);
  const aproximados = porAnio.filter((f) => f.aproximado).map((f) => f.anio);
  if (aproximados.length) {
    avisos.push(`Para ${aproximados.join(', ')} todavía no tenemos el salario mínimo y el auxilio de transporte: se usaron los del año conocido más cercano. El resultado puede variar.`);
  }

  const devengado = d.salarioMensual + d.variableMensual;
  const aplicaAuxilio = ultimo.auxilio > 0;
  const diasLaborados = dias360(d.fechaIngreso, d.fechaRetiro);

  // Cesantías e intereses del año en que termina el contrato.
  const diasCesantias = ultimo.dias;
  const cesantias = ultimo.cesantias;
  const intereses = ultimo.intereses;
  const basePrestaciones = ultimo.base;

  // Prima del semestre en curso (CST, art. 306).
  const inicioSemestre = Number(d.fechaRetiro.slice(5, 7)) <= 6 ? `${anioRetiro}-01-01` : `${anioRetiro}-07-01`;
  const diasPrima = dias360(mayor(inicioSemestre, d.fechaIngreso), d.fechaRetiro);
  const prima = ultimo.prima;

  // Vacaciones: 15 días hábiles por año, proporcionales al retiro (CST art. 186; Ley 995 de 2005).
  const diasVacacionesCausados = (diasLaborados * 15) / 360;
  const diasVacacionesPendientes = Math.max(0, diasVacacionesCausados - d.diasVacacionesDisfrutados);
  const baseVacaciones = d.baseVacacionesMensual ?? d.salarioMensual;
  const vacaciones = (baseVacaciones * diasVacacionesPendientes) / 30;
  if (d.variableMensual > 0 && d.baseVacacionesMensual === undefined) {
    avisos.push('Se usó el salario fijo para estimar las vacaciones. Si tienes salario variable (por ejemplo, comisiones), introduce la base mensual de vacaciones para obtener una estimación más precisa. No incluyas el auxilio de transporte.');
  }

  // Multiplicar antes de dividir evita errores de redondeo (124.547,50 y no 124.547,4999…).
  const salarioPendiente = (d.salarioMensual * d.diasSalarioPendiente) / 30;
  const auxilioPendiente = aplicaAuxilio ? (v.auxilioTransporte * d.diasSalarioPendiente) / 30 : 0;

  const conceptos: Concepto[] = [
    { clave: 'cesantias', nombre: `Cesantías de ${anioRetiro}`, valor: cesantias, detalle: `${pesos(basePrestaciones)} × ${diasCesantias} días ÷ 360`, norma: 'CST, art. 249' },
    { clave: 'intereses', nombre: `Intereses de las cesantías de ${anioRetiro} (12 % anual)`, valor: intereses, detalle: `${pesos(cesantias)} × ${diasCesantias} días × 12 % ÷ 360`, norma: 'Ley 50 de 1990, art. 99' },
    { clave: 'prima', nombre: `Prima del ${inicioSemestre.endsWith('01-01') ? 'primer' : 'segundo'} semestre de ${anioRetiro}`, valor: prima, detalle: `${pesos(basePrestaciones)} × ${diasPrima} días ÷ 360`, norma: 'CST, art. 306' },
    { clave: 'vacaciones', nombre: 'Vacaciones pendientes', valor: vacaciones, detalle: `${decimal(diasVacacionesPendientes)} días × ${pesos(baseVacaciones / 30)} por día`, norma: 'CST, arts. 186, 189 y 192; Ley 995 de 2005' },
  ];
  if (anteriores.length && d.incluirCesantiasAnteriores) {
    const detalle = anteriores.map((f) => `${f.anio}: ${pesos(f.cesantias)}`).join('; ');
    conceptos.push({ clave: 'cesantias_anteriores', nombre: 'Cesantías de años anteriores no consignadas', valor: anteriores.reduce((s, f) => s + f.cesantias, 0), detalle, norma: 'Ley 50 de 1990, art. 99, num. 4' });
    conceptos.push({ clave: 'intereses_anteriores', nombre: 'Intereses de las cesantías de años anteriores', valor: anteriores.reduce((s, f) => s + f.intereses, 0), detalle: anteriores.map((f) => `${f.anio}: ${pesos(f.intereses)}`).join('; '), norma: 'Ley 50 de 1990, art. 99, num. 4' });
    avisos.push('Si tu empleador no consignó las cesantías antes del 15 de febrero del año siguiente, también debe pagarte un día de salario por cada día de retraso (Ley 50 de 1990, art. 99, num. 3). Esa sanción no se calcula aquí: la decide un juez.');
  } else if (anteriores.length) {
    avisos.push(`Las cesantías de ${anteriores.map((f) => f.anio).join(' y ')} debieron consignarse en tu fondo antes del 15 de febrero del año siguiente, por eso no se suman. Revisa tu extracto: si no aparecen, marca la opción para incluirlas.`);
  }
  const primasAnteriores = porAnio.reduce((s, f) => s + f.primaAnterior, 0);
  if (primasAnteriores > 0 && d.incluirPrimasAnteriores) {
    conceptos.push({ clave: 'primas_anteriores', nombre: 'Primas de semestres anteriores no pagadas', valor: primasAnteriores, detalle: porAnio.filter((f) => f.primaAnterior > 0).map((f) => `${f.anio}: ${pesos(f.primaAnterior)}`).join('; '), norma: 'CST, art. 306' });
  }

  if (d.diasSalarioPendiente > 0) {
    conceptos.push({ clave: 'salario', nombre: 'Salario pendiente', valor: salarioPendiente, detalle: `${d.diasSalarioPendiente} días × ${pesos(d.salarioMensual / 30)}`, norma: 'CST, art. 57' });
    if (aplicaAuxilio) conceptos.push({ clave: 'auxilio', nombre: 'Auxilio de transporte pendiente', valor: auxilioPendiente, detalle: `${d.diasSalarioPendiente} días × ${pesos(v.auxilioTransporte / 30)}`, norma: v.decretoAuxilio });
  }

  const indemnizacion = calcularIndemnizacion(d, devengado, diasLaborados, v, avisos);
  if (indemnizacion) conceptos.push(indemnizacion);

  // Aportes del trabajador sobre el salario pendiente (Ley 100 de 1993, arts. 20, 27 y 204).
  const deducciones: Concepto[] = [];
  if (salarioPendiente > 0) {
    deducciones.push({ clave: 'salud', nombre: 'Salud (4 %)', valor: salarioPendiente * 0.04, detalle: `4 % de ${pesos(salarioPendiente)}`, norma: 'Ley 100 de 1993, art. 204' });
    deducciones.push({ clave: 'pension', nombre: 'Pensión (4 %)', valor: salarioPendiente * 0.04, detalle: `4 % de ${pesos(salarioPendiente)}`, norma: 'Ley 100 de 1993, art. 20' });
    if (devengado >= 4 * v.salarioMinimo) {
      deducciones.push({ clave: 'solidaridad', nombre: 'Fondo de Solidaridad Pensional (1 %)', valor: salarioPendiente * 0.01, detalle: `1 % de ${pesos(salarioPendiente)}`, norma: 'Ley 100 de 1993, art. 27' });
      if (devengado >= 16 * v.salarioMinimo) avisos.push('Con ingresos desde 16 salarios mínimos el aporte al Fondo de Solidaridad es mayor; no se calcula aquí.');
    }
  }

  const r = (c: Concepto): Concepto => ({ ...c, valor: redondear(c.valor) });
  const conceptosR = conceptos.map(r);
  const deduccionesR = deducciones.map(r);
  const totalConceptos = conceptosR.reduce((s, c) => s + c.valor, 0);
  const totalDeducciones = deduccionesR.reduce((s, c) => s + c.valor, 0);
  avisos.push('No incluye la retención en la fuente, que depende de tu situación tributaria.');
  return { aplicaAuxilio, diasLaborados, conceptos: conceptosR, deducciones: deduccionesR, totalConceptos, totalDeducciones, neto: totalConceptos - totalDeducciones, avisos, porAnio };
}

/** Indemnización por despido sin justa causa (CST, art. 64). */
function calcularIndemnizacion(d: DatosLiquidacion, devengado: number, diasLaborados: number, v: ValoresAnio, avisos: string[]): Concepto | null {
  if (d.motivo !== 'despido_sin_justa_causa') return null;
  const diario = devengado / 30;
  if (d.tipoContrato === 'fijo') {
    // Salarios del tiempo que faltaba para cumplir el plazo pactado.
    const siguiente = new Date(`${d.fechaRetiro}T00:00:00`);
    siguiente.setDate(siguiente.getDate() + 1);
    const desde = `${siguiente.getFullYear()}-${String(siguiente.getMonth() + 1).padStart(2, '0')}-${String(siguiente.getDate()).padStart(2, '0')}`;
    const faltantes = dias360(desde, d.fechaFinPactada!);
    return { clave: 'indemnizacion', nombre: 'Indemnización por despido sin justa causa', valor: diario * faltantes, detalle: `${faltantes} días que faltaban del contrato × ${pesos(diario)}`, norma: 'CST, art. 64' };
  }
  // Término indefinido: tabla según el salario (menos o desde 10 salarios mínimos).
  const alto = devengado >= 10 * v.salarioMinimo;
  const [primerAnio, porAnio] = alto ? [20, 15] : [30, 20];
  const diasIndemnizacion = primerAnio + (porAnio * Math.max(0, diasLaborados - 360)) / 360;
  if (d.fechaIngreso <= '1992-12-27') {
    avisos.push('Si tenías 10 o más años de servicio a finales de 2002, la ley prevé una tabla de indemnización distinta. Consulta tu caso.');
  }
  return {
    clave: 'indemnizacion',
    nombre: 'Indemnización por despido sin justa causa',
    valor: diario * diasIndemnizacion,
    detalle: `${decimal(diasIndemnizacion)} días (${primerAnio} el primer año y ${porAnio} por cada año adicional) × ${pesos(diario)}`,
    norma: 'CST, art. 64',
  };
}
