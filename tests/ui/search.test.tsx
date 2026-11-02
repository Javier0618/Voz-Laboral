// Buscador del sitio: agrupa guías, calculadoras y empresas, y registra
// cada búsqueda terminada una sola vez, de forma anónima.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({ isConfigured: true, supabase: {}, requireClient: () => ({}) }));

const searchGuides = vi.fn((q: string) => Promise.resolve(q.includes('prima')
  ? [{ slug: 'prima-de-servicios', title: 'Prima de servicios en Colombia', summary: 'Cuándo y cuánto te pagan.', topic: '', category_slug: null, score: 3 }]
  : []));
const searchCompanies = vi.fn(() => Promise.resolve([]));
const logSearch = vi.fn(() => Promise.resolve(null));
vi.mock('../../src/lib/api', () => ({
  searchGuides: (q: string) => searchGuides(q),
  searchCompanies: () => searchCompanies(),
  logSearch: (...a: unknown[]) => logSearch(...(a as [])),
}));

import Search from '../../src/pages/Search';
import { normalizeQuery } from '../../src/lib/search';

describe('buscador', () => {
  it('normaliza como la base de datos', () => {
    expect(normalizeQuery('  ¿Cuántos DÍAS de vacaciones?  ')).toBe('cuantos dias de vacaciones');
  });

  it('muestra guías y calculadoras, y registra la búsqueda una vez', async () => {
    render(<MemoryRouter initialEntries={['/buscar']}><Search /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText('Qué quieres buscar'), 'Prima');
    expect(await screen.findByRole('link', { name: /Prima de servicios en Colombia/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Prima de servicios \(Junio y Diciembre\)/ }).getAttribute('href')).toBe('/calculadoras/prima');
    // Solo consulta tras la pausa al escribir, no por cada letra.
    expect(searchGuides.mock.calls.length).toBeLessThanOrEqual(2);
    await waitFor(() => expect(logSearch).toHaveBeenCalledWith('prima', expect.any(Number)), { timeout: 3000 });
    expect(logSearch).toHaveBeenCalledTimes(1);
  });

  it('sin resultados ofrece alternativas', async () => {
    render(<MemoryRouter initialEntries={['/buscar?q=zzzz%20inexistente']}><Search /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: /No encontramos/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Pide que la agreguen/ })).toBeTruthy();
  });
});
