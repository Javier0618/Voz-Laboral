import { describe, expect, it } from 'vitest';
import { calcularPrima } from '../../src/lib/prima';
import { calcularHonorarios } from '../../src/lib/honorarios';
import { calcularCesantias } from '../../src/lib/cesantias';
import { calcularSalarioNeto, calcularRetencionFuente } from '../../src/lib/salarioNeto';
import { VALORES_2026 } from '../../src/lib/liquidacion';

describe('Cálculo de Prima de Servicios', () => {
  it('calcula la prima semestral completa para salario mínimo con auxilio de transporte', () => {
    const res = calcularPrima({
      salarioBase: VALORES_2026.salarioMinimo,
      promedioVariables: 0,
      diasSemestre: 180,
    }, 'primer');

    const baseEsperada = VALORES_2026.salarioMinimo + VALORES_2026.auxilioTransporte;
    const primaEsperada = Math.round((baseEsperada * 180) / 360);
    expect(res.basePrima).toBe(baseEsperada);
    expect(res.valorPrima).toBe(primaEsperada);
    expect(res.fechaLimitePago).toBe('30 de junio');
  });

  it('no incluye auxilio de transporte para salarios mayores a 2 SMMLV', () => {
    const salarioAlto = VALORES_2026.salarioMinimo * 3;
    const res = calcularPrima({
      salarioBase: salarioAlto,
      promedioVariables: 0,
      diasSemestre: 180,
    }, 'segundo');

    expect(res.auxilioTransporte).toBe(0);
    expect(res.basePrima).toBe(salarioAlto);
    expect(res.valorPrima).toBe(Math.round(salarioAlto / 2));
    expect(res.fechaLimitePago).toBe('20 de diciembre');
  });

  it('calcula la prima proporcional a los días laborados', () => {
    const salario = 2_000_000;
    const res = calcularPrima({
      salarioBase: salario,
      promedioVariables: 0,
      diasSemestre: 90,
      incluyeAuxilioTransporte: false,
    });

    expect(res.diasCalculados).toBe(90);
    expect(res.valorPrima).toBe(Math.round((salario * 90) / 360));
  });
});

describe('Cálculo de Honorarios e Independientes (Prestación de Servicios)', () => {
  it('calcula IBC al 40% y aportes de salud (12.5%), pensión (16%) y ARL', () => {
    const res = calcularHonorarios({
      honorariosMensuales: 5_000_000,
      claseRiesgoARL: 1,
      aplicaRetencion: true,
      porcentajeRetencion: 11,
      esDeclaranteRenta: true,
    });

    expect(res.ibc).toBe(2_000_000); // 40% de 5M
    expect(res.salud).toBe(250_000); // 12.5% de 2M
    expect(res.pension).toBe(320_000); // 16% de 2M
    expect(res.retencionFuente).toBe(550_000); // 11% de 5M
    expect(res.netoRecibir).toBeLessThan(5_000_000);
  });

  it('respeta el piso mínimo de 1 SMMLV para el IBC', () => {
    const res = calcularHonorarios({
      honorariosMensuales: 1_000_000, // 40% sería 400.000, inferior al mínimo
      claseRiesgoARL: 1,
      aplicaRetencion: false,
      porcentajeRetencion: 0,
      esDeclaranteRenta: false,
    });

    expect(res.ibc).toBe(VALORES_2026.salarioMinimo);
  });
});

describe('Cálculo de Cesantías e Intereses', () => {
  it('calcula cesantías e intereses para un año completo (360 días)', () => {
    const res = calcularCesantias({
      salarioBase: 2_000_000,
      promedioVariables: 0,
      diasTrabajadosAnio: 360,
      incluyeAuxilioTransporte: false,
    });

    expect(res.cesantias).toBe(2_000_000);
    expect(res.interesesCesantias).toBe(240_000); // 12% anual
    expect(res.total).toBe(2_240_000);
  });

  it('calcula proporcionalmente a los días trabajados', () => {
    const res = calcularCesantias({
      salarioBase: 1_200_000,
      promedioVariables: 0,
      diasTrabajadosAnio: 180,
      incluyeAuxilioTransporte: false,
    });

    expect(res.cesantias).toBe(600_000);
    expect(res.interesesCesantias).toBe(36_000); // (600.000 * 180 * 0.12) / 360
  });
});

describe('Cálculo de Salario Neto y Retención', () => {
  it('no descuenta retención para ingresos gravables por debajo de 95 UVT', () => {
    const ret = calcularRetencionFuente(3_000_000); // Menor a 95 UVT (~4.9M)
    expect(ret).toBe(0);
  });

  it('calcula salario neto descontando salud y pensión (4% cada uno) e incluyendo auxilio si aplica', () => {
    // 3.000.000 está por debajo de 2 SMMLV (2 * 1.750.905 = 3.501.810), por lo que tiene auxilio (249.095)
    const res = calcularSalarioNeto({
      salarioBruto: 3_000_000,
    });

    expect(res.descuentoSalud).toBe(120_000);
    expect(res.descuentoPension).toBe(120_000);
    expect(res.retencionFuente).toBe(0);
    // 3.000.000 + 249.095 (auxilio) - 240.000 (descuentos) = 3.009.095
    expect(res.salarioNeto).toBe(3_009_095);
  });

  it('calcula salario neto sin auxilio para salarios superiores a 2 SMMLV', () => {
    const res = calcularSalarioNeto({
      salarioBruto: 4_000_000,
    });

    expect(res.auxilioTransporte).toBe(0);
    expect(res.descuentoSalud).toBe(160_000);
    expect(res.descuentoPension).toBe(160_000);
    expect(res.retencionFuente).toBe(0);
    expect(res.salarioNeto).toBe(3_680_000); // 4M - 320k
  });

  it('aplica auxilio de transporte para salarios de hasta 2 SMMLV', () => {
    const res = calcularSalarioNeto({
      salarioBruto: VALORES_2026.salarioMinimo,
    });

    expect(res.auxilioTransporte).toBe(VALORES_2026.auxilioTransporte);
    expect(res.salarioNeto).toBeGreaterThan(VALORES_2026.salarioMinimo);
  });
});
