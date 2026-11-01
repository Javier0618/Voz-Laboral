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
  adsenseClient: () => (servicios.ads ? 'ca-pub-prueba' : undefined),
}));
const servicios = vi.hoisted(() => ({ on: true, ads: false }));

afterEach(() => { localStorage.clear(); servicios.on = true; servicios.ads = false; });

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

  it('sin AdSense solo habla de medición y «Aceptar todas» no concede publicidad', async () => {
    render(<MemoryRouter><CookieConsent /></MemoryRouter>);
    expect(screen.getByRole('dialog').textContent).not.toMatch(/publicidad/i);
    await userEvent.click(screen.getByRole('button', { name: 'Configurar' }));
    expect(screen.queryByLabelText(/Publicidad personalizada/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Aceptar todas' }));
    expect(readConsent()).toMatchObject({ analytics: true, ads: false });
  });

  it('con AdSense activo ofrece la publicidad personalizada', async () => {
    servicios.ads = true;
    render(<MemoryRouter><CookieConsent /></MemoryRouter>);
    expect(screen.getByRole('dialog').textContent).toMatch(/publicidad/i);
    await userEvent.click(screen.getByRole('button', { name: 'Aceptar todas' }));
    expect(readConsent()).toMatchObject({ analytics: true, ads: true });
  });
});
