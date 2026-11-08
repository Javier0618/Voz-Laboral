// Casos resueltos a mano con la convención 30/360.
import { describe, expect, it } from 'vitest';
import { calcularLiquidacion, dias360, liquidacionPorAnio, validarLiquidacion, valoresDe, type DatosLiquidacion } from '../../src/lib/liquidacion';

const base: DatosLiquidacion = {
  tipoContrato: 'indefinido',
  motivo: 'renuncia',
  fechaIngreso: '2025-02-01',
  fechaRetiro: '2026-10-15',
  salarioMensual: 1_750_905,
  variableMensual: 0,
  diasVacacionesDisfrutados: 0,
  diasSalarioPendiente: 15,
};
const valor = (r: ReturnType<typeof calcularLiquidacion>, clave: string) => [...r.conceptos, ...r.deducciones].find((c) => c.clave === clave)?.valor;

describe('días 30/360', () => {
  it('cuenta meses de 30 días, ambos extremos incluidos', () => {
    expect(dias360('2026-01-01', '2026-10-15')).toBe(285);
    expect(dias360('2026-07-01', '2026-10-15')).toBe(105);
    expect(dias360('2025-02-01', '2026-10-15')).toBe(615);
    expect(dias360('2026-01-01', '2026-12-31')).toBe(360);
    expect(dias360('2026-02-01', '2026-02-28')).toBe(30);
  });
});

describe('liquidación con salario mínimo, renuncia', () => {
  const r = calcularLiquidacion(base);
  it('suma el auxilio de transporte a la base de prestaciones (2.000.000)', () => {
    expect(r.aplicaAuxilio).toBe(true);
    expect(valor(r, 'cesantias')).toBe(1_583_333); // 2.000.000 × 285 ÷ 360
    expect(valor(r, 'intereses')).toBe(150_417); // 1.583.333,33 × 285 × 12 % ÷ 360
    expect(valor(r, 'prima')).toBe(583_333); // 2.000.000 × 105 ÷ 360
  });
  it('vacaciones proporcionales sin auxilio: 25,625 días', () => {
    expect(valor(r, 'vacaciones')).toBe(1_495_565); // 1.750.905 ÷ 30 × 25,625
  });
  it('salario y auxilio pendientes, y aportes sobre el salario', () => {
    expect(valor(r, 'salario')).toBe(875_453);
    expect(valor(r, 'auxilio')).toBe(124_548);
    expect(valor(r, 'salud')).toBe(35_018);
    expect(valor(r, 'pension')).toBe(35_018);
    expect(valor(r, 'solidaridad')).toBeUndefined();
    expect(valor(r, 'indemnizacion')).toBeUndefined();
  });
  it('el neto es la suma de conceptos menos deducciones', () => {
    expect(r.neto).toBe(r.totalConceptos - r.totalDeducciones);
  });
});

describe('indemnización por despido sin justa causa', () => {
  it('menos de un año en indefinido: reconoce 30 días completos de indemnización', () => {
    const salario = 3_000_000;
    const r = calcularLiquidacion({ ...base, fechaIngreso: '2026-09-01', fechaRetiro: '2026-10-15',
      salarioMensual: salario, motivo: 'despido_sin_justa_causa' });
    expect(valor(r, 'indemnizacion')).toBe(salario);
  });

  it('al cumplir exactamente el año, el primer tramo sigue siendo de 30 días', () => {
    const salario = 3_000_000;
    const r = calcularLiquidacion({ ...base, fechaIngreso: '2025-10-16', fechaRetiro: '2026-10-15',
      salarioMensual: salario, motivo: 'despido_sin_justa_causa' });
    expect(valor(r, 'indemnizacion')).toBe(salario);
  });

  it('a partir de diez salarios mínimos aplica el tramo de 20 días', () => {
    const minimo = valoresDe(2026).salarioMinimo;
    const r = calcularLiquidacion({ ...base, fechaIngreso: '2026-01-01', fechaRetiro: '2026-03-30',
      salarioMensual: minimo * 10, motivo: 'despido_sin_justa_causa' });
    expect(valor(r, 'indemnizacion')).toBe(Math.round(minimo * 10 * 20 / 30));
  });

  it('indefinido, menos de 10 salarios mínimos: 30 días + 20 por año adicional', () => {
    const r = calcularLiquidacion({ ...base, motivo: 'despido_sin_justa_causa' });
    expect(valor(r, 'indemnizacion')).toBe(2_577_721); // 44,1667 días × 58.363,50
  });
  it('indefinido, desde 10 salarios mínimos: 20 días + 15 por año adicional', () => {
    const salario = 20_000_000;
    const r = calcularLiquidacion({ ...base, salarioMensual: salario, motivo: 'despido_sin_justa_causa' });
    expect(valor(r, 'indemnizacion')).toBe(Math.round((salario / 30) * (20 + (15 * 255) / 360)));
    expect(r.aplicaAuxilio).toBe(false);
    expect(valor(r, 'solidaridad')).toBeGreaterThan(0);
  });
  it('término fijo: salarios del tiempo que faltaba', () => {
    const r = calcularLiquidacion({ ...base, tipoContrato: 'fijo', motivo: 'despido_sin_justa_causa', fechaFinPactada: '2026-12-31' });
    expect(valor(r, 'indemnizacion')).toBe(4_377_263); // 75 días × 58.363,50
  });
  it('no hay indemnización por renuncia ni por despido con justa causa', () => {
    expect(valor(calcularLiquidacion({ ...base, motivo: 'despido_justa_causa' }), 'indemnizacion')).toBeUndefined();
  });
});

