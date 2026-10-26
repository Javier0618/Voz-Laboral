import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { brand } from '../config/brand';
import { useAuth } from '../auth/AuthProvider';
import { BrandMark, CloseIcon, MenuIcon } from './Icons';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `relative inline-flex min-h-11 items-center px-1 text-[0.95rem] no-underline transition-colors ${
    isActive
      ? 'font-semibold text-ink after:absolute after:inset-x-1 after:-bottom-[13px] after:h-0.5 after:bg-action'
      : 'text-muted hover:text-ink'
  }`;

const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-12 items-center border-l-2 pl-3 no-underline ${
    isActive ? 'border-action font-semibold text-ink' : 'border-transparent text-muted hover:text-ink'
  }`;

function BrandLink() {
  return (
    <Link to="/" className="inline-flex min-h-11 items-center gap-2.5 text-ink no-underline" aria-label={`${brand.name}, inicio`}>
      <BrandMark />
      <span className="font-serif text-[1.6rem] font-semibold tracking-tight">{brand.name}</span>
    </Link>
  );
}

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

  const items = [
    { to: '/empresas', label: 'Empresas' },
    { to: '/experiencias', label: 'Experiencias' },
    { to: '/derechos', label: 'Tus derechos' },
    ...(isModerator ? [{ to: '/admin', label: 'Moderación' }] : []),
  ];
  const accountItem = { to: session ? '/cuenta' : '/cuenta/ingresar', label: session ? 'Mi cuenta' : 'Ingresar' };

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-paper focus:px-4 focus:py-2"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <BrandLink />
          <nav aria-label="Principal" className="hidden h-full md:block">
            <ul className="flex h-full items-center gap-6">
              {items.map((i) => (
                <li key={i.to}>
                  <NavLink to={i.to} className={navClass}>{i.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-3">
            <NavLink to={accountItem.to} className={(s) => `${navClass(s)} hidden md:inline-flex`}>
              {accountItem.label}
            </NavLink>
            <Link to="/compartir" className="btn-primary hidden min-h-10 sm:inline-flex">
              Compartir experiencia
            </Link>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line text-ink hover:bg-mist md:hidden"
              aria-expanded={menuOpen}
              aria-controls="menu-movil"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="menu-movil" aria-label="Principal" className="border-t border-line bg-paper md:hidden">
            <ul className="container-page flex flex-col gap-1 py-3">
              {[...items, accountItem].map((i) => (
                <li key={i.to}>
                  <NavLink to={i.to} className={mobileNavClass}>{i.label}</NavLink>
                </li>
              ))}
              <li className="pt-2">
                <Link to="/compartir" className="btn-primary w-full">Compartir experiencia</Link>
              </li>
            </ul>
          </nav>
        )}
      </header>

      <main id="contenido" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>

      <footer className="mt-20 bg-ink text-paper">
        <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-8 w-8" inverted />
              <span className="font-serif text-2xl font-semibold">{brand.name}</span>
            </div>
            <p className="mt-3 max-w-sm text-paper/75">{brand.tagline}. Sin puntuaciones ni rankings.</p>
          </div>
          <nav aria-label="Plataforma">
            <p className="font-semibold">Plataforma</p>
            <ul className="mt-2">
              {[['/empresas', 'Empresas'], ['/experiencias', 'Experiencias'], ['/derechos', 'Tus derechos'], ['/compartir', 'Compartir experiencia']].map(([to, label]) => (
                <li key={to}>
                  <Link className="inline-flex min-h-11 items-center text-paper/80 no-underline hover:text-paper hover:underline" to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Legal y contacto">
            <p className="font-semibold">Legal y contacto</p>
            <ul className="mt-2">
              {[['/politica-de-datos', 'Política de datos'], ['/terminos', 'Términos'], ['/reglas', 'Reglas'], ['/privacidad', 'Privacidad'], ['/contacto', 'Contacto']].map(([to, label]) => (
                <li key={to}>
                  <Link className="inline-flex min-h-11 items-center text-paper/80 no-underline hover:text-paper hover:underline" to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="border-t border-paper/15">
          <p className="container-page py-5 text-sm text-paper/70">
            Los relatos expresan la experiencia de quienes los publican y no han sido verificados como hechos.
            {` ${brand.name}`} no ofrece asesoría jurídica.
          </p>
        </div>
      </footer>
    </div>
  );
}
