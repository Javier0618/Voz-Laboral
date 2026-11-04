import type { RefObject } from 'react';

type Accion = {
  label: string;
  title: string;
  /** Prefijo que se agrega al inicio de cada línea seleccionada. */
  linea?: string;
  /** Marcas que envuelven la selección. */
  envolver?: [string, string, string];
};

// Lo que entiende el sitio al mostrar una guía (src/lib/guide.ts).
const ACCIONES: Accion[] = [
  { label: 'Título', title: 'Título de sección: ## al inicio de la línea', linea: '## ' },
  { label: 'Subtítulo', title: 'Subtítulo: ### al inicio de la línea', linea: '### ' },
  { label: 'Negrita', title: 'Negrita: **texto**', envolver: ['**', '**', 'texto en negrita'] },
  { label: 'Lista', title: 'Lista con viñetas: - al inicio de cada línea', linea: '- ' },
  { label: 'Lista numerada', title: 'Lista numerada: 1. al inicio de cada línea', linea: '1. ' },
  { label: 'Aviso', title: 'Recuadro «Importante»: > al inicio de la línea', linea: '> ' },
  { label: 'Enlace', title: 'Enlace: [texto](https://… o /derechos/slug)', envolver: ['[', '](https://)', 'texto del enlace'] },
];

/** Botones que escriben el formato de la guía en el cuadro de texto, donde está el cursor. */
export function FormatToolbar({ textarea, value, onChange }: { textarea: RefObject<HTMLTextAreaElement>; value: string; onChange: (v: string) => void }) {
  function aplicar(a: Accion) {
    const el = textarea.current;
    const ini = el?.selectionStart ?? value.length;
    const fin = el?.selectionEnd ?? value.length;
    let nuevo: string;
    let selIni: number;
    let selFin: number;
    if (a.linea) {
      // Desde el inicio de la primera línea seleccionada hasta el final de la última.
      const desde = value.lastIndexOf('\n', ini - 1) + 1;
      const bloque = value.slice(desde, fin);
      const numerada = a.linea === '1. ';
      const lineas = bloque.split('\n').map((l, i) => {
        const limpia = l.replace(/^(#{2,3} |- |\d+\. |> )/, '');
        return (numerada ? `${i + 1}. ` : a.linea) + limpia;
      });
      const reemplazo = lineas.join('\n');
      nuevo = value.slice(0, desde) + reemplazo + value.slice(fin);
      selIni = desde + reemplazo.length;
      selFin = selIni;
    } else {
      const [antes, despues, ejemplo] = a.envolver!;
      const sel = value.slice(ini, fin) || ejemplo;
      nuevo = value.slice(0, ini) + antes + sel + despues + value.slice(fin);
      selIni = ini + antes.length;
      selFin = selIni + sel.length;
    }
    onChange(nuevo);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(selIni, selFin);
    });
  }

  return (
    <div className="mb-2">
      <div role="toolbar" aria-label="Formato del texto" className="flex flex-wrap gap-1.5">
        {ACCIONES.map((a) => (
          <button key={a.label} type="button" title={a.title} onClick={() => aplicar(a)}
            className="rounded border border-line px-2.5 py-1 text-sm font-semibold hover:border-teal hover:bg-teal/5">
            {a.label}
          </button>
        ))}
      </div>
      <details className="mt-2 rounded border border-line bg-mist/60 px-4 py-2 text-sm">
        <summary className="cursor-pointer font-semibold">Cómo dar formato al texto</summary>
        <table className="mt-3 w-full text-left">
          <thead>
            <tr className="text-slate"><th scope="col" className="pb-1 pr-4 font-semibold">Escribe</th><th scope="col" className="pb-1 font-semibold">Para obtener</th></tr>
          </thead>
          <tbody className="align-top [&_code]:rounded [&_code]:bg-paper [&_code]:px-1.5 [&_code]:py-0.5 [&_td]:py-1.5 [&_td]:pr-4">
            <tr><td><code>## Qué dice la ley</code></td><td>Título de sección. Aparece en el índice «En esta guía».</td></tr>
            <tr><td><code>### ¿Cuándo pagan la prima?</code></td><td>Subtítulo dentro de una sección. En «Preguntas frecuentes», cada pregunta va así.</td></tr>
            <tr><td><code>**20 de diciembre**</code></td><td>Texto en <strong>negrita</strong>.</td></tr>
            <tr><td><code>- Primer punto</code></td><td>Lista con viñetas: un punto por línea.</td></tr>
            <tr><td><code>1. Primer paso</code></td><td>Lista numerada: un paso por línea.</td></tr>
            <tr><td><code>&gt; Tienes 3 años para reclamar.</code></td><td>Recuadro «Importante». Solo para plazos y advertencias.</td></tr>
            <tr><td><code>[la guía de cesantías](/derechos/cesantias-e-intereses)</code></td><td>Enlace a otra guía o calculadora del sitio.</td></tr>
            <tr><td><code>[Ley 50 de 1990](https://…)</code></td><td>Enlace a una fuente externa. Se abre en otra pestaña.</td></tr>
            <tr><td><code>![Descripción](https://…)</code></td><td>Imagen. Usa el botón «Insertar imagen».</td></tr>
          </tbody>
        </table>
        <p className="mt-3 text-slate">
          Deja una <strong>línea en blanco</strong> entre párrafos, títulos y listas. El texto antes del primer <code>##</code> es la entradilla. No uses{' '}
          <code>#</code> solo: el título de la página ya es el principal.
        </p>
      </details>
    </div>
  );
}
