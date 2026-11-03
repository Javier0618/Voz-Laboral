// Entrar o crear la cuenta con Google.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });
vi.mock('../../src/lib/supabase', () => ({
  isConfigured: true,
  supabase: {},
  requireClient: () => ({ auth: { signInWithOAuth: (...a: unknown[]) => signInWithOAuth(...a) } }),
  AppError: class AppError extends Error {},
}));
vi.mock('../../src/auth/AuthProvider', () => ({ useAuth: () => ({ session: null, profile: null, loading: false }) }));

import { AuthForms, NEXT_AFTER_OAUTH } from '../../src/pages/AuthForms';

const renderAt = (url: string) => render(<MemoryRouter initialEntries={[url]}><AuthForms /></MemoryRouter>);

beforeEach(() => {
  signInWithOAuth.mockClear();
  sessionStorage.clear();
});

describe('entrar con Google', () => {
  it('inicia sesión con Google y recuerda a dónde volver', async () => {
    renderAt('/cuenta?siguiente=/calculadoras/vigilantes?periodo=2026-11-mensual');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }));
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/cuenta`, queryParams: { prompt: 'select_account' } },
    });
    expect(sessionStorage.getItem(NEXT_AFTER_OAUTH)).toBe('/calculadoras/vigilantes?periodo=2026-11-mensual');
  });

  it('para crear la cuenta exige aceptar la política de datos', async () => {
    renderAt('/cuenta?modo=registro');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }));
    expect(signInWithOAuth).not.toHaveBeenCalled();
    expect(screen.getByText(/Debes aceptar la política de tratamiento de datos/)).toBeTruthy();
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }));
    expect(signInWithOAuth).toHaveBeenCalledTimes(1);
  });

  it('no sigue a direcciones externas', async () => {
    renderAt('/cuenta?siguiente=//sitio-malo.com');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }));
    expect(sessionStorage.getItem(NEXT_AFTER_OAUTH)).toBeNull();
  });
});
