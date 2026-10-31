import { describe, expect, it } from 'vitest';
import { calcularPrima } from '../../src/lib/prima';
import { calcularHonorarios } from '../../src/lib/honorarios';
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
