import { describe, expect, it } from 'vitest';
import { limpiarUrl } from '../../src/lib/analytics';

describe('limpiarUrl', () => {
  it('tapa el enlace privado de seguimiento', () => {
    expect(limpiarUrl('https://vozlaboral.co/seguimiento/abc123secreto')).toBe('https://vozlaboral.co/seguimiento/[enlace]');
  });
  it('quita el código de inicio de sesión y cualquier parámetro', () => {
    expect(limpiarUrl('https://vozlaboral.co/cuenta?code=xyz&siguiente=/x#y')).toBe('https://vozlaboral.co/cuenta');
    expect(limpiarUrl('https://vozlaboral.co/derechos?q=despido&tema=jornada')).toBe('https://vozlaboral.co/derechos');
  });
  it('deja igual las direcciones públicas', () => {
    expect(limpiarUrl('https://vozlaboral.co/derechos/reforma-laboral-ley-2466-que-cambio')).toBe('https://vozlaboral.co/derechos/reforma-laboral-ley-2466-que-cambio');
  });
});
