import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { brand } from '../config/brand';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../auth/AuthProvider';
import { NotificationBell } from './NotificationBell';

// `wide`: en pantallas medianas se omite de la barra (sigue en el menú móvil y en el pie).
const nav = [
  { to: '/empresas', label: 'Empresas' },
  { to: '/experiencias', label: 'Experiencias' },
  { to: '/derechos', label: 'Tus derechos' },
  { to: '/calculadoras', label: 'Calculadoras' },
  { to: '/como-funciona', label: 'Cómo funciona', wide: true },
];

/** Logotipo: un folio con una línea tapada. Pensado para fondo tinta. */
export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <svg aria-hidden="true" width="30" height="30" viewBox="0 0 32 32">
        <rect x="4" y="2" width="24" height="28" rx="2" fill="#fff" />
        <rect x="9" y="9" width="14" height="2.5" rx="1" fill="rgb(var(--ink))" />
        <rect x="9" y="15" width="9" height="2.5" rx="1" fill="rgb(var(--teal))" />
        <rect x="9" y="21" width="12" height="2.5" rx="1" fill="rgb(var(--ink))" />
      </svg>
      <span className="font-serif text-[1.4375rem] font-semibold tracking-tight text-white">{brand.name}</span>
    </span>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return `whitespace-nowrap rounded px-2.5 py-2 text-[0.9375rem] font-medium xl:px-3 ${isActive ? 'text-white underline decoration-teal-tint/70 decoration-2 underline-offset-[10px]' : 'text-white/75 hover:text-white'}`;
}

/** Menú de la cuenta: agrupa Mi cuenta, Avisos, Moderación y Cerrar sesión. */
function AccountMenu() {
  const { profile, isModerator, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        ref.current?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = ['/cuenta', '/avisos', '/moderacion'].some((p) => location.pathname.startsWith(p));
  const item = 'block whitespace-nowrap rounded px-3 py-2.5 text-[0.9375rem] text-ink hover:bg-mist';
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="menu-cuenta"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-11 items-center gap-2 whitespace-nowrap rounded px-2.5 text-[0.9375rem] font-medium hover:bg-white/10 ${active ? 'text-white' : 'text-white/85 hover:text-white'}`}
      >
        <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
          </svg>
        </span>
        <span className="hidden xl:inline">Mi cuenta</span>
        <span className="sr-only xl:hidden">Mi cuenta</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="currentColor">
          <path d="M5.2 7.5a.75.75 0 0 1 1.06 0L10 11.24l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.56a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>
      {open && (
        <div id="menu-cuenta" className="absolute right-0 top-full z-40 mt-2 w-60 rounded-lg border border-line bg-paper p-1.5 shadow-xl">
          {profile?.alias && <p className="truncate px-3 pb-2 pt-1.5 text-sm text-slate">Conectado como <span className="font-semibold text-ink">{profile.alias}</span></p>}
          <Link to="/cuenta" className={item}>Mi cuenta</Link>
          <Link to="/avisos" className={item}>Avisos</Link>
          {isModerator && <Link to="/moderacion" className={item}>Moderación</Link>}
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            className={`${item} w-full text-left`}
            onClick={async () => {
              setOpen(false);
              await signOut();
              navigate('/');
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const { session, isModerator } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    document.getElementById('contenido')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-paper focus:px-4 focus:py-2 focus:shadow">
        Saltar al contenido
      </a>
      <header className="bg-brand">
        <div className="page flex h-16 items-center justify-between gap-4">
          <Link to="/" aria-label={`${brand.name}, inicio`}>
            <Logo />
          </Link>
          <nav aria-label="Principal" className="hidden items-center gap-0.5 lg:flex">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} className={(a) => `${navClass(a)} ${item.wide ? 'hidden xl:inline-block' : ''}`}>{item.label}</NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-1 lg:flex">
            <ThemeToggle />
            {session && <NotificationBell />}
            {session ? <AccountMenu /> : <NavLink to="/cuenta" className={navClass}>Iniciar sesión</NavLink>}
            <Link to="/compartir" className="btn ml-2 whitespace-nowrap bg-white text-ink hover:bg-teal-tint">
              <span>Compartir<span className="hidden xl:inline"> experiencia</span></span>
            </Link>
          </div>
          <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          {session && <NotificationBell />}
          <button
            type="button"
            className="btn border border-white/30 text-white hover:border-white"
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Cerrar menú' : 'Menú'}
          </button>
          </div>
        </div>
        {open && (
          <nav id="menu-movil" aria-label="Principal" className="border-t border-white/15 lg:hidden">
            <ul className="page flex flex-col py-2">
              <li><NavLink to="/" end className={navClass}>Inicio</NavLink></li>
              {nav.map((item) => (
                <li key={item.to}><NavLink to={item.to} className={navClass}>{item.label}</NavLink></li>
              ))}
              {isModerator && <li><NavLink to="/moderacion" className={navClass}>Moderación</NavLink></li>}
              <li><NavLink to="/cuenta" className={navClass}>{session ? 'Mi cuenta' : 'Iniciar sesión'}</NavLink></li>
              <li className="py-3"><Link to="/compartir" className="btn w-full bg-white text-ink hover:bg-teal-tint">Compartir experiencia</Link></li>
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
    <footer className="mt-20 bg-brand text-white">
      <div className="page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-serif text-xl font-semibold">{brand.name}</p>
          <p className="mt-3 max-w-sm text-sm text-white/75">
            Experiencias laborales buenas, malas y mixtas en {brand.country}, contadas con un alias. No somos una autoridad: publicar una
            experiencia no prueba que los hechos sean ciertos.
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
            <li><Link className="hover:text-white hover:underline" to="/como-funciona">Quiénes somos y cómo moderamos</Link></li>
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
