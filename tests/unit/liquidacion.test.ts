// Casos resueltos a mano con la convención 30/360.
import { describe, expect, it } from 'vitest';
import { calcularLiquidacion, dias360, validarLiquidacion, type DatosLiquidacion } from '../../src/lib/liquidacion';

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
  it('avisa si el retiro no es de 2026', () => {
    expect(calcularLiquidacion({ ...base, fechaIngreso: '2024-01-01', fechaRetiro: '2025-06-30' }).avisos[0]).toMatch(/2026/);
  });
});

describe('validación', () => {
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
