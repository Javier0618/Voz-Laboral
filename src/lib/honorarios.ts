// Motor de cálculo para contratistas independientes / OPS / Prestación de Servicios en Colombia.
import { VALORES_2026 } from './liquidacion';

export interface DatosHonorarios {
  honorariosMensuales: number;
  claseRiesgoARL: 1 | 2 | 3 | 4 | 5;
  aplicaRetencion: boolean;
  porcentajeRetencion: number; // Ej: 11, 10, 4 o 0
  esDeclaranteRenta: boolean;
}

export interface ResultadoHonorarios {
  honorarios: number;
  ibc: number;
  salud: number;
  pension: number;
  arl: number;
  porcentajeArl: number;
  totalSeguridadSocial: number;
  retencionFuente: number;
  netoRecibir: number;
  avisos: string[];
}

export const TARIFAS_ARL: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 0.00522, // 0.522% Riesgo I (administrativo, oficina)
  2: 0.01044, // 1.044% Riesgo II
  3: 0.02436, // 2.436% Riesgo III
  4: 0.04350, // 4.350% Riesgo IV
  5: 0.06960, // 6.960% Riesgo V (alto riesgo, lo asume el contratante si es IV o V)
};

export function calcularHonorarios(d: DatosHonorarios, v = VALORES_2026): ResultadoHonorarios {
  const avisos: string[] = [];
  // Base de cotización: 40% del valor mensualizado del contrato (Ley 1122 de 2007, art. 18; Ley 1753 de 2015)
  let ibcCalculado = d.honorariosMensuales * 0.4;
  if (ibcCalculado < v.salarioMinimo) {
    ibcCalculado = v.salarioMinimo;
    avisos.push(`El IBC no puede ser inferior a 1 SMMLV (${v.salarioMinimo.toLocaleString('es-CO')}).`);
  }
  // Techo máximo: 25 salarios mínimos
  if (ibcCalculado > 25 * v.salarioMinimo) {
    ibcCalculado = 25 * v.salarioMinimo;
    avisos.push('El IBC tiene un tope legal máximo de 25 salarios mínimos.');
  }

  const salud = Math.round(ibcCalculado * 0.125); // 12.5% salud independiente
  const pension = Math.round(ibcCalculado * 0.16); // 16% pensión independiente
  const pctArl = TARIFAS_ARL[d.claseRiesgoARL];
  const arl = Math.round(ibcCalculado * pctArl);

  if (d.claseRiesgoARL >= 4) {
    avisos.push('En contratos con riesgo IV o V, la ARL debe ser pagada directamente por el contratante (Decreto 1072 de 2015, art. 2.2.4.2.2.5).');
  }

  const totalSeguridadSocial = salud + pension + (d.claseRiesgoARL < 4 ? arl : 0);

  let retencion = 0;
  if (d.aplicaRetencion) {
    retencion = Math.round(d.honorariosMensuales * (d.porcentajeRetencion / 100));
  }

  const netoRecibir = d.honorariosMensuales - totalSeguridadSocial - retencion;

  return {
    honorarios: d.honorariosMensuales,
    ibc: Math.round(ibcCalculado),
    salud,
    pension,
    arl,
    porcentajeArl: pctArl * 100,
    totalSeguridadSocial,
    retencionFuente: retencion,
    netoRecibir,
    avisos,
  };
}
