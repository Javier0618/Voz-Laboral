// Página de avisos con la capa de datos simulada.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({ isConfigured: true, supabase: {}, requireClient: () => ({}) }));
vi.mock('../../src/auth/AuthProvider', () => ({
  useAuth: () => ({ loading: false, session: { user: { id: 'u1' } }, profile: { id: 'u1', alias: 'turno_de_noche', status: 'activa' } }),
}));

const markNotificationsRead = vi.fn().mockResolvedValue(null);
vi.mock('../../src/lib/api', () => ({
  listNotifications: () =>
    Promise.resolve([
      { id: 'n1', kind: 'comentario', experience_id: 'e1', experience_title: 'Pagos puntuales', company_name: 'Empresa Demo', count: 3, new_status: null, read_at: null, created_at: '2026-10-27T10:00:00Z', experience_public: true },
      { id: 'n2', kind: 'estado', experience_id: 'e2', experience_title: 'Turnos largos', company_name: 'Empresa Demo', count: 1, new_status: 'requiere_ajustes', read_at: null, created_at: '2026-10-26T10:00:00Z', experience_public: false },
      { id: 'n3', kind: 'reaccion', experience_id: 'e1', experience_title: 'Pagos puntuales', company_name: 'Empresa Demo', count: 1, new_status: null, read_at: '2026-10-26T12:00:00Z', created_at: '2026-10-25T10:00:00Z', experience_public: true },
    ]),
  markNotificationsRead: (...a: unknown[]) => markNotificationsRead(...a),
}));

import Notifications from '../../src/pages/Notifications';

describe('avisos', () => {
  it('agrupa, enlaza a cada experiencia y permite marcar todo como leído', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Notifications /></MemoryRouter>);
    expect(await screen.findByText('3 comentarios nuevos en tu experiencia')).toBeInTheDocument();
    expect(screen.getByText('2 sin leer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /3 comentarios nuevos/ })).toHaveAttribute('href', '/experiencias/e1');
    expect(screen.getByRole('link', { name: /Te pidieron ajustes/ })).toHaveAttribute('href', '/cuenta');
    expect(screen.getByText('Alguien reaccionó a tu experiencia')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Marcar todo como leído' }));
    expect(markNotificationsRead).toHaveBeenCalledWith();
  });
});
