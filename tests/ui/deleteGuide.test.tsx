// Panel: el diálogo de borrado pide motivo, avisa si está publicada y llama a la API.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({ isConfigured: true, supabase: {}, requireClient: () => ({}) }));
const api = vi.hoisted(() => ({ deleteGuide: vi.fn(() => Promise.resolve('guia-x')) }));
vi.mock('../../src/lib/adminApi', async (orig) => ({ ...(await orig<object>()), deleteGuide: api.deleteGuide }));

import { DeleteGuideDialog } from '../../src/pages/Admin';

const guide = {
  id: 'g1', slug: 'guia-x', title: 'Guía X', summary: 'Resumen', status: 'publicado' as const, last_verified_at: null, updated_at: '',
  legal_resource_sources: [], legal_resource_stats: null,
};

describe('borrar guía desde el panel', () => {
  it('confirma sin pedir motivo, avisa del enlace roto y borra', async () => {
    const onDone = vi.fn();
    const onClose = vi.fn();
    render(<MemoryRouter><DeleteGuideDialog guide={guide as never} open onClose={onClose} onDone={onDone} /></MemoryRouter>);
    expect(screen.getByText(/dejará de funcionar/)).toBeTruthy();
    expect(screen.queryByLabelText(/Motivo/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Borrar guía' }));
    expect(api.deleteGuide).toHaveBeenCalledWith('g1');
    expect(onDone).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
