// Botón oficial de Google (con VITE_GOOGLE_CLIENT_ID): el comprobante de
// Google se entrega a Supabase con signInWithIdToken, sin salir del sitio.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const signInWithIdToken = vi.fn().mockResolvedValue({ error: null });
const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });
vi.mock('../../src/lib/supabase', () => ({
  isConfigured: true,
  supabase: {},
  requireClient: () => ({ auth: { signInWithIdToken: (...a: unknown[]) => signInWithIdToken(...a), signInWithOAuth: (...a: unknown[]) => signInWithOAuth(...a) } }),
  AppError: class AppError extends Error {},
}));
vi.mock('../../src/auth/AuthProvider', () => ({ useAuth: () => ({ session: null, profile: null, loading: false }) }));
vi.mock('../../src/components/GoogleSignIn', () => ({
  googleClientId: () => '123-abc.apps.googleusercontent.com',
  GoogleSignInButton: ({ text, onCredential }: { text: string; onCredential: (t: string, n: string) => void }) => (
    <button type="button" onClick={() => onCredential('id-token-de-google', 'nonce-original')}>Botón oficial de Google ({text})</button>
  ),
}));

import { AuthForms } from '../../src/pages/AuthForms';

const renderAt = (url: string) => render(
  <MemoryRouter initialEntries={[url]}>
    <Routes>
      <Route path="/cuenta" element={<AuthForms />} />
      <Route path="/calculadoras/prima" element={<p>Calculadora de prima</p>} />
    </Routes>
  </MemoryRouter>,
);

describe('botón oficial de Google', () => {
  it('entrega el comprobante a Supabase y vuelve a la página de origen', async () => {
    renderAt('/cuenta?siguiente=/calculadoras/prima');
    await userEvent.click(screen.getByRole('button', { name: /Botón oficial de Google \(signin_with\)/ }));
    expect(signInWithIdToken).toHaveBeenCalledWith({ provider: 'google', token: 'id-token-de-google', nonce: 'nonce-original' });
    expect(signInWithOAuth).not.toHaveBeenCalled();
    expect(await screen.findByText('Calculadora de prima')).toBeTruthy();
  });

  it('para crear la cuenta aparece solo después de aceptar la política', async () => {
    renderAt('/cuenta?modo=registro');
    expect(screen.queryByRole('button', { name: /Botón oficial de Google/ })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }));
    expect(signInWithOAuth).not.toHaveBeenCalled();
    expect(screen.getByText(/Debes aceptar la política de tratamiento de datos/)).toBeTruthy();
    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: /Botón oficial de Google \(signup_with\)/ })).toBeTruthy();
  });
});
