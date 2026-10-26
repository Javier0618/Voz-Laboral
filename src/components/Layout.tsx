import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { brand } from '../config/brand';
import { useAuth } from '../auth/AuthProvider';

const nav = [
  { to: '/empresas', label: 'Empresas' },
  { to: '/experiencias', label: 'Experiencias' },
  { to: '/derechos', label: 'Tus derechos' },
];

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <svg aria-hidden="true" width="28" height="28" viewBox="0 0 32 32">
        <rect width="32" height="32" rx="6" fill="rgb(var(--ink))" />
        <rect x="7" y="10" width="18" height="3" rx="1.5" fill="#fff" />
        <rect x="7" y="16" width="11" height="3" rx="1.5" fill="rgb(var(--teal))" />
        <rect x="7" y="22" width="14" height="3" rx="1.5" fill="#fff" />
      </svg>
      <span className="font-serif text-[1.375rem] font-semibold tracking-tight text-ink">{brand.name}</span>
    </span>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return `rounded px-3 py-2 text-sm font-semibold ${isActive ? 'text-teal-strong underline decoration-2 underline-offset-[10px]' : 'text-ink hover:text-teal-strong'}`;
}

export function Layout() {
  const { session, isModerator } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  // Al cambiar de página, el foco vuelve al contenido principal.
  useEffect(() => {
    document.getElementById('contenido')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-paper focus:px-4 focus:py-2 focus:shadow">
        Saltar al contenido
      </a>
      <header className="border-b border-line bg-paper">
        <div className="page flex h-16 items-center justify-between gap-4">
          <Link to="/" aria-label={`${brand.name}, inicio`}>
            <Logo />
          </Link>
          <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>{item.label}</NavLink>
            ))}
            {isModerator && <NavLink to="/moderacion" className={navClass}>Moderación</NavLink>}
            <NavLink to="/cuenta" className={navClass}>{session ? 'Mi cuenta' : 'Iniciar sesión'}</NavLink>
            <Link to="/compartir" className="btn-primary ml-2">Compartir experiencia</Link>
          </nav>
          <button
            type="button"
            className="btn-secondary lg:hidden"
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Cerrar menú' : 'Menú'}
          </button>
        </div>
        {open && (
          <nav id="menu-movil" aria-label="Principal" className="border-t border-line lg:hidden">
            <ul className="page flex flex-col py-2">
              <li><NavLink to="/" end className={navClass}>Inicio</NavLink></li>
              {nav.map((item) => (
                <li key={item.to}><NavLink to={item.to} className={navClass}>{item.label}</NavLink></li>
              ))}
              {isModerator && <li><NavLink to="/moderacion" className={navClass}>Moderación</NavLink></li>}
              <li><NavLink to="/cuenta" className={navClass}>{session ? 'Mi cuenta' : 'Iniciar sesión'}</NavLink></li>
              <li className="py-2"><Link to="/compartir" className="btn-primary w-full">Compartir experiencia</Link></li>
            </ul>
          </nav>
        )}
      </header>

      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-serif text-xl font-semibold">{brand.name}</p>
          <p className="mt-3 max-w-sm text-sm text-white/75">
            Plataforma independiente de experiencias laborales en {brand.country}. No es una autoridad judicial ni administrativa:
            publicar una experiencia no prueba que los hechos sean ciertos.
          </p>
        </div>
        <div>
          <h2 className="font-sans text-sm font-semibold text-white">Políticas</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li><Link className="hover:text-white hover:underline" to="/politicas/tratamiento-de-datos">Tratamiento de datos personales</Link></li>
            <li><Link className="hover:text-white hover:underline" to="/politicas/privacidad">Aviso de privacidad</Link></li>
            <li><Link className="hover:text-white hover:underline" to="/politicas/terminos">Términos de uso</Link></li>
            <li><Link className="hover:text-white hover:underline" to="/politicas/reglas">Reglas de publicación</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-sans text-sm font-semibold text-white">Contacto</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li><Link className="hover:text-white hover:underline" to="/politicas/solicitudes">Consultas y reclamos sobre tus datos</Link></li>
            <li><Link className="hover:text-white hover:underline" to="/empresas">Soy una empresa: solicitar una corrección</Link></li>
            {brand.contactEmail && (
              <li><a className="hover:text-white hover:underline" href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a></li>
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
}
