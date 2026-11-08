import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShareLinkButton } from '../../src/components/ShareLinkButton';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Compartir guías y calculadoras', () => {
  it('utiliza el menú nativo cuando está disponible y comparte solo la URL canónica', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });
    render(<ShareLinkButton title="Salud mental" path="/derechos/salud-mental/" label="Compartir guía" />);
    fireEvent.click(screen.getByRole('button', { name: 'Compartir guía' }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({
      title: 'Salud mental', url: 'https://tuvozlaboral.com/derechos/salud-mental/',
    }));
  });

  it('copia el enlace cuando no hay menú nativo sin compartir resultados personales', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    render(<ShareLinkButton title="Calculadora de prima" path="/calculadoras/prima/" />);
    fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://tuvozlaboral.com/calculadoras/prima/'));
    expect(screen.getByRole('status').textContent).toBe('Enlace copiado');
  });

  it('no copia el enlace si se cancela el menú nativo', async () => {
    const writeText = vi.fn();
    const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'));
    vi.stubGlobal('navigator', { share, clipboard: { writeText } });
    render(<ShareLinkButton title="Acoso laboral" path="/derechos/acoso/" />);
    fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
    await waitFor(() => expect(share).toHaveBeenCalledOnce());
    expect(writeText).not.toHaveBeenCalled();
  });
});
