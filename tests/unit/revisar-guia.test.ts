// Revisión de calidad y SEO que exige scripts/editorial.mjs antes de guardar una guía.
import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo de Node sin tipos
import { revisarGuia } from '../../scripts/revisar-guia.mjs';

const relleno = (n: number) => Array.from({ length: n }, (_, i) => `Párrafo ${i + 1} con explicación clara del artículo 306 del Código Sustantivo del Trabajo y un ejemplo de $1.000.000 en la prima de diciembre para trabajadores con salario mínimo.`).join('\n\n');
const contenido = `## Qué dice la ley

${relleno(12)}

## En la práctica

${relleno(12)}

## Errores comunes

- Creer que solo se paga con un año trabajado.
- Olvidar el auxilio de transporte en la base.

## Qué puedes hacer

1. Revisa el pago con la [calculadora de prima](/calculadoras/prima).
2. Lee la guía de [la liquidación](/derechos/liquidacion-al-terminar-el-contrato).

## Preguntas frecuentes

### ¿Cuándo se paga la prima de diciembre?
Dentro de los primeros 20 días de diciembre.

### ¿Se paga en proporción?
Sí, por el tiempo trabajado en el semestre.

### ¿Incluye el auxilio de transporte?
Sí, si lo recibes.`;

const guia = {
  slug: 'prima-de-diciembre',
  title: 'Prima de diciembre: cuándo y cuánto te deben pagar',
  summary: 'La segunda cuota de la prima se paga dentro de los primeros 20 días de diciembre. Aprende a calcularla con un ejemplo real.',
  content: contenido,
  sources: [{ label: 'Código Sustantivo del Trabajo, art. 306', url: 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/codigo_sustantivo_trabajo.htm' }],
};

describe('revisión de calidad de las guías', () => {
  it('acepta una guía completa', () => {
    const r = revisarGuia(guia);
    expect(r.errores).toEqual([]);
    expect(r.palabras).toBeGreaterThan(800);
  });

  it('rechaza una guía corta, sin secciones, sin preguntas ni enlaces internos', () => {
    const r = revisarGuia({ ...guia, content: '## Qué dice la ley\nTexto breve sin más.' });
    expect(r.errores.join(' ')).toMatch(/longitud/);
    expect(r.errores.join(' ')).toMatch(/En la práctica/);
    expect(r.errores.join(' ')).toMatch(/preguntas frecuentes/);
    expect(r.errores.join(' ')).toMatch(/enlaces internos/);
  });

  it('rechaza H1 en el texto, restos de plantilla, título o resumen fuera de rango y slug inválido', () => {
    const r = revisarGuia({ ...guia, slug: 'Prima De Diciembre', title: 'Prima', summary: 'Corto.', content: `# Título\n\n${contenido}\n\nResume aquí lo que dice la ley.` });
    const t = r.errores.join(' ');
    expect(t).toMatch(/slug/);
    expect(t).toMatch(/título/);
    expect(t).toMatch(/resumen/);
    expect(t).toMatch(/«# »/);
    expect(t).toMatch(/plantilla/);
  });

  it('una propuesta de actualización solo revisa el texto', () => {
    expect(revisarGuia({ content: contenido }, { propuesta: true }).errores).toEqual([]);
  });

  it('un artículo informativo no exige citar una norma ni las secciones legales', () => {
    const informativo = `## Antes de la entrevista\n\n${relleno(16).replace(/del artículo 306 del Código Sustantivo del Trabajo/g, 'de la preparación')}\n\n## Durante la entrevista\n\n${relleno(16).replace(/del artículo 306 del Código Sustantivo del Trabajo/g, 'de las respuestas')}\n\n## Después de la entrevista\n\nRevisa la [guía de tipos de contrato](/derechos/tipos-de-contrato-y-periodo-de-prueba) y la [calculadora de salario neto](/calculadoras/salario-neto).`;
    const r = revisarGuia({ ...guia, content: informativo, tipo: 'informativa' });
    expect(r.errores).toEqual([]);
    expect(r.avisos.join(' ')).toMatch(/preguntas frecuentes/);
    expect(revisarGuia({ ...guia, content: informativo }).errores.join(' ')).toMatch(/guía legal/);
  });
});

