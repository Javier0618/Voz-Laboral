// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { _reiniciarParaPruebas, consentState, iniciarGoogle, limpiarUrl, registrarPagina } from '../../src/lib/analytics';
import { saveConsent } from '../../src/lib/consent';

type W = Window & { dataLayer?: IArguments[]; gtag?: unknown; adsbygoogle?: { requestNonPersonalizedAds?: number } };
const llamadas = () => ((window as W).dataLayer ?? []).map((a) => Array.from(a));

describe('limpiarUrl', () => {
  it('tapa el enlace privado de seguimiento', () => {
    expect(limpiarUrl('https://tuvozlaboral.com/seguimiento/abc123secreto')).toBe('https://tuvozlaboral.com/seguimiento/[enlace]');
    expect(limpiarUrl('/seguimiento/abc123secreto')).toBe('/seguimiento/[enlace]');
  });
  it('quita el código de inicio de sesión y cualquier parámetro', () => {
    expect(limpiarUrl('https://tuvozlaboral.com/cuenta?code=xyz&siguiente=/x#y')).toBe('https://tuvozlaboral.com/cuenta');
    expect(limpiarUrl('/derechos?q=despido&tema=jornada')).toBe('/derechos');
  });
});

describe('consentState', () => {
  it('sin decisión todo está denegado', () => {
    expect(consentState(null)).toEqual({ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  });
  it('concede solo lo aceptado', () => {
    expect(consentState({ analytics: true, ads: false, fecha: '' })).toEqual({ analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  });
});

describe('Google Analytics', () => {
  beforeEach(() => {
    _reiniciarParaPruebas();
    localStorage.clear();
    delete (window as W).dataLayer;
    delete (window as W).gtag;
    document.querySelectorAll('script[src*="googletagmanager"]').forEach((s) => s.remove());
  });
  afterEach(() => localStorage.clear());

  it('no carga nada sin identificador', () => {
    expect(iniciarGoogle(undefined)).toBe(false);
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();
  });

  it('carga gtag con todo denegado, sin página vista automática y sin anuncios personalizados', () => {
    expect(iniciarGoogle('G-PRUEBA')).toBe(true);
    expect(document.querySelector<HTMLScriptElement>('script[src*="googletagmanager"]')!.src).toContain('id=G-PRUEBA');
    const c = llamadas();
    expect(c[0]).toEqual(['consent', 'default', expect.objectContaining({ analytics_storage: 'denied', ad_storage: 'denied' })]);
    expect(c.find((x) => x[0] === 'config')).toEqual(['config', 'G-PRUEBA', { send_page_view: false, anonymize_ip: true }]);
    expect((window as W).adsbygoogle!.requestNonPersonalizedAds).toBe(1);
  });

  it('aplica la decisión guardada y las nuevas decisiones', () => {
    saveConsent({ analytics: true, ads: false });
    iniciarGoogle('G-PRUEBA');
    expect(llamadas().find((x) => x[0] === 'consent' && x[1] === 'update')![2]).toMatchObject({ analytics_storage: 'granted', ad_storage: 'denied' });
    saveConsent({ analytics: true, ads: true });
    const updates = llamadas().filter((x) => x[0] === 'consent' && x[1] === 'update');
    expect(updates[updates.length - 1][2]).toMatchObject({ ad_storage: 'granted', ad_personalization: 'granted' });
    expect((window as W).adsbygoogle!.requestNonPersonalizedAds).toBe(0);
  });

  it('envía las páginas vistas con la dirección limpia', () => {
    iniciarGoogle('G-PRUEBA');
    registrarPagina('/seguimiento/token-secreto', 'Seguimiento');
    const ev = llamadas().find((x) => x[0] === 'event' && x[1] === 'page_view')!;
    expect(ev[2]).toMatchObject({ page_path: '/seguimiento/[enlace]', page_title: 'Seguimiento' });
    expect(String((ev[2] as { page_location: string }).page_location)).not.toContain('token-secreto');
  });

  it('fija la dirección limpia para todos los eventos, también al iniciar', () => {
    window.history.replaceState(null, '', '/seguimiento/token-inicial?code=abc');
    iniciarGoogle('G-PRUEBA');
    const set0 = llamadas().find((x) => x[0] === 'set')!;
    expect(set0[1]).toMatchObject({ page_path: '/seguimiento/[enlace]' });
    expect(JSON.stringify(llamadas())).not.toContain('token-inicial');
    expect(JSON.stringify(llamadas())).not.toContain('code=abc');
    registrarPagina('/seguimiento/otro-token');
    const sets = llamadas().filter((x) => x[0] === 'set');
    expect(sets[sets.length - 1][1]).toMatchObject({ page_path: '/seguimiento/[enlace]' });
    expect(JSON.stringify(llamadas())).not.toContain('otro-token');
    window.history.replaceState(null, '', '/');
  });
});
