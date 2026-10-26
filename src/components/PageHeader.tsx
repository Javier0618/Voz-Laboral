import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { brand } from '../config/brand';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${brand.name}` : brand.name;
  }, [title]);
}

export interface Crumb {
  to: string;
  label: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 text-muted">
        <li><Link to="/" className="text-muted no-underline hover:text-ink hover:underline">Inicio</Link></li>
        {items.map((c) => (
          <li key={c.to} className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            <Link to={c.to} className="text-muted no-underline hover:text-ink hover:underline">{c.label}</Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Banda de encabezado de página: fondo niebla, título serif y entradilla.
export function PageHeader({
  title,
  children,
  crumbs,
  actions,
  narrow,
}: {
  title: string;
  children?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  narrow?: boolean;
}) {
  usePageTitle(title);
  return (
    <div className="border-b border-line bg-mist">
      <div className={`container-page py-10 sm:py-14 ${narrow ? 'max-w-3xl' : ''}`}>
        {crumbs && <Breadcrumbs items={crumbs} />}
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl leading-[1.1] sm:text-5xl">{title}</h1>
            {children && <div className="mt-3 max-w-prose text-lg text-muted">{children}</div>}
          </div>
          {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
