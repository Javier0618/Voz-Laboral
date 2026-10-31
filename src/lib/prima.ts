// Motor de cálculo de Prima de Servicios (CST, art. 306).
import { VALORES_2026 } from './liquidacion';

export interface DatosPrima {
  salarioBase: number;
  promedioVariables: number;
  diasSemestre: number;
  incluyeAuxilioTransporte?: boolean;
}

export interface ResultadoPrima {
  basePrima: number;
  auxilioTransporte: number;
  diasCalculados: number;
  valorPrima: number;
  norma: string;
  detalle: string;
  fechaLimitePago: string;
}

export function calcularPrima(d: DatosPrima, semestre: 'primer' | 'segundo' = 'primer', v = VALORES_2026): ResultadoPrima {
  const dias = Math.max(0, Math.min(180, d.diasSemestre));
  const salarioTotal = d.salarioBase + d.promedioVariables;
  const tieneDerechoAuxilio = d.incluyeAuxilioTransporte ?? (d.salarioBase <= 2 * v.salarioMinimo);
  const auxilio = tieneDerechoAuxilio ? v.auxilioTransporte : 0;
  const basePrima = salarioTotal + auxilio;

  const valorPrima = Math.round((basePrima * dias) / 360);
  const fechaLimitePago = semestre === 'primer' ? '30 de junio' : '20 de diciembre';

  return {
    basePrima,
    auxilioTransporte: auxilio,
    diasCalculados: dias,
    valorPrima,
    norma: 'CST, art. 306 (Ley 1788 de 2016)',
    detalle: `(${salarioTotal.toLocaleString('es-CO')}${auxilio ? ` + ${auxilio.toLocaleString('es-CO')} auxilio` : ''}) × ${dias} días ÷ 360`,
    fechaLimitePago,
  };
}
