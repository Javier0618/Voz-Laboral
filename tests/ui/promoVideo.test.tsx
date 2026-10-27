// Video de presentación: no se descarga ni se abre hasta que alguien lo pide.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PromoVideoInline, PromoVideoTeaser } from '../../src/components/PromoVideo';

describe('video de presentación', () => {
  it('la tarjeta de la portada abre el video solo al pulsarla, con subtítulos', async () => {
    const { container } = render(<PromoVideoTeaser />);
    expect(container.querySelector('video')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /Mira cómo funciona/ }));
    const video = container.querySelector('dialog video') as HTMLVideoElement;
    expect(video.getAttribute('preload')).toBe('none');
    expect(video.querySelector('track[kind="captions"]')?.getAttribute('srclang')).toBe('es');
    await userEvent.click(screen.getByRole('button', { name: /Cerrar/ }));
    expect(container.querySelector('dialog video')).toBeNull();
  });

  it('el video de «Cómo funciona» no se descarga antes de reproducirlo', () => {
    const { container } = render(<PromoVideoInline />);
    expect(container.querySelector('video')?.getAttribute('preload')).toBe('none');
    expect(screen.getByRole('button', { name: /Ver el video/ })).toBeTruthy();
  });
});
