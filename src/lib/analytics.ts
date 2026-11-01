/**
 * Medición de visitas con Umami (sin cookies), alojado en el propio VPS.
 *
 * Se activa solo si al compilar existen VITE_UMAMI_URL y VITE_UMAMI_WEBSITE_ID.
 * Antes de enviar cada visita, limpiarUrl:
 * - quita todos los parámetros (?code= del inicio de sesión, búsquedas…) y el ancla;
 * - tapa el enlace privado de seguimiento de quien compartió sin cuenta.
 */
export function limpiarUrl(url: string): string {
  if (!url) return url;
  const absoluta = /^[a-z][a-z0-9+.-]*:\/\//i.test(url);
  const u = new URL(url, 'https://local.invalid');
  u.search = '';
  u.hash = '';
  u.pathname = u.pathname.replace(/^\/seguimiento\/[^/]+/, '/seguimiento/[enlace]');
  return absoluta ? u.toString() : u.pathname;
}

type UmamiPayload = { url?: string; referrer?: string; [k: string]: unknown };

/** Función que Umami llama antes de cada envío (atributo data-before-send). */
export function umamiBeforeSend(_type: string, payload: UmamiPayload): UmamiPayload {
  return {
    ...payload,
    ...(payload.url ? { url: limpiarUrl(payload.url) } : {}),
    ...(payload.referrer ? { referrer: limpiarUrl(payload.referrer) } : {}),
  };
}

export interface UmamiConfig { url?: string; websiteId?: string; domains?: string }

const HOOK = '__vozlaboralUmamiBeforeSend';

/** Inserta el script de Umami una sola vez. Devuelve false si no está configurado. */
export function iniciarUmami(
  cfg: UmamiConfig = {
    url: import.meta.env.VITE_UMAMI_URL,
    websiteId: import.meta.env.VITE_UMAMI_WEBSITE_ID,
    domains: import.meta.env.VITE_UMAMI_DOMAINS,
  },
): boolean {
  if (typeof document === 'undefined' || !cfg.url || !cfg.websiteId) return false;
  if (document.querySelector('script[data-website-id]')) return true;
  (window as unknown as Record<string, unknown>)[HOOK] = umamiBeforeSend;
  const s = document.createElement('script');
  s.defer = true;
  s.src = `${cfg.url.replace(/\/$/, '')}/script.js`;
  s.dataset.websiteId = cfg.websiteId;
  s.dataset.beforeSend = HOOK;
  s.dataset.excludeSearch = 'true';
  s.dataset.excludeHash = 'true';
  if (cfg.domains) s.dataset.domains = cfg.domains;
  document.head.appendChild(s);
  return true;
}
