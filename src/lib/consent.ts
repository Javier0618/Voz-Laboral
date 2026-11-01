/**
 * Consentimiento de cookies opcionales (Ley 1581 de 2012: autorización previa,
 * expresa e informada). Se guarda en el almacenamiento local del navegador.
 */
export interface Consent { analytics: boolean; ads: boolean; fecha: string }

const KEY = 'vl-consent';
const EVENT = 'tuvozlaboral:consent';
/** Evento para abrir el aviso desde «Preferencias de cookies». */
export const OPEN_EVENT = 'tuvozlaboral:consent-open';

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<Consent>;
    if (typeof c.analytics !== 'boolean' || typeof c.ads !== 'boolean') return null;
    return { analytics: c.analytics, ads: c.ads, fecha: String(c.fecha ?? '') };
  } catch {
    return null;
  }
}

export function saveConsent(choice: { analytics: boolean; ads: boolean }): Consent {
  const c: Consent = { ...choice, fecha: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* modo privado: la elección vale solo para esta visita */
  }
  window.dispatchEvent(new CustomEvent<Consent>(EVENT, { detail: c }));
  return c;
}

export function onConsentChange(fn: (c: Consent) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<Consent>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}

export function openConsentPreferences() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}
