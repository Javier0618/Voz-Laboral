// Enlaza las citas del Código Sustantivo del Trabajo con la guía que explica
// cada artículo. Si un artículo tiene varias guías, se usa la primera que esté
// publicada y no sea la que se está leyendo.

const GUIAS: [string, string[]][] = [
  ['tipos-de-contrato-y-periodo-de-prueba', ['6', '46', '47', '76', '77', '78', '79', '80']],
  ['cuando-existe-contrato-de-trabajo', ['22', '23', '24']],
  ['limites-de-las-ordenes-del-empleador', ['57', '58', '59', '60']],
  ['despido-con-y-sin-justa-causa', ['61', '62', '63', '64', '66', '115']],
  ['renuncia-y-preaviso', ['47', '62', '64', '66']],
  ['liquidacion-al-terminar-el-contrato', ['65']],
  ['pago-del-salario', ['127', '128', '134', '149']],
  ['igual-trabajo-igual-salario', ['143']],
  ['salario-minimo-auxilio-de-transporte-y-dotacion', ['145', '147', '230', '231', '232', '233', '234']],
  ['jornada-horas-extra-y-recargos', ['158', '159', '160', '161', '167', '167A', '168', '179']],
  ['descanso-dominical-y-festivos', ['172', '173', '174', '175', '176', '177', '178', '179', '180', '181', '183', '185']],
  ['vacaciones', ['186', '187', '188', '189', '190', '192']],
  ['incapacidad-por-enfermedad', ['227']],
  ['licencias-de-maternidad-y-paternidad', ['236', '239']],
  ['estabilidad-laboral-reforzada', ['239', '240', '405']],
  ['cesantias-e-intereses', ['249']],
  ['prima-de-servicios', ['306']],
  ['a-donde-acudir-ministerio-y-derecho-de-peticion', ['485', '486', '488', '489']],
];

/** Guías candidatas para cada artículo, en orden de preferencia. */
export const GUIAS_POR_ARTICULO: Record<string, string[]> = {};
for (const [slug, arts] of GUIAS) for (const a of arts) (GUIAS_POR_ARTICULO[a] ??= []).push(slug);
// El recargo dominical se explica mejor en la guía de descanso dominical.
GUIAS_POR_ARTICULO['179'] = ['descanso-dominical-y-festivos', 'jornada-horas-extra-y-recargos'];

export type ParteCst = string | { texto: string; articulo: string };

// «CST, art. 167A», «CST arts. 168 y 179», «artículo 161 del CST», «art. 59, numeral 1, del CST».
// Solo cuenta como CST si el código aparece justo antes o justo después: «art. 3 de la Ley 2101» no se enlaza.
const CITA = /(CST,? )?(art(?:ículos?|s?\.)) (\d{1,3}[A-Z]?(?:(?:, | y | a )\d{1,3}[A-Z]?)*)(?=((?:, numeral \d+,)? del (?:CST|Código Sustantivo del Trabajo))?)/g;
const NUMERO = /\d{1,3}[A-Z]?/g;

export function partesCst(texto: string): ParteCst[] {
  const partes: ParteCst[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(CITA)) {
    if (!m[1] && !m[4]) continue;
    const inicioLista = m.index + m[0].length - m[3].length;
    for (const n of m[3].matchAll(NUMERO)) {
      const desde = inicioLista + n.index;
      if (!GUIAS_POR_ARTICULO[n[0]]) continue;
      if (desde > ultimo) partes.push(texto.slice(ultimo, desde));
      partes.push({ texto: n[0], articulo: n[0] });
      ultimo = desde + n[0].length;
    }
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return partes;
}

/** Primera guía publicada que explica el artículo, sin contar la que se está leyendo. */
export function guiaDeArticulo(articulo: string, publicadas: Set<string>, actual?: string): string | undefined {
  return GUIAS_POR_ARTICULO[articulo]?.find((s) => s !== actual && publicadas.has(s));
}
