// Sin variables de Supabase la app debe avisar, no simular datos.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

// Las pruebas no deben depender de .env.local ni llegar nunca a una base de datos real.
vi.mock('../../src/lib/supabase', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/lib/supabase')>()),
  isConfigured: false,
  supabase: null,
}));

import { AuthProvider } from '../../src/auth/AuthProvider';
import { AppRoutes } from '../../src/App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('aplicación sin configurar', () => {
  it('la portada muestra el aviso de configuración y marca el ejemplo como ilustrativo', async () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: /Cómo es trabajar ahí/ })).toBeInTheDocument();
    expect(screen.getByText('Falta conectar la base de datos')).toBeInTheDocument();
    expect(screen.getByText(/Ejemplo ilustrativo/)).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('las páginas de datos no inventan contenido', async () => {
    renderAt('/empresas');
    expect(screen.getByText('Falta conectar la base de datos')).toBeInTheDocument();
    expect(screen.queryByRole('listitem', { name: /Empresa/ })).not.toBeInTheDocument();
  });

  it('el panel de moderación no se muestra a visitantes', async () => {
    renderAt('/');
    expect(screen.queryByRole('link', { name: 'Moderación' })).not.toBeInTheDocument();
  });

  it('las políticas se muestran sin avisos de borrador ni apartados pendientes', async () => {
    renderAt('/politicas/tratamiento-de-datos');
    expect(screen.getByRole('heading', { name: 'Política de tratamiento de datos personales' })).toBeInTheDocument();
    expect(screen.queryByText(/borrador|pendiente/i)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\[[^\]]*\]/);
  });

  it('muestra una página útil para rutas inexistentes', async () => {
    renderAt('/no-existe');
    expect(screen.getByRole('heading', { name: 'Esta página no existe' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toBeInTheDocument();
  });
});
