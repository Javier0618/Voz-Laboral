import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { brand } from '../config/brand';
import { useAuth } from '../auth/AuthProvider';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center rounded px-2 no-underline ${
    isActive ? 'font-semibold text-ink underline decoration-action decoration-2 underline-offset-8' : 'text-muted hover:text-ink'
  }`;

export function Layout() {
  const { session, isModerator } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  // Al navegar, cierra el menú y lleva el foco al contenido principal.
  useEffect(() => {
    setMenuOpen(false);
    if (first.current) {
      first.current = false;
      return;
    }
    mainRef.current?.focus();
    window.scrollTo?.(0, 0);
  }, [location.pathname]);

  const links = (
    <>
      <li><NavLink to="/empresas" className={navClass}>Empresas</NavLink></li>
      <li><NavLink to="/experiencias" className={navClass}>Experiencias</NavLink></li>
      <li><NavLink to="/derechos" className={navClass}>Tus derechos</NavLink></li>
      {isModerator && <li><NavLink to="/admin" className={navClass}>Moderación</NavLink></li>}
      <li><NavLink to={session ? '/cuenta' : '/cuenta/ingresar'} className={navClass}>{session ? 'Mi cuenta' : 'Ingresar'}</NavLink></li>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-paper focus:px-4 focus:py-2"
      >
        Saltar al contenido
      </a>
      <header className="border-b border-line bg-paper">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-ink no-underline">
            <span aria-hidden="true" className="inline-block h-6 w-1.5 rounded-sm bg-action" />
            <span className="font-serif text-2xl font-semibold">{brand.name}</span>
          </Link>
          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-4">{links}</ul>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/compartir" className="btn-primary hidden sm:inline-flex">
              Compartir experiencia
            </Link>
            <button
              type="button"
              className="btn-secondary md:hidden"
              aria-expanded={menuOpen}
              aria-controls="menu-movil"
              onClick={() => setMenuOpen((v) => !v)}
            >
              Menú
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="menu-movil" aria-label="Principal" className="border-t border-line md:hidden">
            <ul className="container-page flex flex-col py-2">
              {links}
              <li>
                <NavLink to="/compartir" className={navClass}>Compartir experiencia</NavLink>
              </li>
            </ul>
          </nav>
        )}
      </header>

      <main id="contenido" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-line bg-mist">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-[2fr_3fr]">
          <div>
            <p className="font-serif text-xl font-semibold text-ink">{brand.name}</p>
            <p className="mt-1 max-w-prose text-muted">{brand.tagline}.</p>
          </div>
          <nav aria-label="Legal y contacto">
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              <li><Link className="inline-flex min-h-11 items-center" to="/politica-de-datos">Política de datos</Link></li>
              <li><Link className="inline-flex min-h-11 items-center" to="/terminos">Términos</Link></li>
              <li><Link className="inline-flex min-h-11 items-center" to="/reglas">Reglas</Link></li>
              <li><Link className="inline-flex min-h-11 items-center" to="/privacidad">Privacidad</Link></li>
              <li><Link className="inline-flex min-h-11 items-center" to="/contacto">Contacto</Link></li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
