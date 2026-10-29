// Calculadora orientativa de liquidación de un contrato de trabajo en Colombia.
// Convención 30/360 (meses de 30 días, año de 360), la usual en nómina.
// Cada regla cita su norma; los valores de referencia están verificados en el
// texto oficial (ver VALORES_2026).

export const VALORES_2026 = {
  anio: 2026,
  salarioMinimo: 1_750_905, // Decreto 1469 de 2025 (suspensión levantada por el Consejo de Estado el 9/07/2026)
  auxilioTransporte: 249_095, // Decreto 1470 de 2025
} as const;

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
  diasVacacionesDisfrutados: number;
  diasSalarioPendiente: number;
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
const redondear = (n: number) => Math.round(n);
const pesos = (n: number) => `$${redondear(n).toLocaleString('es-CO')}`;
const decimal = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 2 });

/** Valida los datos y devuelve los errores por campo (vacío si todo es correcto). */
export function validarLiquidacion(d: DatosLiquidacion): Record<string, string> {
  const e: Record<string, string> = {};
  const fecha = /^\d{4}-\d{2}-\d{2}$/;
  if (!fecha.test(d.fechaIngreso)) e.fechaIngreso = 'Indica la fecha de ingreso.';
  if (!fecha.test(d.fechaRetiro)) e.fechaRetiro = 'Indica la fecha de retiro.';
  else if (fecha.test(d.fechaIngreso) && d.fechaRetiro < d.fechaIngreso) e.fechaRetiro = 'La fecha de retiro no puede ser anterior a la de ingreso.';
  if (!(d.salarioMensual > 0)) e.salarioMensual = 'Indica tu salario mensual.';
  if (d.variableMensual < 0) e.variableMensual = 'No puede ser negativo.';
  if (d.diasVacacionesDisfrutados < 0) e.diasVacacionesDisfrutados = 'No puede ser negativo.';
  if (d.diasSalarioPendiente < 0 || d.diasSalarioPendiente > 30) e.diasSalarioPendiente = 'Indica entre 0 y 30 días.';
  if (d.tipoContrato === 'indefinido' && d.motivo === 'fin_plazo') e.motivo = 'El vencimiento del plazo solo aplica a contratos a término fijo.';
  if (d.tipoContrato === 'fijo' && d.motivo === 'despido_sin_justa_causa') {
    if (!d.fechaFinPactada || !fecha.test(d.fechaFinPactada)) e.fechaFinPactada = 'Indica la fecha en que vencía tu contrato.';
    else if (d.fechaFinPactada <= d.fechaRetiro) e.fechaFinPactada = 'Debe ser posterior a la fecha de retiro.';
  }
  return e;
}

export function calcularLiquidacion(d: DatosLiquidacion, v = VALORES_2026): ResultadoLiquidacion {
  const avisos: string[] = [];
  const anioRetiro = Number(d.fechaRetiro.slice(0, 4));
  if (anioRetiro !== v.anio) {
    avisos.push(`Los valores de referencia (salario mínimo y auxilio de transporte) son de ${v.anio}. Si te retiraste otro año, el resultado puede variar.`);
  }

  const devengado = d.salarioMensual + d.variableMensual;
  // Auxilio de transporte: hasta 2 salarios mínimos (Decreto 1470 de 2025).
  const aplicaAuxilio = devengado <= 2 * v.salarioMinimo;
  // El auxilio se suma a la base de cesantías, intereses y prima, no a la de vacaciones (Ley 1 de 1963, art. 7).
  const basePrestaciones = devengado + (aplicaAuxilio ? v.auxilioTransporte : 0);
  const diasLaborados = dias360(d.fechaIngreso, d.fechaRetiro);

  // Cesantías del año en curso: se presume que las de años anteriores ya se consignaron (Ley 50 de 1990, art. 99).
  const inicioCesantias = mayor(`${anioRetiro}-01-01`, d.fechaIngreso);
  const diasCesantias = dias360(inicioCesantias, d.fechaRetiro);
  const cesantias = (basePrestaciones * diasCesantias) / 360;
  const intereses = (cesantias * diasCesantias * 0.12) / 360;

  // Prima del semestre en curso (CST, art. 306).
  const inicioSemestre = Number(d.fechaRetiro.slice(5, 7)) <= 6 ? `${anioRetiro}-01-01` : `${anioRetiro}-07-01`;
  const diasPrima = dias360(mayor(inicioSemestre, d.fechaIngreso), d.fechaRetiro);
  const prima = (basePrestaciones * diasPrima) / 360;

  // Vacaciones: 15 días hábiles por año, proporcionales al retiro (CST art. 186; Ley 995 de 2005).
  const diasVacacionesCausados = (diasLaborados * 15) / 360;
  const diasVacacionesPendientes = Math.max(0, diasVacacionesCausados - d.diasVacacionesDisfrutados);
  const vacaciones = (d.salarioMensual * diasVacacionesPendientes) / 30;
  if (d.variableMensual > 0) {
    avisos.push('Las vacaciones se calculan solo con el salario fijo. Si recibes comisiones, el valor real puede ser mayor.');
  }

  // Multiplicar antes de dividir evita errores de redondeo (124.547,50 y no 124.547,4999…).
  const salarioPendiente = (d.salarioMensual * d.diasSalarioPendiente) / 30;
  const auxilioPendiente = aplicaAuxilio ? (v.auxilioTransporte * d.diasSalarioPendiente) / 30 : 0;

  const conceptos: Concepto[] = [
    { clave: 'cesantias', nombre: 'Cesantías', valor: cesantias, detalle: `${pesos(basePrestaciones)} × ${diasCesantias} días ÷ 360`, norma: 'CST, art. 249' },
    { clave: 'intereses', nombre: 'Intereses de las cesantías (12 % anual)', valor: intereses, detalle: `${pesos(cesantias)} × ${diasCesantias} días × 12 % ÷ 360`, norma: 'Ley 50 de 1990, art. 99' },
    { clave: 'prima', nombre: 'Prima de servicios', valor: prima, detalle: `${pesos(basePrestaciones)} × ${diasPrima} días ÷ 360`, norma: 'CST, art. 306' },
    { clave: 'vacaciones', nombre: 'Vacaciones pendientes', valor: vacaciones, detalle: `${decimal(diasVacacionesPendientes)} días × ${pesos(d.salarioMensual / 30)} por día`, norma: 'CST, art. 186; Ley 995 de 2005' },
  ];
  if (d.diasSalarioPendiente > 0) {
    conceptos.push({ clave: 'salario', nombre: 'Salario pendiente', valor: salarioPendiente, detalle: `${d.diasSalarioPendiente} días × ${pesos(d.salarioMensual / 30)}`, norma: 'CST, art. 57' });
    if (aplicaAuxilio) conceptos.push({ clave: 'auxilio', nombre: 'Auxilio de transporte pendiente', valor: auxilioPendiente, detalle: `${d.diasSalarioPendiente} días × ${pesos(v.auxilioTransporte / 30)}`, norma: 'Decreto 1470 de 2025' });
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
  return { aplicaAuxilio, diasLaborados, conceptos: conceptosR, deducciones: deduccionesR, totalConceptos, totalDeducciones, neto: totalConceptos - totalDeducciones, avisos };
}

/** Indemnización por despido sin justa causa (CST, art. 64). */
function calcularIndemnizacion(d: DatosLiquidacion, devengado: number, diasLaborados: number, v: typeof VALORES_2026, avisos: string[]): Concepto | null {
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
