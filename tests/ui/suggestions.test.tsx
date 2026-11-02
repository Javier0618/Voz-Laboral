// Moderación → Sugerencias: pedir la redacción envía tus indicaciones.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({ isConfigured: true, supabase: {}, requireClient: () => ({}) }));

const setSuggestionStatus = vi.fn().mockResolvedValue(null);
const deleteSuggestion = vi.fn().mockResolvedValue(null);
const base = {
  kind: 'nueva', demand: 'Pico de búsquedas en diciembre.', priority: 'media', topic: 'salario', keywords: ['prima de diciembre'],
  sources: [{ label: 'CST, art. 306', url: 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/codigo_sustantivo_trabajo.htm' }],
  instructions: '', proposal: null, proposal_notes: '', requested_at: null, drafted_at: null, decided_at: null,
  created_at: '2026-11-02T10:00:00Z', target: null, draft: null,
};
vi.mock('../../src/lib/adminApi', () => ({
  listGuideSuggestions: () => Promise.resolve([
    { ...base, id: 's1', status: 'nueva', priority: 'baja', title: 'Tema de baja prioridad', reason: 'Motivo de prueba suficientemente largo.' },
    { ...base, id: 's2', status: 'nueva', priority: 'alta', title: 'Prima de diciembre', reason: 'La segunda cuota se paga en diciembre.' },
    { ...base, id: 's3', status: 'redactada', title: 'Guía ya redactada', reason: 'Motivo de prueba suficientemente largo.', drafted_at: '2026-11-02T12:00:00Z',
      draft: { id: 'g9', slug: 'guia-redactada', title: 'Guía ya redactada', status: 'borrador' } },
    { ...base, id: 's4', status: 'redactada', title: 'Guía ya publicada', reason: 'Motivo de prueba suficientemente largo.', drafted_at: '2026-11-02T12:00:00Z',
      draft: { id: 'g8', slug: 'guia-publicada', title: 'Guía ya publicada', status: 'publicado' } },
    { ...base, id: 's5', status: 'descartada', title: 'Tema descartado', reason: 'Motivo de prueba suficientemente largo.', decided_at: '2026-11-02T13:00:00Z' },
  ]),
  setSuggestionStatus: (...a: unknown[]) => setSuggestionStatus(...a),
  deleteSuggestion: (...a: unknown[]) => deleteSuggestion(...a),
  applySuggestionProposal: vi.fn(),
  listSearchGaps: () => Promise.resolve([{ term: 'licencia de paternidad', searches: 7, results: 0, last_seen: '2026-11-02T10:00:00Z' }]),
}));

import { Suggestions } from '../../src/pages/admin/Suggestions';

describe('sugerencias editoriales', () => {
  it('ordena por prioridad, muestra fuentes y pide la redacción con indicaciones', async () => {
    render(<MemoryRouter><Suggestions /></MemoryRouter>);
    const titulos = await screen.findAllByRole('heading', { level: 3 });
    expect(titulos.map((h) => h.textContent)).toEqual(['Prima de diciembre', 'Tema de baja prioridad']);
    expect(screen.getAllByRole('link', { name: /CST, art\. 306/ })[0].getAttribute('href')).toMatch(/^https:\/\//);
    await userEvent.click(screen.getAllByRole('button', { name: 'Redactar guía' })[0]);
    await userEvent.type(screen.getByLabelText(/Indicaciones para el redactor/), 'Incluye un ejemplo.');
    await userEvent.click(screen.getByRole('button', { name: 'Pedir redacción' }));
    expect(setSuggestionStatus).toHaveBeenCalledWith('s2', 'pedida', 'Incluye un ejemplo.');
  });

  it('una sugerencia redactada lleva a su borrador en el editor', async () => {
    render(<MemoryRouter><Suggestions /></MemoryRouter>);
    await userEvent.click(await screen.findByRole('tab', { name: /Redactadas/ }));
    expect(screen.getByRole('link', { name: 'Revisar el borrador' }).getAttribute('href')).toBe('/moderacion/guias/g9');
  });

  it('las publicadas salen de Redactadas y las descartadas se pueden eliminar', async () => {
    render(<MemoryRouter><Suggestions /></MemoryRouter>);
    await userEvent.click(await screen.findByRole('tab', { name: /Redactadas/ }));
    expect(screen.queryByText('Guía ya publicada')).toBeNull();
    await userEvent.click(screen.getByRole('tab', { name: /Publicadas/ }));
    expect(screen.getByRole('link', { name: 'Ver la guía publicada' }).getAttribute('href')).toBe('/derechos/guia-publicada');
    await userEvent.click(screen.getByRole('tab', { name: /Descartadas/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Eliminar' }).at(-1)!);
    expect(deleteSuggestion).toHaveBeenCalledWith('s5');
  });

  it('muestra las búsquedas del sitio que no tuvieron resultado', async () => {
    render(<MemoryRouter><Suggestions /></MemoryRouter>);
    expect(await screen.findByText(/Búsquedas sin resultado en los últimos 30 días · 1/)).toBeTruthy();
    expect(screen.getByText('licencia de paternidad')).toBeTruthy();
  });
});
