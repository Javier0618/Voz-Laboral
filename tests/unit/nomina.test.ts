import { describe, expect, it } from 'vitest';
import { esDominicalOFestivo, festivos } from '../../src/lib/festivos';
import {
  avisoLimiteExtras, calcularNomina, calcularPorDias, calcularTurnos, factorHora, fondoSolidaridad, horasVacias, inicioNocturno,
  novedadesVacias, otrosVacios, recargoDominical, valorarHoras, type DatosNomina,
} from '../../src/lib/nomina';

describe('festivos de Colombia', () => {
  it('2026 tiene los 18 festivos del calendario oficial', () => {
    expect([...festivos(2026).keys()].sort()).toEqual([
      '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01', '2026-05-18', '2026-06-08',
      '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16',
      '2026-12-08', '2026-12-25',
    ]);
  });
  it('reconoce domingos y festivos', () => {
    expect(esDominicalOFestivo('2026-10-11')).toBe(true); // domingo
    expect(esDominicalOFestivo('2026-10-12')).toBe(true); // Día de la Raza
    expect(esDominicalOFestivo('2026-10-13')).toBe(false);
  });
});

describe('recargos según la fecha', () => {
  it('dominical: 80 % hasta junio de 2026, 90 % desde julio de 2026 y 100 % desde julio de 2027', () => {
    expect(recargoDominical('2026-06-30')).toBe(0.8);
    expect(recargoDominical('2026-07-01')).toBe(0.9);
    expect(recargoDominical('2027-07-01')).toBe(1);
  });
  it('la noche empieza a las 7 p. m. desde el 25 de diciembre de 2025', () => {
    expect(inicioNocturno('2025-12-24')).toBe(21);
    expect(inicioNocturno('2025-12-25')).toBe(19);
  });
  it('factores sobre la hora ordinaria en octubre de 2026', () => {
    const f = '2026-10-15';
    expect([factorHora('RN', f), factorHora('RDD', f), factorHora('RDN', f), factorHora('HED', f), factorHora('HEN', f), factorHora('HEDD', f), factorHora('HEDN', f)].map((x) => Math.round(x * 100)))
      .toEqual([35, 90, 125, 125, 175, 215, 265]);
  });
});

