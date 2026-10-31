// Motor de cálculo de Salario Neto vs. Bruto y Retención en la fuente (Art. 383 ET).
import { VALORES_2026 } from './liquidacion';
import { UVT_2026, fondoSolidaridad } from './nomina';

export interface DatosSalarioNeto {
  salarioBruto: number;
  otrosIngresosSalariales?: number;
  otrosIngresosNoSalariales?: number;
  deduccionesVoluntarias?: number; // AFC, pensiones voluntarias, dependientes
}

export interface ResultadoSalarioNeto {
  salarioBruto: number;
  auxilioTransporte: number;
  totalIngresos: number;
  ibc: number;
  descuentoSalud: number;
  descuentoPension: number;
  descuentoFsp: number;
  retencionFuente: number;
  totalDescuentosLey: number;
  salarioNeto: number;
  uvtIngresoGravable: number;
  avisos: string[];
}

export function calcularRetencionFuente(baseGravablePesos: number): number {
  if (baseGravablePesos <= 0) return 0;
  const baseUvt = baseGravablePesos / UVT_2026;

  // Tabla artículo 383 Estatuto Tributario
  if (baseUvt <= 95) {
    return 0;
  } else if (baseUvt <= 150) {
    return Math.round((baseUvt - 95) * 0.19 * UVT_2026);
  } else if (baseUvt <= 360) {
    return Math.round(((baseUvt - 150) * 0.28 + 10) * UVT_2026);
  } else if (baseUvt <= 640) {
    return Math.round(((baseUvt - 360) * 0.33 + 69) * UVT_2026);
  } else if (baseUvt <= 945) {
    return Math.round(((baseUvt - 640) * 0.35 + 162) * UVT_2026);
  } else if (baseUvt <= 2300) {
    return Math.round(((baseUvt - 945) * 0.37 + 268) * UVT_2026);
  } else {
    return Math.round(((baseUvt - 2300) * 0.39 + 770) * UVT_2026);
  }
}

export function calcularSalarioNeto(d: DatosSalarioNeto, v = VALORES_2026): ResultadoSalarioNeto {
  const avisos: string[] = [];
  const bruto = d.salarioBruto;
  const variables = d.otrosIngresosSalariales || 0;
  const noSalariales = d.otrosIngresosNoSalariales || 0;

  const tieneAuxilio = bruto <= 2 * v.salarioMinimo;
  const auxilio = tieneAuxilio ? v.auxilioTransporte : 0;

  const totalSalarial = bruto + variables;
  const excesoNoSalarial = Math.max(0, noSalariales - 0.4 * (totalSalarial + noSalariales));
  const ibc = Math.min(25 * v.salarioMinimo, Math.max(v.salarioMinimo, totalSalarial + excesoNoSalarial));

  const descuentoSalud = Math.round(ibc * 0.04);
  const descuentoPension = Math.round(ibc * 0.04);
  const porcentajeFsp = fondoSolidaridad(ibc, v.salarioMinimo);
  const descuentoFsp = Math.round(ibc * porcentajeFsp);

  // Renta exenta de trabajo del 25% (art. 206 numeral 10 ET, con límite de 790 UVT anuales / ~65.8 UVT mes)
  const ingresoDepuradoPrevio = totalSalarial - descuentoSalud - descuentoPension - descuentoFsp;
  const rentaExenta25 = Math.min(ingresoDepuradoPrevio * 0.25, 65.83 * UVT_2026);
  const deduccionesAdicionales = d.deduccionesVoluntarias || 0;
  const baseGravable = Math.max(0, ingresoDepuradoPrevio - rentaExenta25 - deduccionesAdicionales);

  const retencionFuente = calcularRetencionFuente(baseGravable);

  const totalDescuentosLey = descuentoSalud + descuentoPension + descuentoFsp + retencionFuente;
  const totalIngresos = totalSalarial + noSalariales + auxilio;
  const salarioNeto = totalIngresos - totalDescuentosLey;

  if (retencionFuente > 0) {
    avisos.push(`Aplica retención en la fuente por ingresos gravables superiores a 95 UVT (${(95 * UVT_2026).toLocaleString('es-CO')}).`);
  }
  if (descuentoFsp > 0) {
    avisos.push(`Aplica Fondo de Solidaridad Pensional (${(porcentajeFsp * 100).toFixed(1)} %) por devengar más de 4 SMMLV.`);
  }

  return {
    salarioBruto: bruto,
    auxilioTransporte: auxilio,
    totalIngresos,
    ibc: Math.round(ibc),
    descuentoSalud,
    descuentoPension,
    descuentoFsp,
    retencionFuente,
    totalDescuentosLey,
    salarioNeto,
    uvtIngresoGravable: Math.round((baseGravable / UVT_2026) * 10) / 10,
    avisos,
  };
}
