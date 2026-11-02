import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { setRouteDefaults } from '../lib/meta';

/**
 * Pone la dirección canónica de cada ruta antes de que la página defina la
 * suya. Va antes de las rutas: sus efectos se ejecutan primero.
 */
export function RouteMeta() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    setRouteDefaults(pathname);
  }, [pathname]);
  return null;
}
