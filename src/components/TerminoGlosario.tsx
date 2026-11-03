import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { terminoPorId } from '../lib/glosario';

/**
 * Palabra del glosario dentro de una guía: subrayada con puntos; al tocarla
 * muestra la definición. Se cierra con Escape, al tocar fuera o al volver a tocarla.
 */
export function TerminoGlosario({ id, texto }: { id: string; texto: string }) {
  const t = terminoPorId(id);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const popId = useId();

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('keydown', cerrar);
    document.addEventListener('pointerdown', cerrar);
    return () => {
      document.removeEventListener('keydown', cerrar);
      document.removeEventListener('pointerdown', cerrar);
    };
  }, [abierto]);

  if (!t) return <>{texto}</>;
  return (
    <span ref={ref} className="relative inline">
      <button
        type="button"
        className="cursor-help underline decoration-teal decoration-dotted decoration-2 underline-offset-4 hover:text-teal-strong"
        aria-expanded={abierto}
        aria-controls={popId}
        onClick={() => setAbierto((a) => !a)}
      >
        {texto}
      </button>
      {abierto && (
        <span id={popId} role="note"
          className="absolute left-0 top-full z-20 mt-2 block w-[min(20rem,80vw)] rounded-md border border-line bg-paper p-4 text-left font-sans text-sm leading-6 text-ink shadow-lg">
          <span className="block font-semibold">{t.termino}</span>
          <span className="mt-1 block">{t.definicion}</span>
          <span className="mt-2 block">
            <Link to={`/herramientas/glosario#${t.id}`} className="btn-link">Ver en el glosario</Link>
          </span>
        </span>
      )}
    </span>
  );
}
