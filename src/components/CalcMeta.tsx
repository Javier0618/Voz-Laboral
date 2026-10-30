import { useEffect, type ReactNode } from 'react';
import { setPageMeta } from '../lib/meta';
import { calculadoraPorPath, metaCalculadora } from '../lib/calculadoras';

/** Asigna title/description OG al montar una calculadora. */
export function CalcMeta({ path, children }: { path: string; children: ReactNode }) {
  useEffect(() => {
    const info = calculadoraPorPath(path);
    if (info) setPageMeta(metaCalculadora(info));
    return () => setPageMeta(null);
  }, [path]);
  return <>{children}</>;
}
