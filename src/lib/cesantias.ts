// Motor de cálculo de Cesantías e Intereses de Cesantías en Colombia.
// Ley 50 de 1990 y Ley 52 de 1975.
import { VALORES_2026 } from './liquidacion';

export interface DatosCesantias {
  salarioBase: number;
  promedioVariables: number;
  diasTrabajadosAnio: number; // Generalmente hasta 360 días
  incluyeAuxilioTransporte?: boolean;
}

export interface ResultadoCesantias {
  baseCalculo: number;
  auxilioTransporte: number;
  diasTrabajados: number;
  cesantias: number;
  interesesCesantias: number;
  total: number;
  fechaLimiteFondo: string;
  fechaLimiteIntereses: string;
  avisos: string[];
}

export function calcularCesantias(d: DatosCesantias, v = VALORES_2026): ResultadoCesantias {
  const avisos: string[] = [];
  const dias = Math.max(0, Math.min(360, d.diasTrabajadosAnio));
  const salarioTotal = d.salarioBase + d.promedioVariables;
  const tieneDerechoAuxilio = d.incluyeAuxilioTransporte ?? (d.salarioBase <= 2 * v.salarioMinimo);
  const auxilio = tieneDerechoAuxilio ? v.auxilioTransporte : 0;
  const baseCalculo = salarioTotal + auxilio;

  // Cesantías: (Salario base × Días trabajados) ÷ 360
  const cesantias = Math.round((baseCalculo * dias) / 360);

  // Intereses de cesantías: (Cesantías × Días trabajados × 12%) ÷ 360
  const interesesCesantias = Math.round((cesantias * dias * 0.12) / 360);

  const total = cesantias + interesesCesantias;

  if (dias < 360) {
    avisos.push(`Cálculo proporcional para ${dias} días de labores en el año.`);
  }

  return {
    baseCalculo,
    auxilioTransporte: auxilio,
    diasTrabajados: dias,
    cesantias,
    interesesCesantias,
    total,
    fechaLimiteFondo: '14 de febrero (consignación al Fondo de Cesantías)',
    fechaLimiteIntereses: '31 de enero (pago directo al trabajador en nómina)',
    avisos,
  };
}
