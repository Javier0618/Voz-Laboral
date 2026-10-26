import { describe, expect, it } from 'vitest';
import { formatDate, todayLocal } from '../../src/lib/format';

describe('fechas', () => {
  it('una fecha sin hora se muestra como ese mismo día, sin desfase por zona horaria', () => {
    expect(formatDate('2026-10-26')).toBe('26 de octubre de 2026');
  });
  it('hoy en hora local tiene formato AAAA-MM-DD', () => {
    const d = new Date();
    expect(todayLocal()).toBe(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  });
});
