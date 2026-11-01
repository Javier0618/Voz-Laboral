// Aviso de cookies: aparece solo si hay servicios opcionales y guarda la elección.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CookieConsent } from '../../src/components/CookieConsent';
import { openConsentPreferences, readConsent } from '../../src/lib/consent';

vi.mock('../../src/lib/analytics', async (orig) => ({
  ...(await orig<object>()),
  iniciarGoogle: vi.fn(),
  registrarPagina: vi.fn(),
  hayServiciosOpcionales: () => servicios.on,
}));
const servicios = vi.hoisted(() => ({ on: true }));

afterEach(() => { localStorage.clear(); servicios.on = true; });

describe('aviso de cookies', () => {
  it('no aparece si no hay Google Analytics ni AdSense configurados', () => {
    servicios.on = false;
    render(<MemoryRouter><CookieConsent /></MemoryRouter>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('en la primera visita pregunta y «Solo necesarias» lo deniega todo', async () => {
    render(<MemoryRouter><CookieConsent /></MemoryRouter>);
    expect(screen.getByRole('dialog', { name: 'Tu privacidad' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Política de cookies' }).getAttribute('href')).toBe('/politicas/cookies');
    await userEvent.click(screen.getByRole('button', { name: 'Solo necesarias' }));
    expect(readConsent()).toMatchObject({ analytics: false, ads: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('permite aceptar solo la medición y reabrirse desde las preferencias', async () => {
    render(<MemoryRouter><CookieConsent /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Configurar' }));
    await userEvent.click(screen.getByLabelText(/Medición \(Google Analytics\)/));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar mi elección' }));
    expect(readConsent()).toMatchObject({ analytics: true, ads: false });
    expect(screen.queryByRole('dialog')).toBeNull();
    openConsentPreferences();
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect((screen.getByLabelText(/Medición \(Google Analytics\)/) as HTMLInputElement).checked).toBe(true);
  });
});
