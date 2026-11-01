import type { ReactNode } from 'react';

/** Fase 5.2: explicación de la fórmula al final de cada calculadora. */
export function ComoSeCalcula({ children }: { children: ReactNode }) {
  return (
    <section className="mt-14 max-w-prose border-t border-line pt-10" aria-labelledby="como-se-calcula">
      <h2 id="como-se-calcula" className="text-2xl">Cómo se calcula</h2>
      <div className="mt-4 space-y-4 text-base leading-7 text-slate [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-6">{children}</div>
    </section>
  );
}
