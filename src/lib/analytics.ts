/**
 * Google Analytics 4 con Consent Mode v2 y preparación para Google AdSense.
 *
 * - Solo se carga si al compilar existe VITE_GA_ID (p. ej. G-XXXXXXXXXX).
 * - Google Analytics se carga solo tras aceptar las cookies de medición.
 *   Rechazar significa que no se registran páginas vistas.
 * - La publicidad personalizada (AdSense) sigue necesitando que se acepte.
 * - Las páginas vistas se envían a mano, con la dirección pasada por
 *   limpiarUrl: sin parámetros (?code= del inicio de sesión, búsquedas) y con
 *   el enlace privado de seguimiento tapado.
 */
import { onConsentChange, readConsent, type Consent } from './consent';

export function limpiarUrl(url: string): string {
  if (!url) return url;
  const absoluta = /^[a-z][a-z0-9+.-]*:\/\//i.test(url);
  const u = new URL(url, 'https://local.invalid');
  u.search = '';
  u.hash = '';
  u.pathname = u.pathname.replace(/^\/seguimiento\/[^/]+/, '/seguimiento/[enlace]');
  return absoluta ? u.toString() : u.pathname;
}

type Gtag = (...args: unknown[]) => void;
type W = Window & { dataLayer?: unknown[]; gtag?: Gtag; adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number } };

export function gaId(): string | undefined {
  return (import.meta.env.VITE_GA_ID as string | undefined) || undefined;
}
export function adsenseClient(): string | undefined {
  return (import.meta.env.VITE_ADSENSE_CLIENT as string | undefined) || undefined;
}
/** true si hay algún servicio opcional configurado: solo entonces se pide consentimiento. */
export function hayServiciosOpcionales(): boolean {
  return Boolean(gaId() || adsenseClient());
}

export function consentState(c: Consent | null) {
  const g = (ok: boolean | undefined) => (ok ? 'granted' : 'denied');
  return {
    analytics_storage: g(c?.analytics),
    ad_storage: g(c?.ads),
    ad_user_data: g(c?.ads),
    ad_personalization: g(c?.ads),
  };
}

let iniciado = false;
let scriptCargado = false;
let idActual: string | undefined;
let listenerInstalado = false;

/** Inserta el script de Google una sola vez. */
function cargarScript() {
  if (scriptCargado || !idActual) return;
  scriptCargado = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(idActual)}`;
  document.head.appendChild(s);
}

/**
 * Espera la autorización para cargar Google Analytics. Si se rechaza,
 * no se descarga su script ni se envían páginas vistas.
 */
export function iniciarGoogle(id = gaId()): boolean {
  if (typeof window === 'undefined' || !id) return false;
  if (!listenerInstalado) {
    listenerInstalado = true;
    onConsentChange((c) => {
      if (c.analytics && !iniciado) iniciarGoogle(id);
      if (iniciado) {
        (window as W).gtag?.('consent', 'update', consentState(c));
        aplicarAnuncios(c);
      }
    });
  }
  if (iniciado) return true;
  if (!readConsent()?.analytics) return false;
  iniciado = true;
  idActual = id;
  const w = window as W;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // gtag necesita el objeto «arguments», no un arreglo.
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  w.gtag('consent', 'default', { ...consentState(null), wait_for_update: 500 });
  const guardado = readConsent();
  if (guardado) w.gtag('consent', 'update', consentState(guardado));
  w.gtag('js', new Date());
  // Dirección limpia para todos los eventos, también los automáticos de
  // «Medición mejorada» (desplazamiento, clics…), desde el primer momento.
  w.gtag('set', direccionLimpia(window.location.pathname));
  w.gtag('config', id, { send_page_view: false, anonymize_ip: true });
  aplicarAnuncios(guardado);
  cargarScript();
  return true;
}

/** AdSense: sin consentimiento de publicidad, solo anuncios no personalizados. */
function aplicarAnuncios(c: Consent | null) {
  const w = window as W;
  w.adsbygoogle = w.adsbygoogle || ([] as unknown as W['adsbygoogle']);
  w.adsbygoogle!.requestNonPersonalizedAds = c?.ads ? 0 : 1;
}

function direccionLimpia(path: string) {
  return { page_location: limpiarUrl(window.location.origin + path), page_path: limpiarUrl(path) };
}

/**
 * Envía una página vista con la dirección limpia y la fija para los eventos
 * siguientes, así ningún evento envía el enlace privado de seguimiento ni
 * parámetros como el ?code= del inicio de sesión.
 */
export function registrarPagina(path: string, title?: string) {
  const w = window as W;
  if (!iniciado || !readConsent()?.analytics || !w.gtag || !scriptCargado) return;
  const limpia = { ...direccionLimpia(path), page_title: title ?? document.title };
  w.gtag('set', limpia);
  w.gtag('event', 'page_view', limpia);
}

/** Solo para pruebas. */
export function _reiniciarParaPruebas() {
  iniciado = false;
  scriptCargado = false;
  idActual = undefined;
  // El listener anterior permanece registrado en el navegador. En tests, evitar
  // instalar uno duplicado cuando se reinicializa el módulo entre casos.
}
