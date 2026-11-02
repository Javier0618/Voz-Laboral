// Calculadoras de nómina: sin cuenta invitan a crearla y guardan lo anotado
// para no perderlo; con cuenta cargan el período y guardan solas.
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({ isConfigured: true, supabase: {}, requireClient: () => ({}) }));
vi.mock('../../src/components/CalculatorGuideLinks', () => ({ CalculatorGuideLinks: () => null }));
vi.mock('../../src/lib/api', async (orig) => ({ ...(await orig<object>()), listPublishedGuideSlugs: () => Promise.resolve([]) }));

const auth = vi.hoisted(() => ({ session: null as null | { user: { id: string } } }));
vi.mock('../../src/auth/AuthProvider', () => ({ useAuth: () => ({ session: auth.session, profile: null, loading: false }) }));

const store = vi.hoisted(() => ({ rows: new Map<string, { data: Record<string, unknown>; net_estimate: number; updated_at: string }>(), saves: [] as unknown[] }));
vi.mock('../../src/lib/payroll', async (orig) => {
  const real = await orig<typeof import('../../src/lib/payroll')>();
  return {
    ...real,
    getPayrollRecord: async (calc: string, key: string) => {
      const r = store.rows.get(`${calc}/${key}`);
      return r ? { calculator: calc, period_key: key, worked_days: 0, ...r } : null;
    },
    savePayrollRecord: async (_u: string, r: { calculator: string; period_key: string; data: Record<string, unknown>; net_estimate: number }) => {
      store.saves.push(r);
      store.rows.set(`${r.calculator}/${r.period_key}`, { data: r.data, net_estimate: r.net_estimate, updated_at: new Date().toISOString() });
    },
  };
});

import Administrativos from '../../src/pages/calculadoras/Administrativos';
import { readDraft } from '../../src/lib/payroll';

beforeEach(() => {
  store.rows.clear();
  store.saves.length = 0;
  localStorage.clear();
});

describe('nóminas guardadas en las calculadoras', () => {
  it('sin cuenta: invita a crearla y conserva lo anotado', async () => {
    auth.session = null;
    render(<MemoryRouter initialEntries={['/calculadoras/administrativos?periodo=2026-11-mensual']}><Administrativos /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText('Salario mensual'), '2000000');
    const crear = screen.getByRole('link', { name: 'Crear cuenta gratis' });
    expect(crear.getAttribute('href')).toContain('modo=registro');
    expect(decodeURIComponent(crear.getAttribute('href')!)).toContain('periodo=2026-11-mensual');
    await userEvent.click(crear);
    expect(readDraft()).toMatchObject({ calculator: 'administrativos', period_key: '2026-11-mensual', data: { salario: 2000000 } });
  });

  it('con cuenta: carga el período guardado y guarda los cambios solo', async () => {
    auth.session = { user: { id: 'u1' } };
    store.rows.set('administrativos/2026-11-mensual', { data: { salario: 1750905 }, net_estimate: 1, updated_at: '2026-11-02T10:00:00Z' });
    render(<MemoryRouter initialEntries={['/calculadoras/administrativos?periodo=2026-11-mensual']}><Administrativos /></MemoryRouter>);
    await waitFor(() => expect((screen.getByLabelText('Salario mensual') as HTMLInputElement).value).toMatch(/1\.750\.905/));
    expect(screen.queryByRole('link', { name: 'Crear cuenta gratis' })).toBeNull();
    expect(store.saves).toEqual([]);
    const input = screen.getByLabelText('Salario mensual');
    await userEvent.clear(input);
    await userEvent.type(input, '1800000');
    await waitFor(() => expect(store.saves.length).toBe(1), { timeout: 3000 });
    expect(store.saves[0]).toMatchObject({ calculator: 'administrativos', period_key: '2026-11-mensual', data: { salario: 1800000 } });
    expect((store.saves[0] as { net_estimate: number }).net_estimate).toBeGreaterThan(0);
    expect(await screen.findByText('✓ Guardado automáticamente')).toBeTruthy();
    await act(async () => { await new Promise((r) => setTimeout(r, 1500)); });
    expect(store.saves.length).toBe(1);
  });

  it('con cuenta: recupera lo anotado antes de crearla', async () => {
    auth.session = { user: { id: 'u1' } };
    localStorage.setItem('tuvozlaboral:nomina-pendiente', JSON.stringify({ calculator: 'administrativos', period_key: '2026-11-mensual', data: { salario: 2100000 }, at: Date.now() }));
    render(<MemoryRouter initialEntries={['/calculadoras/administrativos?periodo=2026-11-mensual']}><Administrativos /></MemoryRouter>);
    await waitFor(() => expect(store.saves.length).toBe(1), { timeout: 3000 });
    expect(store.saves[0]).toMatchObject({ data: { salario: 2100000 } });
    expect(readDraft()).toBeNull();
  });
});
