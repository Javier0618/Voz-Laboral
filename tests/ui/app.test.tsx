import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '../../src/App';
import { AuthProvider } from '../../src/auth/AuthProvider';
import { ToastProvider } from '../../src/components/Toast';
import { StatusChip } from '../../src/components/StatusChip';
import { experienceStatuses, statusLabels } from '../../src/shared/domain';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('sin variables de Supabase', () => {
  it('el inicio muestra el buscador, el diagrama de privacidad y el aviso de configuración', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Busca una empresa' })).toBeInTheDocument();
    expect(screen.getByText('Lo que ven otros')).toBeInTheDocument();
    expect(screen.getByText('Lo que queda privado')).toBeInTheDocument();
    expect(screen.getByText('Tu correo electrónico')).toBeInTheDocument();
    expect(screen.getByText(/Falta configurar la conexión con Supabase/)).toBeInTheDocument();
  });

  it.each(['/empresas', '/experiencias', '/compartir', '/cuenta', '/admin'])('%s muestra el aviso en lugar de datos', async (path) => {
    renderAt(path);
    expect(await screen.findByRole('alert')).toHaveTextContent('Falta configurar la conexión con Supabase');
  });
});

describe('estructura accesible', () => {
  it('tiene enlace para saltar al contenido, navegación y pie con enlaces legales', () => {
    renderAt('/');
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute('href', '#contenido');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'contenido');
    const legal = screen.getByRole('navigation', { name: 'Legal y contacto' });
    for (const name of ['Política de datos', 'Términos', 'Reglas', 'Privacidad', 'Contacto']) {
      expect(legal).toContainElement(screen.getByRole('link', { name }));
    }
  });

  it.each(['/politica-de-datos', '/terminos', '/reglas', '/privacidad', '/contacto'])(
    '%s lleva la marca de revisión legal',
    (path) => {
      renderAt(path);
      expect(screen.getByText(/Requiere revisión de abogado colombiano/)).toBeInTheDocument();
    },
  );

  it('los chips de estado siempre incluyen texto', () => {
    for (const s of experienceStatuses) {
      const { unmount } = render(<StatusChip status={s} />);
      expect(screen.getByText(statusLabels[s])).toBeInTheDocument();
      unmount();
    }
  });
});
