/**
 * Botón oficial «Iniciar sesión con Google» (Google Identity Services).
 *
 * Google verifica la cuenta en una ventana emergente a nombre de
 * tuvozlaboral.com, sin pasar por la dirección de Supabase, y devuelve un
 * comprobante (ID token) que se entrega a Supabase con signInWithIdToken.
 *
 * Necesita VITE_GOOGLE_CLIENT_ID (público: el ID de cliente de Google). El
 * script de Google solo se carga en /cuenta, cuando el botón se muestra.
 * docs/acceso-con-google.md explica la configuración.
 */
import { useEffect, useRef, useState } from 'react';

type IdConfig = {
  client_id: string;
  callback: (r: { credential: string }) => void;
  nonce: string;
  ux_mode: 'popup';
  use_fedcm_for_button?: boolean;
};
type GoogleId = {
  initialize: (c: IdConfig) => void;
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const SCRIPT_URL = 'https://accounts.google.com/gsi/client?hl=es';

export function googleClientId(): string | undefined {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || undefined;
}

let cargando: Promise<GoogleId> | null = null;
function cargarGoogle(): Promise<GoogleId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (!cargando) {
    cargando = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT_URL;
      s.async = true;
      s.onload = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error('Google no se cargó')));
      s.onerror = () => {
        cargando = null;
        reject(new Error('Google no se cargó'));
      };
      document.head.appendChild(s);
    });
  }
  return cargando;
}

/** Nonce aleatorio: Google recibe su SHA-256 y Supabase el original, para que el comprobante no se pueda reutilizar. */
async function nuevoNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  return { raw, hashed };
}

export function GoogleSignInButton({ clientId, text, onCredential, onLoadError }: {
  clientId: string;
  /** «signin_with» (Iniciar sesión con Google) o «signup_with» (Registrarte con Google). */
  text: 'signin_with' | 'signup_with';
  onCredential: (token: string, nonce: string) => void;
  onLoadError: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onCredential, onLoadError });
  handlers.current = { onCredential, onLoadError };
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const [id, nonce] = await Promise.all([cargarGoogle(), nuevoNonce()]);
        if (!activo || !ref.current) return;
        id.initialize({
          client_id: clientId,
          nonce: nonce.hashed,
          ux_mode: 'popup',
          use_fedcm_for_button: true,
          callback: (r) => handlers.current.onCredential(r.credential, nonce.raw),
        });
        id.renderButton(ref.current, {
          type: 'standard', theme: 'outline', size: 'large', shape: 'rectangular', logo_alignment: 'center',
          text, locale: 'es', width: Math.min(400, Math.max(200, ref.current.offsetWidth)),
        });
        setListo(true);
      } catch {
        if (activo) handlers.current.onLoadError();
      }
    })();
    return () => {
      activo = false;
    };
  }, [clientId, text]);

  return (
    <div className="flex min-h-[44px] w-full justify-center">
      <div ref={ref} className="w-full max-w-[400px]" />
      {!listo && <span className="sr-only">Cargando el botón de Google…</span>}
    </div>
  );
}
