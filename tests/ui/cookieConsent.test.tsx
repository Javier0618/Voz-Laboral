// Aviso de cookies: informa sobre medición y publicidad opcionales.
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

  it('sin AdSense informa de la medición y permite rechazarla', async () => {
    render(<MemoryRouter><CookieConsent /></MemoryRouter>);
    const aviso = screen.getByRole('dialog', { name: 'Tu privacidad' });
    expect(aviso.textContent).toMatch(/mejorar tu experiencia y navegación/);
    expect(aviso.textContent).toMatch(/medir las visitas al sitio/);
    expect(aviso.textContent).not.toMatch(/publicidad/i);
    expect(screen.getByRole('link', { name: 'Política de cookies' }).getAttribute('href')).toBe('/politicas/cookies/');
    expect(screen.getByRole('button', { name: 'Rechazar (solo necesarias)' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Rechazar (solo necesarias)' }));
    expect(readConsent()).toMatchObject({ analytics: false, ads: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('se reabre desde las preferencias y permite elegir medición', async () => {
    render(<MemoryRouter><CookieConsent /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Rechazar (solo necesarias)' }));
    openConsentPreferences();
    expect(await screen.findByRole('dialog')).toBeTruthy();
    const medicion = screen.getByLabelText(/Medición \(Google Analytics\)/) as HTMLInputElement;
    expect(medicion.checked).toBe(false);
    expect(medicion.disabled).toBe(false);
  });

  it('con AdSense pregunta solo por la publicidad personalizada', async () => {
    servicios.ads = true;
    render(<MemoryRouter><CookieConsent /></MemoryRouter>);
    expect(screen.getByRole('dialog').textContent).toMatch(/mejorar tu experiencia y navegación/);
    expect(screen.getByRole('dialog').textContent).toMatch(/publicidad personalizada/i);
    await userEvent.click(screen.getByRole('button', { name: 'Rechazar (solo necesarias)' }));
    expect(readConsent()).toMatchObject({ analytics: false, ads: false });
    localStorage.clear();
  });

  it('con AdSense permite aceptar la publicidad personalizada', async () => {
    servicios.ads = true;
    render(<MemoryRouter><CookieConsent /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Aceptar todas' }));
    expect(readConsent()).toMatchObject({ analytics: true, ads: true });
  });
});
