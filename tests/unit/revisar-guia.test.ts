// Revisión de calidad y SEO que exige scripts/editorial.mjs antes de guardar una guía.
import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo de Node sin tipos
import { revisarGuia } from '../../scripts/revisar-guia.mjs';

const relleno = (n: number) => Array.from({ length: n }, (_, i) => `Párrafo ${i + 1} con explicación clara del artículo 306 del Código Sustantivo del Trabajo y un ejemplo de $1.000.000 en la prima de diciembre para trabajadores con salario mínimo.`).join('\n\n');
const contenido = `Si trabajas con contrato laboral, a más tardar el 20 de diciembre te deben pagar la segunda parte de la prima, según el artículo 306 del Código Sustantivo del Trabajo.

## Qué dice la ley

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

  it('estilo editorial: avisa si falta la entradilla o hay muletillas, y rechaza títulos anzuelo', () => {
    const sinEntradilla = revisarGuia({ ...guia, content: contenido.replace(/^[\s\S]*?(?=^## )/m, '') });
    expect(sinEntradilla.errores).toEqual([]);
    expect(sinEntradilla.avisos.join(' ')).toMatch(/entradilla/);

    const muletillas = revisarGuia({ ...guia, content: `${contenido}\n\nEn conclusión, es importante destacar el plazo.` });
    expect(muletillas.avisos.join(' ')).toMatch(/muletillas/);

    expect(revisarGuia(guia).avisos.join(' ')).not.toMatch(/estilo/);
    for (const title of ['¡No vas a creer cuánto te deben de prima!', 'PRIMA DE DICIEMBRE: lo que tu jefe no quiere que sepas'])
      expect(revisarGuia({ ...guia, title }).errores.join(' ')).toMatch(/anzuelo/);
  });

  it('las marcas TODO y PENDIENTE solo cuentan en mayúsculas', () => {
    const normal = `${contenido}\n\nTodos los artículos pendientes siguen en estudio.`;
    expect(revisarGuia({ ...guia, content: normal }).errores).toEqual([]);
    expect(revisarGuia({ ...guia, content: `${contenido}\n\nTODO: revisar la cifra.` }).errores.join(' ')).toMatch(/TODO/);
  });

  it('imágenes: exigen descripción y dirección https, y avisa si sobran', () => {
    const img = (alt: string, url = 'https://x.supabase.co/storage/v1/object/public/guias/prima/redaccion-1.jpg') => `![${alt}](${url})`;
    const con = (extra: string) => contenido.replace('## En la práctica', `${extra}\n\n## En la práctica`);
    expect(revisarGuia({ ...guia, content: con(img('Gráfico: la prima se paga en dos cuotas, junio y diciembre')) }).errores).toEqual([]);
    expect(revisarGuia({ ...guia, content: con(img('Gráfico')) }).errores.join(' ')).toMatch(/descripción/);
    const cuatro = Array.from({ length: 4 }, () => img('Gráfico: la prima se paga en dos cuotas, junio y diciembre')).join('\n\n');
    expect(revisarGuia({ ...guia, content: con(cuatro) }).avisos.join(' ')).toMatch(/máximo recomendado/);
  });

  it('formato de medio digital: la sección práctica puede tener cualquier nombre, pero tiene que existir', () => {
    const libre = contenido.replace('## En la práctica', '## Cuánto te toca en diciembre de 2026');
    expect(revisarGuia({ ...guia, content: libre }).errores).toEqual([]);
    const sinPractica = contenido.replace(/## En la práctica[\s\S]*?(?=## Errores comunes)/, '');
    expect(revisarGuia({ ...guia, content: sinPractica }).errores.join(' ')).toMatch(/sección práctica/);
  });

  it('rechaza tablas y las secciones de fuentes o fechas que el sitio ya muestra', () => {
    const tabla = `${contenido}\n\n| Año | Semanas |\n|---|---:|\n| 2026 | 1.250 |`;
    expect(revisarGuia({ ...guia, content: tabla }).errores.join(' ')).toMatch(/tabla/);
    const fuentes = `${contenido}\n\n## Fuentes oficiales y normas consultadas\n\n- Ley 100.`;
    expect(revisarGuia({ ...guia, content: fuentes }).errores.join(' ')).toMatch(/Fuentes oficiales/);
    const fechas = `${contenido}\n\n**Última actualización:** 4 de noviembre de 2026.`;
    expect(revisarGuia({ ...guia, content: fechas }).errores.join(' ')).toMatch(/Última actualización/);
  });

  it('avisa del abuso de «sin embargo» y de las nuevas muletillas', () => {
    const r = revisarGuia({ ...guia, content: `${contenido}\n\nSin embargo, uno. Sin embargo, dos. Sin embargo, tres. Sin embargo, cuatro. En esta guía encontrarás todo.` });
    expect(r.avisos.join(' ')).toMatch(/sin embargo/);
    expect(r.avisos.join(' ')).toMatch(/en esta guía encontrarás/);
  });

  it('avisa cuando el texto es casi todo listas y parece un esquema', () => {
    const lista = Array.from({ length: 60 }, (_, i) => `- Punto ${i + 1} con algo de texto para que pese en la cuenta de palabras.`).join('\n');
    expect(revisarGuia({ ...guia, content: `${contenido}\n\n${lista}` }).avisos.join(' ')).toMatch(/parece un esquema/);
    expect(revisarGuia(guia).avisos.join(' ')).not.toMatch(/parece un esquema/);
  });
});
