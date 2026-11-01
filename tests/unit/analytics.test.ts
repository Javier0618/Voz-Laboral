// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { iniciarUmami, limpiarUrl, umamiBeforeSend } from '../../src/lib/analytics';

describe('limpiarUrl', () => {
  it('tapa el enlace privado de seguimiento', () => {
    expect(limpiarUrl('https://tuvozlaboral.com/seguimiento/abc123secreto')).toBe('https://tuvozlaboral.com/seguimiento/[enlace]');
    expect(limpiarUrl('/seguimiento/abc123secreto')).toBe('/seguimiento/[enlace]');
  });
  it('quita el código de inicio de sesión y cualquier parámetro', () => {
    expect(limpiarUrl('https://tuvozlaboral.com/cuenta?code=xyz&siguiente=/x#y')).toBe('https://tuvozlaboral.com/cuenta');
    expect(limpiarUrl('/derechos?q=despido&tema=jornada')).toBe('/derechos');
  });
  it('deja igual las direcciones públicas', () => {
    expect(limpiarUrl('/derechos/reforma-laboral-ley-2466-que-cambio')).toBe('/derechos/reforma-laboral-ley-2466-que-cambio');
  });
});

describe('Umami', () => {
  afterEach(() => document.querySelectorAll('script[data-website-id]').forEach((s) => s.remove()));

  it('limpia la dirección y la procedencia antes de enviar', () => {
    const out = umamiBeforeSend('event', { url: '/seguimiento/tok?x=1', referrer: 'https://tuvozlaboral.com/cuenta?code=abc', title: 'T' });
    expect(out).toEqual({ url: '/seguimiento/[enlace]', referrer: 'https://tuvozlaboral.com/cuenta', title: 'T' });
  });

  it('no hace nada si no está configurado', () => {
    expect(iniciarUmami({})).toBe(false);
    expect(document.querySelector('script[data-website-id]')).toBeNull();
  });

  it('inserta el script una sola vez, con el filtro y sin parámetros', () => {
    expect(iniciarUmami({ url: 'https://estadisticas.tutuvozlaboral.comm/', websiteId: 'abc-123', domains: 'tutuvozlaboral.comm' })).toBe(true);
    iniciarUmami({ url: 'https://estadisticas.tutuvozlaboral.comm', websiteId: 'abc-123' });
    const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-website-id]');
    expect(scripts).toHaveLength(1);
    const s = scripts[0];
    expect(s.src).toBe('https://estadisticas.tutuvozlaboral.comm/script.js');
    expect(s.dataset.websiteId).toBe('abc-123');
    expect(s.dataset.excludeSearch).toBe('true');
    expect(s.dataset.domains).toBe('tutuvozlaboral.comm');
    expect(typeof (window as unknown as Record<string, unknown>)[s.dataset.beforeSend!]).toBe('function');
  });
});
