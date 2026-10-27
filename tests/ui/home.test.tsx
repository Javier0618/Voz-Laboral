// Portada: sin experiencias publicadas invita a contar la primera y sube las guías.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({ isConfigured: true, supabase: {}, requireClient: () => ({}) }));

const experiences = vi.hoisted(() => ({ list: [] as unknown[] }));
vi.mock('../../src/lib/api', () => ({
  listExperiences: () => Promise.resolve(experiences.list),
  listCategories: () => Promise.resolve([]),
  listLegalResources: () => Promise.resolve([]),
}));
vi.mock('../../src/components/ExperienceItem', () => ({
  ExperienceItem: ({ exp }: { exp: { title: string } }) => <p>{exp.title}</p>,
}));

import Home from '../../src/pages/Home';

const headings = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

describe('portada', () => {
  it('sin experiencias invita a ser de los primeros y muestra las guías antes', async () => {
    experiences.list = [];
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Sé de las primeras personas en contar' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Compartir mi experiencia/ }).getAttribute('href')).toBe('/compartir');
    expect(screen.getByRole('link', { name: /Enviar por WhatsApp/ }).getAttribute('href')).toMatch(/^https:\/\/wa\.me\//);
    expect(headings().indexOf('Conoce tus derechos laborales')).toBe(headings().indexOf('Sé de las primeras personas en contar') + 1);
    expect(screen.queryByRole('heading', { name: 'Experiencias recientes' })).toBeNull();
  });

  it('con experiencias muestra las recientes', async () => {
    experiences.list = [{ id: 'e1', title: 'Pagos puntuales' }];
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(await screen.findByText('Pagos puntuales')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Sé de las primeras personas en contar' })).toBeNull();
  });
});
