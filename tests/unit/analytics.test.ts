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
  it('la medición y la publicidad empiezan denegadas', () => {
    expect(consentState(null)).toEqual({ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    expect(consentState({ analytics: false, ads: false, fecha: '' }).analytics_storage).toBe('denied');
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

  it('no descarga Google ni registra páginas sin consentimiento', () => {
    expect(iniciarGoogle('G-PRUEBA')).toBe(false);
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();
    registrarPagina('/derechos');
    expect(llamadas().some((x) => x[0] === 'event' && x[1] === 'page_view')).toBe(false);
  });

  it('tras aceptar medición, carga Google y registra páginas', () => {
    saveConsent({ analytics: true, ads: false });
    expect(iniciarGoogle('G-PRUEBA')).toBe(true);
    expect(document.querySelector<HTMLScriptElement>('script[src*="googletagmanager"]')!.src).toContain('id=G-PRUEBA');
    registrarPagina('/derechos');
    expect(llamadas().some((x) => x[0] === 'event' && x[1] === 'page_view')).toBe(true);
  });

  it('prepara gtag tras consentimiento, sin página vista automática y sin anuncios personalizados', () => {
    saveConsent({ analytics: true, ads: false });
    expect(iniciarGoogle('G-PRUEBA')).toBe(true);
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
    saveConsent({ analytics: true, ads: false });
    iniciarGoogle('G-PRUEBA');
    registrarPagina('/seguimiento/token-secreto', 'Seguimiento');
    const ev = llamadas().find((x) => x[0] === 'event' && x[1] === 'page_view')!;
    expect(ev[2]).toMatchObject({ page_path: '/seguimiento/[enlace]', page_title: 'Seguimiento' });
    expect(String((ev[2] as { page_location: string }).page_location)).not.toContain('token-secreto');
  });

  it('fija la dirección limpia para todos los eventos, también al iniciar', () => {
    window.history.replaceState(null, '', '/seguimiento/token-inicial?code=abc');
    saveConsent({ analytics: true, ads: false });
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


describe('rechazo de medición', () => {
  it('impide enviar páginas vistas tras rechazar cookies opcionales', () => {
    _reiniciarParaPruebas();
    localStorage.clear();
    saveConsent({ analytics: true, ads: false });
    iniciarGoogle('G-PRUEBA');
    const antes = llamadas().filter((x) => x[0] === 'event' && x[1] === 'page_view').length;
    saveConsent({ analytics: false, ads: false });
    registrarPagina('/despues-de-rechazar');
    const despues = llamadas().filter((x) => x[0] === 'event' && x[1] === 'page_view').length;
    expect(despues).toBe(antes);
  });
});
