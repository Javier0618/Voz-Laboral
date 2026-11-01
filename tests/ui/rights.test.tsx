// Índice de guías: agrupado por temas editoriales, con reformas primero.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({ isConfigured: true, supabase: {}, requireClient: () => ({}) }));

const guia = (slug: string, title: string, category_slug: string | null) => ({
  id: slug, slug, title, summary: 'Resumen de prueba suficientemente largo.', content: 'Contenido de prueba.',
  category_slug, disclaimer: '', last_verified_at: null, updated_at: '2026-11-01', cover_url: null, cover_alt: '',
});

vi.mock('../../src/lib/api', () => ({
  listLegalResources: () => Promise.resolve([
    guia('prima-de-servicios', 'Prima de servicios', 'pago-salarios'),
    guia('sindicatos-asociacion-y-huelga', 'Sindicatos y huelga', 'otras'),
    guia('reforma-laboral-ley-2466-que-cambio', 'Reforma laboral de 2025', 'contrato-condiciones'),
    guia('jornada-horas-extra-y-recargos', 'Jornada máxima', 'jornadas-descansos'),
  ]),
  listCategories: () => Promise.resolve([]),
  getLegalResource: () => Promise.resolve(null),
  registerGuideView: () => Promise.resolve(),
}));

import Rights from '../../src/pages/Rights';

describe('índice de guías', () => {
  it('agrupa por temas editoriales con reformas primero y salario después de colectivos', async () => {
    render(<MemoryRouter initialEntries={['/derechos']}><Rights /></MemoryRouter>);
    await screen.findByRole('heading', { name: 'Reformas y novedades' });
    const h = screen.getAllByRole('heading', { level: 2 }).map((e) => e.textContent);
    const temas = h.filter((t) => ['Reformas y novedades', 'Jornada y descanso', 'Sindicatos y derechos colectivos', 'Salario y prestaciones'].includes(t ?? ''));
    expect(temas).toEqual(['Reformas y novedades', 'Jornada y descanso', 'Sindicatos y derechos colectivos', 'Salario y prestaciones']);
  });

  it('los enlaces antiguos con la categoría filtran por el tema equivalente', async () => {
    render(<MemoryRouter initialEntries={['/derechos?tema=jornadas-descansos']}><Rights /></MemoryRouter>);
    expect(await screen.findByText('1 de 4 guías')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Jornada y descanso' }).getAttribute('aria-pressed')).toBe('true');
  });
});
