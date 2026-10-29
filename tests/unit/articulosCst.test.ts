import { describe, expect, it } from 'vitest';
import { guiaDeArticulo, partesCst } from '../../src/lib/articulosCst';

const enlazados = (t: string) => partesCst(t).flatMap((p) => (typeof p === 'string' ? [] : [p.articulo]));

describe('citas del CST', () => {
  it('reconoce las formas en que se citan los artículos', () => {
    expect(enlazados('(CST, arts. 160, 168 y 179)')).toEqual(['160', '168', '179']);
    expect(enlazados('no se computa (CST, art. 167A, Ley 2466 de 2025)')).toEqual(['167A']);
    expect(enlazados('CST arts. 168 y 179')).toEqual(['168', '179']);
    expect(enlazados('Según el artículo 161 del CST, modificado')).toEqual(['161']);
    expect(enlazados('los artículos 488 y 489 del CST')).toEqual(['488', '489']);
    expect(enlazados('(art. 59, numeral 1, del CST)')).toEqual(['59']);
    expect(enlazados('el art. 186 del Código Sustantivo del Trabajo')).toEqual(['186']);
  });

  it('no enlaza artículos de otras normas ni los que no tienen guía', () => {
    expect(enlazados('el artículo 3 de la Ley 2101 de 2021')).toEqual([]);
    expect(enlazados('artículo 53 de la Constitución')).toEqual([]);
    expect(enlazados('Ley 2466 de 2025, arts. 5 y 6 (arts. 46 y 47 del CST)')).toEqual(['46', '47']);
    expect(enlazados('CST, art. 1')).toEqual([]);
  });

  it('conserva el texto completo', () => {
    const t = 'Pagan un 35 % más (CST, arts. 160 y 168).';
    expect(partesCst(t).map((p) => (typeof p === 'string' ? p : p.texto)).join('')).toBe(t);
  });

  it('elige una guía publicada distinta de la que se lee', () => {
    const publicadas = new Set(['jornada-horas-extra-y-recargos']);
    expect(guiaDeArticulo('179', publicadas)).toBe('jornada-horas-extra-y-recargos');
    expect(guiaDeArticulo('179', new Set([...publicadas, 'descanso-dominical-y-festivos']))).toBe('descanso-dominical-y-festivos');
    expect(guiaDeArticulo('168', publicadas, 'jornada-horas-extra-y-recargos')).toBeUndefined();
  });
});
