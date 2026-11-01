// «Quiénes somos»: las guías son lo principal; experiencias y calculadoras, el complemento.
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({ isConfigured: false, supabase: null, requireClient: () => ({}) }));

import About from '../../src/pages/About';

describe('quiénes somos', () => {
  it('presenta las guías como lo principal y explica cómo se hacen', () => {
    render(<MemoryRouter><About /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1, name: 'Quiénes somos y cómo trabajamos' })).toBeTruthy();
    const pilares = screen.getByRole('heading', { name: 'Qué encontrarás aquí' }).closest('section')!;
    const titulos = within(pilares).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titulos).toEqual(['Guías laborales', 'Experiencias', 'Calculadoras']);
    expect(within(pilares).getByText('Lo principal')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Cómo hacemos las guías' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Cómo moderamos las experiencias' })).toBeTruthy();
  });
});
