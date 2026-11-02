// Verificación anti-robots (Cloudflare Turnstile) en el acceso.
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithPassword = vi.fn();
vi.mock('../../src/lib/supabase', () => ({
  isConfigured: true,
  supabase: {},
  requireClient: () => ({ auth: { signInWithPassword: (...a: unknown[]) => signInWithPassword(...a) } }),
  AppError: class AppError extends Error {},
}));
vi.mock('../../src/auth/AuthProvider', () => ({ useAuth: () => ({ session: null, profile: null, loading: false }) }));

import { AuthForms } from '../../src/pages/AuthForms';

let callback: ((t: string) => void) | undefined;
const turnstile = {
  render: vi.fn((_el: HTMLElement, opts: Record<string, unknown>) => {
    callback = opts.callback as (t: string) => void;
    return 'w1';
  }),
  reset: vi.fn(),
  remove: vi.fn(),
};

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/cuenta']}>
      <AuthForms />
    </MemoryRouter>,
  );
}

async function fillLogin() {
  await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.co');
  await userEvent.type(screen.getByLabelText('Contraseña'), 'clave-segura-123');
}

beforeEach(() => {
  signInWithPassword.mockReset().mockResolvedValue({ error: null });
  turnstile.render.mockClear();
  turnstile.reset.mockClear();
  callback = undefined;
});
afterEach(() => {
  vi.unstubAllEnvs();
  delete window.turnstile;
});

describe('Turnstile en el acceso', () => {
  it('sin clave pública no muestra nada y el acceso funciona igual', async () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '');
    renderLogin();
    expect(screen.queryByTestId('turnstile')).toBeNull();
    await fillLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await waitFor(() => expect(signInWithPassword).toHaveBeenCalled());
    expect(signInWithPassword.mock.calls[0][0].options.captchaToken).toBeUndefined();
  });

  it('con clave pública exige la verificación y envía el token a Supabase', async () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '1x00000000000000000000AA');
    window.turnstile = turnstile;
    renderLogin();
    await waitFor(() => expect(turnstile.render).toHaveBeenCalled());
    expect(turnstile.render.mock.calls[0][1]).toMatchObject({ sitekey: '1x00000000000000000000AA', language: 'es' });

    await fillLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(screen.getByText('Completa la verificación anti-robots.')).toBeTruthy();
    expect(signInWithPassword).not.toHaveBeenCalled();

    act(() => callback!('token-de-prueba'));
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await waitFor(() => expect(signInWithPassword).toHaveBeenCalled());
    expect(signInWithPassword.mock.calls[0][0].options.captchaToken).toBe('token-de-prueba');
    // El token se gasta: el widget se reinicia para el siguiente intento.
    await waitFor(() => expect(turnstile.reset).toHaveBeenCalledWith('w1'));
  });
});
