// Portada: orden guías → experiencias → calculadoras; sin experiencias invita a contar la primera.
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
  it('sin experiencias invita a ser de los primeros, con las guías antes y las calculadoras después', async () => {
    experiences.list = [];
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Sé de las primeras personas en contar' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Compartir mi experiencia/ }).getAttribute('href')).toBe('/compartir');
    expect(screen.getByRole('link', { name: /Enviar por WhatsApp/ }).getAttribute('href')).toMatch(/^https:\/\/wa\.me\//);
    const h = headings();
    expect(h.indexOf('Sé de las primeras personas en contar')).toBe(h.indexOf('Guías laborales') + 1);
    expect(h.indexOf('Calculadoras laborales')).toBe(h.indexOf('Sé de las primeras personas en contar') + 1);
    expect(screen.queryByRole('heading', { name: 'Lo que cuentan quienes trabajan ahí' })).toBeNull();
  });

  it('enlaza desde Inicio a las calculadoras prioritarias con su URL canónica', () => {
    experiences.list = [];
    render(<MemoryRouter><Home /></MemoryRouter>);
    const urls = [
      '/calculadoras/prima/',
      '/calculadoras/cesantias/',
      '/calculadoras/salario-neto/',
    ];
    for (const url of urls) {
      expect(screen.getAllByRole('link').some((link) => link.getAttribute('href') === url)).toBe(true);
    }
    expect(screen.getByRole('heading', { name: 'Calcula tu prima, cesantías y salario neto' })).toBeTruthy();
  });

  it('con experiencias muestra las recientes', async () => {
    experiences.list = [{ id: 'e1', title: 'Pagos puntuales' }];
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(await screen.findByText('Pagos puntuales')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Lo que cuentan quienes trabajan ahí' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Sé de las primeras personas en contar' })).toBeNull();
  });
});
