import { useState } from 'react';
import { brand } from '../config/brand';

type Props = {
  title: string;
  path: string;
  label?: string;
};

/** Comparte solo el enlace canónico, nunca datos introducidos en calculadoras. */
export function ShareLinkButton({ title, path, label = 'Compartir' }: Props) {
  const [message, setMessage] = useState('');
  const url = brand.siteUrl + (path.startsWith('/') ? path : '/' + path);

  async function onShare() {
    setMessage('');
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Cancelar el menú nativo no debe abrir otro cuadro.
        if (error instanceof DOMException && error.name === 'AbortError') return;
        // En errores del menú nativo, permitir copiar el enlace.
      }
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url);
      setMessage('Enlace copiado');
    } catch {
      // Alternativa para navegadores sin Clipboard API o sin permiso.
      const answer = window.prompt('Copia este enlace:', url);
      if (answer !== null) setMessage('Enlace listo para copiar');
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1 print:hidden">
      <button
        type="button"
        onClick={onShare}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-teal/50 bg-paper px-3 py-2 font-sans text-sm font-semibold text-teal-strong transition-colors hover:border-teal hover:bg-teal-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        aria-label={label}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.7 10.7 6.6-4.2M8.7 13.3l6.6 4.2" />
        </svg>
        {label}
      </button>
      <span className="text-xs text-teal-strong" role="status" aria-live="polite">{message}</span>
    </span>
  );
}
