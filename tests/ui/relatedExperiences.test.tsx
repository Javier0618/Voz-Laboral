// Fase 4.2: experiencias relacionadas dentro de una guía.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({ isConfigured: true, supabase: {}, requireClient: () => ({}) }));

const state = vi.hoisted(() => ({ list: [] as unknown[], calls: [] as unknown[] }));
vi.mock('../../src/lib/api', () => ({
  listExperiences: (p: unknown) => { state.calls.push(p); return Promise.resolve(state.list); },
}));

import { RelatedExperiences } from '../../src/components/RelatedExperiences';

const exp = {
  id: 'e1', company_name: 'Empresa de prueba', period_start: '2026-03-01', period_end: null,
  title: 'Me cambiaban el turno sin aviso', body: 'x'.repeat(400), author_alias: 'turno_de_noche',
};

describe('experiencias relacionadas en una guía', () => {
  it('muestra hasta tres de la misma categoría, con extracto y enlace', async () => {
    state.list = [exp];
    state.calls = [];
    render(<MemoryRouter><RelatedExperiences category="jornadas-descansos" topicName="Jornadas y descansos" /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Lo que cuentan quienes lo han vivido' })).toBeTruthy();
    expect(state.calls).toEqual([{ category: 'jornadas-descansos', pageSize: 3 }]);
    expect(screen.getByRole('link', { name: /Me cambiaban el turno/ }).getAttribute('href')).toBe('/experiencias/e1');
    expect(screen.getByText(/…$/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Ver más experiencias/ }).getAttribute('href')).toBe('/experiencias/?categoria=jornadas-descansos');
  });

  it('no muestra nada si no hay experiencias o la guía no tiene categoría', async () => {
    state.list = [];
    const { container } = render(<MemoryRouter><RelatedExperiences category="jornadas-descansos" topicName="Jornadas" /></MemoryRouter>);
    await Promise.resolve();
    expect(container.textContent).toBe('');
    const sinCategoria = render(<MemoryRouter><RelatedExperiences category={null} topicName="Temas" /></MemoryRouter>);
    expect(sinCategoria.container.textContent).toBe('');
  });
});