describe('otros casos', () => {
  it('un salario superior a 2 mínimos no recibe auxilio', () => {
    const r = calcularLiquidacion({ ...base, salarioMensual: 4_000_000 });
    expect(r.aplicaAuxilio).toBe(false);
    expect(valor(r, 'cesantias')).toBe(Math.round((4_000_000 * 285) / 360));
  });
  it('descuenta las vacaciones ya disfrutadas y no baja de cero', () => {
    expect(valor(calcularLiquidacion({ ...base, diasVacacionesDisfrutados: 15 }), 'vacaciones')).toBe(Math.round((1_750_905 / 30) * 10.625));
    expect(valor(calcularLiquidacion({ ...base, diasVacacionesDisfrutados: 40 }), 'vacaciones')).toBe(0);
  });
  it('si ingresó este año, las cesantías cuentan desde el ingreso', () => {
    const r = calcularLiquidacion({ ...base, fechaIngreso: '2026-09-01' });
    expect(valor(r, 'cesantias')).toBe(Math.round((2_000_000 * 45) / 360));
  });
  it('avisa si un año todavía no tiene salario mínimo en la tabla', () => {
    expect(calcularLiquidacion({ ...base, fechaIngreso: '2026-06-01', fechaRetiro: '2027-03-31' }).avisos[0]).toMatch(/2027/);
    expect(calcularLiquidacion({ ...base, fechaIngreso: '2024-01-01', fechaRetiro: '2025-06-30' }).avisos[0]).not.toMatch(/todavía no tenemos/);
  });
});

describe('validación', () => {
  it('rechaza fechas imposibles para evitar una liquidación errónea', () => {
    expect(validarLiquidacion({ ...base, fechaIngreso: '2026-02-30' }).fechaIngreso).toBeTruthy();
    expect(validarLiquidacion({ ...base, fechaRetiro: '2026-13-01' }).fechaRetiro).toBeTruthy();
    expect(validarLiquidacion({ ...base, tipoContrato: 'fijo', motivo: 'despido_sin_justa_causa', fechaFinPactada: '2026-02-30' }).fechaFinPactada).toBeTruthy();
    expect(validarLiquidacion({ ...base, fechaIngreso: '2024-02-29' }).fechaIngreso).toBeUndefined();
  });
  it('rechaza fechas invertidas y datos que faltan', () => {
    const e = validarLiquidacion({ ...base, fechaRetiro: '2024-01-01', salarioMensual: 0 });
    expect(e.fechaRetiro).toBeTruthy();
    expect(e.salarioMensual).toBeTruthy();
  });
  it('exige la fecha pactada en un fijo despedido sin justa causa', () => {
    expect(validarLiquidacion({ ...base, tipoContrato: 'fijo', motivo: 'despido_sin_justa_causa' }).fechaFinPactada).toBeTruthy();
  });
  it('no permite «fin del plazo» en un indefinido', () => {
    expect(validarLiquidacion({ ...base, motivo: 'fin_plazo' }).motivo).toBeTruthy();
  });
});

