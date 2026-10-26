import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { LoadingState } from './States';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, session } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingState label="Comprobando tu sesión" />;
  if (!session) {
    return (
      <div className="py-6">
        <h1 className="text-3xl">Necesitas iniciar sesión</h1>
        <p className="mt-2 max-w-prose text-muted">Para continuar, ingresa con tu cuenta o crea una nueva.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="btn-primary" to="/cuenta/ingresar" state={{ from: location.pathname }}>
            Ingresar
          </Link>
          <Link className="btn-secondary" to="/cuenta/registro">
            Crear cuenta
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