describe('turnos', () => {
  const VH = 10_000;
  const sinExtras = { modo: 'diario' as const, horasJornada: 24 };
  const r2 = (n: number) => Math.round(n * 100) / 100;

  it('turno de noche entre semana: 11 h de recargo nocturno (19:00 a 06:00)', () => {
    const t = calcularTurnos([{ fecha: '2026-10-07', entrada: '18:00', salida: '06:00', descansoMin: 0 }], VH, sinExtras);
    expect(r2(t.horas.RN)).toBe(11);
    expect(Math.round(t.valores.RN)).toBe(38_500);
    expect(t.horasTrabajadas).toBe(12);
  });

  it('turno de día en domingo: 12 h de recargo dominical al 90 %', () => {
    const t = calcularTurnos([{ fecha: '2026-10-11', entrada: '06:00', salida: '18:00', descansoMin: 0 }], VH, sinExtras);
    expect(r2(t.horas.RDD)).toBe(12);
    expect(Math.round(t.valores.RDD)).toBe(108_000);
  });

  it('el turno que pasa del sábado al domingo cambia de recargo a medianoche', () => {
    const t = calcularTurnos([{ fecha: '2026-10-10', entrada: '18:00', salida: '06:00', descansoMin: 0 }], VH, sinExtras);
    expect(r2(t.horas.RN)).toBe(5);
    expect(r2(t.horas.RDN)).toBe(6);
    expect(Math.round(t.valores.RDN)).toBe(75_000); // 6 × 10.000 × 125 %
  });

  it('horas extra por jornada diaria: después de 8 h', () => {
    const t = calcularTurnos([{ fecha: '2026-10-07', entrada: '06:00', salida: '18:00', descansoMin: 0 }], VH, { modo: 'diario', horasJornada: 8 });
    expect(r2(t.horas.HED)).toBe(4);
    expect(Math.round(t.valores.HED)).toBe(50_000);
  });

  it('horas extra por total del período: solo después del umbral', () => {
    const turnos = [
      { fecha: '2026-10-06', entrada: '06:00', salida: '18:00', descansoMin: 0 },
      { fecha: '2026-10-07', entrada: '06:00', salida: '18:00', descansoMin: 0 },
    ];
    const t = calcularTurnos(turnos, VH, { modo: 'periodo', horasUmbral: 20 });
    expect(r2(t.horas.HED)).toBe(4);
    expect(r2(t.horasOrdinarias)).toBe(20);
  });

  it('límite del art. 167A: más de 2 h extra al día o de 12 a la semana', () => {
    const dia = (f: string) => ({ fecha: f, entrada: '06:00', salida: '18:00', descansoMin: 0 }); // 4 h extra con jornada de 8
    const t = calcularTurnos(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-12'].map(dia), VH, { modo: 'diario', horasJornada: 8 });
    expect(t.excesoLimite.dias).toHaveLength(4);
    expect(t.excesoLimite.semanas).toEqual([]); // 12 h justas la semana del 5 de octubre, 4 la del 12
    const t2 = calcularTurnos(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'].map(dia), VH, { modo: 'diario', horasJornada: 8 });
    expect(t2.excesoLimite.semanas).toEqual(['2026-10-05']);
    expect(avisoLimiteExtras(t2.excesoLimite)).toContain('4 días con más de 2 horas extra y 1 semana con más de 12');
    const ok = calcularTurnos([{ fecha: '2026-10-07', entrada: '06:00', salida: '16:00', descansoMin: 0 }], VH, { modo: 'diario', horasJornada: 8 });
    expect(avisoLimiteExtras(ok.excesoLimite)).toBeNull();
  });

  it('descuenta el descanso del turno', () => {
    const t = calcularTurnos([{ fecha: '2026-10-07', entrada: '08:00', salida: '17:00', descansoMin: 60 }], VH, sinExtras);
    expect(t.horasTrabajadas).toBe(8);
  });
});

const base = (o: Partial<DatosNomina> = {}): DatosNomina => ({
  salarioMensual: 1_750_905,
  diasPeriodo: 30,
  fechaReferencia: '2026-10-01',
  horasMes: 210,
  novedades: novedadesVacias(),
  horasValoradas: { horas: horasVacias(), valores: horasVacias() },
  otros: otrosVacios(),
  ...o,
});
const linea = (r: { devengados: { clave: string; valor: number }[]; deducciones: { clave: string; valor: number }[] }, clave: string) =>
  [...r.devengados, ...r.deducciones].find((l) => l.clave === clave)?.valor;

describe('nómina mensual', () => {
  it('salario mínimo sin novedades: neto 1.859.928', () => {
    const r = calcularNomina(base());
    expect(linea(r, 'salario')).toBe(1_750_905);
    expect(linea(r, 'auxilio')).toBe(249_095);
    expect(linea(r, 'salud')).toBe(70_036);
    expect(linea(r, 'pension')).toBe(70_036);
    expect(r.neto).toBe(1_859_928);
  });

  it('quincena: la mitad del salario y del auxilio', () => {
    const r = calcularNomina(base({ diasPeriodo: 15 }));
    expect(linea(r, 'salario')).toBe(875_453);
    expect(linea(r, 'auxilio')).toBe(124_548);
  });

  it('incapacidad: 2/3 del salario sin bajar del mínimo; 2 días el empleador y el resto la EPS', () => {
    const r = calcularNomina(base({ novedades: { ...novedadesVacias(), incapacidad: 5 } }));
    expect(linea(r, 'incapacidad_empleador')).toBe(116_727); // 2 × 58.363,50 (el mínimo diario)
    expect(linea(r, 'incapacidad_eps')).toBe(175_091); // 3 × 58.363,50
    expect(linea(r, 'salario')).toBe(1_459_088); // 25 días
    expect(linea(r, 'auxilio')).toBe(207_579); // sin auxilio los días de incapacidad
  });

  it('incapacidad con salario alto: 2/3 del salario', () => {
    const r = calcularNomina(base({ salarioMensual: 6_000_000, novedades: { ...novedadesVacias(), incapacidad: 3 } }));
    expect(linea(r, 'incapacidad_empleador')).toBe(266_667); // 2 × 133.333,33
  });

  it('ausencia y permiso no remunerado no se pagan ni dan auxilio', () => {
    const r = calcularNomina(base({ novedades: { ...novedadesVacias(), ausencia: 2, permisoNoRemunerado: 1 } }));
    expect(linea(r, 'salario')).toBe(1_575_815); // 27 días
    expect(linea(r, 'auxilio')).toBe(224_186);
  });

  it('regla del 40 %: el exceso no salarial entra en la base de cotización', () => {
    const r = calcularNomina(base({ salarioMensual: 4_000_000, otros: { ...otrosVacios(), bonificacionesNoSalariales: 3_000_000 } }));
    expect(r.excesoNoSalarial).toBe(200_000); // 3.000.000 − 40 % de 7.000.000
    expect(r.ibc).toBe(4_200_000);
    expect(r.aplicaAuxilio).toBe(false); // más de 2 mínimos (3.501.810)
  });

  it('suma recargos y horas extra valorados con la fecha del período', () => {
    const horas = { ...horasVacias(), RN: 10, HED: 2 };
    const valores = valorarHoras(horas, 1_750_905 / 210, '2026-10-01');
    const r = calcularNomina(base({ horasValoradas: { horas, valores } }));
    expect(linea(r, 'RN')).toBe(29_182); // 10 × 8.337,64 × 35 %
    expect(linea(r, 'HED')).toBe(20_844); // 2 × 8.337,64 × 125 %
  });

  it('Fondo de Solidaridad: desde 4 mínimos 1 %, y más desde 16', () => {
    expect(fondoSolidaridad(3.9 * 1_750_905, 1_750_905)).toBe(0);
    expect(fondoSolidaridad(4 * 1_750_905, 1_750_905)).toBe(0.01);
    expect(fondoSolidaridad(16.5 * 1_750_905, 1_750_905)).toBe(0.012);
    expect(fondoSolidaridad(25 * 1_750_905, 1_750_905)).toBe(0.02);
  });
});

describe('trabajo por días', () => {
  const dias = (n: number) => Array.from({ length: n }, (_, i) => ({ fecha: `2026-10-${String(i + 1).padStart(2, '0')}`, entrada: '08:00', salida: '17:00', descansoMin: 60 }));
  it('cotización por semanas: 10 días = 2 cotizaciones mínimas semanales, solo pensión', () => {
    const r = calcularPorDias({ valorDia: 80_000, horasJornada: 8, turnos: dias(10).map((t, i) => ({ ...t, fecha: `2026-10-${String(i + 5).padStart(2, '0')}` })), cotizacion: 'semanas', otrosIngresos: 0, otrosDescuentos: 0 });
    expect(r.dias).toBe(10);
    expect(r.ibc).toBe(875_453);
    expect(linea(r, 'pension')).toBe(35_018);
    expect(linea(r, 'salud')).toBeUndefined();
  });
  it('cotización ordinaria: base mínima de un salario mínimo', () => {
    const r = calcularPorDias({ valorDia: 80_000, horasJornada: 8, turnos: dias(3).map((t, i) => ({ ...t, fecha: `2026-10-0${i + 5}` })), cotizacion: 'ordinaria', otrosIngresos: 0, otrosDescuentos: 0 });
    expect(linea(r, 'jornadas')).toBe(240_000);
    expect(linea(r, 'salud')).toBe(70_036);
  });
  it('un domingo trabajado suma recargo dominical', () => {
    const r = calcularPorDias({ valorDia: 80_000, horasJornada: 8, turnos: [{ fecha: '2026-10-11', entrada: '08:00', salida: '17:00', descansoMin: 60 }], cotizacion: 'ordinaria', otrosIngresos: 0, otrosDescuentos: 0 });
    expect(linea(r, 'RDD')).toBe(72_000); // 8 h × 10.000 × 90 %
  });
});
