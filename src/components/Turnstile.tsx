/**
 * Verificación anti-bots de Cloudflare Turnstile.
 *
 * Solo se activa si existe VITE_TURNSTILE_SITE_KEY. Sin ella, useTurnstile()
 * devuelve ready = true y no muestra nada, así que los formularios funcionan
 * igual que antes. Cada token sirve una sola vez: tras cada intento hay que
 * llamar a reset().
 */
import { useCallback, useEffect, useRef, useState } from 'react';

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export function turnstileSiteKey(): string | undefined {
  return (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || undefined;
}

let cargando: Promise<TurnstileApi> | null = null;
function cargarTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!cargando) {
    cargando = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT_URL;
      s.async = true;
      s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile no se cargó')));
      s.onerror = () => {
        cargando = null;
        reject(new Error('Turnstile no se cargó'));
      };
      document.head.appendChild(s);
    });
  }
  return cargando;
}

export function useTurnstile() {
  const siteKey = turnstileSiteKey();
  const [token, setToken] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const widgetId = useRef<string | null>(null);

  const reset = useCallback(() => {
    setToken(null);
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
  }, []);

  const widget = siteKey ? (
    <TurnstileWidget siteKey={siteKey} onToken={setToken} onFail={setFailed} widgetId={widgetId} failed={failed} />
  ) : null;

  return {
    /** Token para enviar al servidor; undefined si la verificación está desactivada. */
    token: siteKey ? token ?? undefined : undefined,
    ready: !siteKey || Boolean(token),
    widget,
    reset,
  };
}

function TurnstileWidget({ siteKey, onToken, onFail, widgetId, failed }: {
  siteKey: string;
  onToken: (t: string | null) => void;
  onFail: (f: boolean) => void;
  widgetId: React.MutableRefObject<string | null>;
  failed: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelado = false;
    cargarTurnstile()
      .then((api) => {
        if (cancelado || !ref.current) return;
        onFail(false);
        widgetId.current = api.render(ref.current, {
          sitekey: siteKey,
          language: 'es',
          size: 'flexible',
          callback: (t: string) => onToken(t),
          'expired-callback': () => onToken(null),
          'error-callback': () => onToken(null),
        });
      })
      .catch(() => !cancelado && onFail(true));
    return () => {
      cancelado = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [siteKey]);

  return (
    <div>
      <div ref={ref} data-testid="turnstile" />
      {failed && (
        <p className="field-error">
          No se pudo cargar la verificación anti-robots. Revisa tu conexión o desactiva el bloqueador de contenido y recarga la página.
        </p>
      )}
    </div>
  );
}