describe('liquidación año por año con el salario mínimo de cada año', () => {
  // Del 15 de julio de 2024 al 30 de octubre de 2026, ganando el mínimo de cada año.
  const minimos: DatosLiquidacion = {
    ...base,
    fechaIngreso: '2024-07-15',
    fechaRetiro: '2026-10-30',
    salarioMensual: 1_750_905,
    salarioPorAnio: { 2024: 1_300_000, 2025: 1_423_500, 2026: 1_750_905 },
    diasSalarioPendiente: 0,
  };

  it('usa el salario mínimo y el auxilio de transporte de cada año', () => {
    expect(valoresDe(2024)).toMatchObject({ salarioMinimo: 1_300_000, auxilioTransporte: 162_000, aproximado: false });
    expect(valoresDe(2025)).toMatchObject({ salarioMinimo: 1_423_500, auxilioTransporte: 200_000 });
    const filas = liquidacionPorAnio(minimos);
    expect(filas.map((f) => [f.anio, f.dias, f.base])).toEqual([
      [2024, 166, 1_462_000], // 15 de julio a 31 de diciembre
      [2025, 360, 1_623_500],
      [2026, 300, 2_000_000], // 1 de enero a 30 de octubre
    ]);
    expect(Math.round(filas[0].cesantias)).toBe(674_144); // 1.462.000 × 166 ÷ 360
    expect(Math.round(filas[1].cesantias)).toBe(1_623_500); // un año completo: un salario con auxilio
    expect(Math.round(filas[1].intereses)).toBe(194_820); // 12 % de 1.623.500
    expect(filas[2].esUltimo).toBe(true);
  });

  it('en la liquidación van las cesantías de 2026 y la prima del segundo semestre; las anteriores se presumen consignadas', () => {
    const r = calcularLiquidacion(minimos);
    expect(valor(r, 'cesantias')).toBe(1_666_667); // 2.000.000 × 300 ÷ 360
    expect(valor(r, 'intereses')).toBe(166_667);
    expect(valor(r, 'prima')).toBe(666_667); // 2.000.000 × 120 ÷ 360
    expect(valor(r, 'cesantias_anteriores')).toBeUndefined();
    expect(r.avisos.join(' ')).toMatch(/2024 y 2025 debieron consignarse/);
    // Vacaciones de todo el contrato con el último salario (CST, art. 189): 826 días → 34,4167 días hábiles.
    expect(valor(r, 'vacaciones')).toBe(Math.round((1_750_905 * ((826 * 15) / 360)) / 30));
  });

  it('si no consignaron las cesantías ni pagaron las primas, las suma con el mínimo de cada año', () => {
    const r = calcularLiquidacion({ ...minimos, incluirCesantiasAnteriores: true, incluirPrimasAnteriores: true });
    expect(valor(r, 'cesantias_anteriores')).toBe(Math.round(674_144.44 + 1_623_500));
    expect(valor(r, 'intereses_anteriores')).toBe(Math.round((1_462_000 * 166 / 360) * 166 * 0.12 / 360 + 194_820));
    // Primas: segundo semestre de 2024, todo 2025 y primer semestre de 2026.
    expect(valor(r, 'primas_anteriores')).toBe(Math.round(1_462_000 * 166 / 360 + 1_623_500 + 1_000_000));
    expect(r.avisos.join(' ')).toMatch(/un día de salario por cada día de retraso/);
  });

  it('con un solo salario para todo el contrato, el auxilio se decide con el mínimo de cada año', () => {
    // 2.700.000 supera 2 mínimos de 2024 (2.600.000) pero no de 2025 (2.847.000).
    const filas = liquidacionPorAnio({ ...minimos, salarioPorAnio: undefined, salarioMensual: 2_700_000 });
    expect(filas.map((f) => f.auxilio)).toEqual([0, 200_000, 249_095]);
  });
});

describe('calculadoras de un solo periodo con los valores de otro año', () => {
  it('cesantías de 2025 con el mínimo y el auxilio de 2025', async () => {
    const { calcularCesantias } = await import('../../src/lib/cesantias');
    const r = calcularCesantias({ salarioBase: 1_423_500, promedioVariables: 0, diasTrabajadosAnio: 360 }, valoresDe(2025));
    expect(r.baseCalculo).toBe(1_623_500);
    expect(r.cesantias).toBe(1_623_500);
    expect(r.interesesCesantias).toBe(194_820);
  });
  it('prima del primer semestre de 2024 con el auxilio de 2024', async () => {
    const { calcularPrima } = await import('../../src/lib/prima');
    const r = calcularPrima({ salarioBase: 1_300_000, promedioVariables: 0, diasSemestre: 180 }, 'primer', valoresDe(2024));
    expect(r.valorPrima).toBe(731_000); // (1.300.000 + 162.000) × 180 ÷ 360
  });
});
