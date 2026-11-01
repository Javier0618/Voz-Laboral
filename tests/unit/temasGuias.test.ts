import { describe, expect, it } from 'vitest';
import { GUIA_TEMA, TEMAS_GUIAS, ordenTema, resolverTema, temaDeGuia } from '../../src/lib/temasGuias';

describe('taxonomía editorial de guías', () => {
  it('pone reformas y novedades primero y salario no encabeza la lista', () => {
    expect(TEMAS_GUIAS[0].slug).toBe('reformas');
    expect(ordenTema('salario')).toBeGreaterThan(ordenTema('colectivos'));
  });

  it('todas las guías clasificadas apuntan a un tema existente', () => {
    const temas = new Set(TEMAS_GUIAS.map((t) => t.slug));
    for (const [slug, tema] of Object.entries(GUIA_TEMA)) expect(temas.has(tema), slug).toBe(true);
  });

  it('usa la clasificación explícita antes que la categoría', () => {
    expect(temaDeGuia({ slug: 'reforma-laboral-ley-2466-que-cambio', category_slug: 'contrato-condiciones' }).slug).toBe('reformas');
    expect(temaDeGuia({ slug: 'teletrabajo-trabajo-remoto-y-desconexion', category_slug: 'jornadas-descansos' }).slug).toBe('formas-de-trabajar');
  });

  it('clasifica una guía nueva por su título o su categoría', () => {
    expect(temaDeGuia({ slug: 'x-nueva', title: 'Qué cambió con la nueva ley de pensiones', category_slug: 'otras' }).slug).toBe('reformas');
    expect(temaDeGuia({ slug: 'x-nueva', title: 'Turnos de noche', category_slug: 'jornadas-descansos' }).slug).toBe('jornada');
    expect(temaDeGuia({ slug: 'x-nueva', title: 'Algo distinto', category_slug: null }).slug).toBe('otros');
  });

  it('acepta enlaces antiguos con la categoría en ?tema=', () => {
    expect(resolverTema('reformas')?.slug).toBe('reformas');
    expect(resolverTema('jornadas-descansos')?.slug).toBe('jornada');
    expect(resolverTema('desconocido')).toBeNull();
    expect(resolverTema('')).toBeNull();
  });
});
