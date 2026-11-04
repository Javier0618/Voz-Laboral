// Barra de formato del editor de guías: escribe ##, ###, **, listas, avisos y enlaces donde está el cursor.
import { useRef, useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormatToolbar } from '../../src/components/FormatToolbar';

function Editor({ inicial, sel }: { inicial: string; sel: [number, number] }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [v, setV] = useState(inicial);
  return (
    <>
      <FormatToolbar textarea={ref} value={v} onChange={setV} />
      <textarea aria-label="contenido" ref={ref} value={v} onChange={(e) => setV(e.target.value)}
        onFocus={(e) => e.currentTarget.setSelectionRange(...sel)} />
    </>
  );
}

function pulsar(inicial: string, sel: [number, number], boton: string) {
  cleanup();
  render(<Editor inicial={inicial} sel={sel} />);
  const ta = screen.getByLabelText('contenido') as HTMLTextAreaElement;
  ta.setSelectionRange(...sel);
  fireEvent.click(screen.getByRole('button', { name: boton }));
  return ta.value;
}

describe('barra de formato', () => {
  it('convierte la línea del cursor en título con ##', () => {
    expect(pulsar('Intro.\n\nQué dice la ley', [12, 12], 'Título')).toBe('Intro.\n\n## Qué dice la ley');
  });

  it('cambia un título por subtítulo sin duplicar los numerales', () => {
    expect(pulsar('## Pregunta', [3, 3], 'Subtítulo')).toBe('### Pregunta');
  });

  it('pone viñetas o números en cada línea seleccionada', () => {
    expect(pulsar('uno\ndos', [0, 7], 'Lista')).toBe('- uno\n- dos');
    expect(pulsar('uno\ndos', [0, 7], 'Lista numerada')).toBe('1. uno\n2. dos');
  });

  it('envuelve la selección en negrita y, sin selección, deja un ejemplo', () => {
    expect(pulsar('paga el 20 de diciembre', [8, 23], 'Negrita')).toBe('paga el **20 de diciembre**');
    expect(pulsar('', [0, 0], 'Enlace')).toBe('[texto del enlace](https://)');
  });

  it('muestra la chuleta de formato', () => {
    render(<Editor inicial="" sel={[0, 0]} />);
    expect(screen.getByText('Cómo dar formato al texto')).toBeTruthy();
    expect(screen.getByText('## Qué dice la ley')).toBeTruthy();
  });
});
