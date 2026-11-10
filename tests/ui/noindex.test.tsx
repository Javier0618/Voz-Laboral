// Páginas que no deben indexarse (auditoría SEO de noviembre de 2026):
// una guía inexistente (soft 404) y los formularios de reclamación de empresas.
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({ isConfigured: true, supabase: {}, requireClient: () => ({}) }));
vi.mock('../../src/auth/AuthProvider', () => ({ useAuth: () => ({ session: null, profile: null, loading: false }) }));
vi.mock('../../src/lib/api', async (orig) => ({
  ...(await orig<object>()),
  getLegalResource: () => Promise.resolve(null),
  listLegalResources: () => Promise.resolve([]),
  listCategories: () => Promise.resolve([]),
  listPublishedGuideSlugs: () => Promise.resolve([]),
  getCompanyProfile: () => Promise.resolve({ company: { id: 'c1', slug: 'acme-bogota', trade_name: 'ACME S.A.S.', sector: '', city: 'Bogotá', department: '', website: null, updated_at: '', aliases: [] } }),
}));

import { RightsArticle } from '../../src/pages/Rights';
import Claim from '../../src/pages/Claim';

const robots = () => document.querySelector('meta[name="robots"]')?.getAttribute('content');

describe('noindex', () => {
  it('una guía que no existe lleva noindex y su propio título', async () => {
    render(<MemoryRouter initialEntries={['/derechos/no-existe/']}><Routes><Route path="/derechos/:slug" element={<RightsArticle />} /></Routes></MemoryRouter>);
    await waitFor(() => expect(robots()).toBe('noindex, follow'));
    expect(document.title).toMatch(/^Guía no encontrada/);
  });

  it('el formulario de reclamación de una empresa no se indexa', async () => {
    render(<MemoryRouter initialEntries={['/empresas/acme-bogota/reclamacion']}><Routes><Route path="/empresas/:slug/reclamacion" element={<Claim />} /></Routes></MemoryRouter>);
    await waitFor(() => expect(document.title).toMatch(/Solicitar una corrección sobre ACME S\.A\.S\./));
    expect(robots()).toBe('noindex, follow');
  });
});
