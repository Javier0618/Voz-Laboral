import { describe, expect, it } from 'vitest';
import { detectSensitiveData } from '../../src/lib/sensitive';

describe('detectSensitiveData', () => {
  it('detecta correos', () => {
    expect(detectSensitiveData('escríbele a jefe.area@empresa.com.co')).toContain('email');
  });
  it('detecta celulares colombianos con y sin indicativo', () => {
    expect(detectSensitiveData('llamó al 310 555 1234')).toContain('telefono');
    expect(detectSensitiveData('su número +57 3015551234')).toContain('telefono');
  });
  it('detecta cédulas', () => {
    expect(detectSensitiveData('con cédula 1.020.304.050 firmó')).toContain('cedula');
    expect(detectSensitiveData('CC 79123456')).toContain('cedula');
  });
  it('no marca texto normal ni años', () => {
    expect(detectSensitiveData('En 2023 trabajé 48 horas semanales durante 6 meses.')).toEqual([]);
  });
});
