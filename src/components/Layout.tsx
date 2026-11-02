import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { brand } from '../config/brand';
import { ThemeToggle } from './ThemeToggle';
import { hayServiciosOpcionales } from '../lib/analytics';
import { openConsentPreferences } from '../lib/consent';
import { useAuth } from '../auth/AuthProvider';
import { NotificationBell } from './NotificationBell';

// `wide`: en pantallas medianas se omite de la barra (sigue en el menú móvil y en el pie).
const nav = [
  { to: '/derechos', label: 'Guías' },
  { to: '/experiencias', label: 'Experiencias' },
  { to: '/calculadoras', label: 'Calculadoras' },
  { to: '/empresas', label: 'Empresas' },
  { to: '/como-funciona', label: 'Quiénes somos', wide: true },
];

/**
 * Logotipo: «tuvozlaboral» con la «o» convertida en un globo de diálogo con
 * tres puntos, y ondas de sonido en diagonal tras «voz». Pensado para fondo tinta.
 */
const GLOBO = 'M11 4.2a7.3 7.3 0 1 1-4.9 12.8L3 19.6l1-4.2A7.3 7.3 0 0 1 11 4.2z';
export function Logo() {
  return (
    <span className="whitespace-nowrap font-sans text-[1.6875rem] font-bold leading-none tracking-[-0.03em] text-white">
      <span className="sr-only">{brand.name}</span>
      <span aria-hidden="true">
        tuv
        <svg viewBox="1.1 2.4 19.9 19.4" className="mx-[0.01em] inline-block h-[0.74em] w-auto align-[-0.13em]">
          <path d={GLOBO} fill="#2BB3A5" stroke="#2BB3A5" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="8" cy="11.5" r="1.3" fill="rgb(var(--surface-brand))" />
          <circle cx="11.2" cy="11.5" r="1.3" fill="rgb(var(--surface-brand))" />
          <circle cx="14.4" cy="11.5" r="1.3" fill="rgb(var(--surface-brand))" />
        </svg>
        z
        <svg viewBox="0 0 17 20" className="ml-[0.01em] mr-[-0.02em] inline-block h-[0.56em] w-auto origin-[0%_60%] -rotate-45 overflow-visible align-[0.25em]" fill="none" stroke="#2BB3A5" strokeWidth="2.6" strokeLinecap="round">
          <path d="M2 6.5a5 5 0 0 1 0 7" />
          <path d="M6.5 3a10 10 0 0 1 0 14" />
          <path d="M11 0a14.5 14.5 0 0 1 0 20" strokeOpacity=".5" />
        </svg>
        <span className="font-[450] text-white/80">laboral</span>
      </span>
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
            <Link to="/compartir" className="btn ml-2 whitespace-nowrap border border-white/40 text-white hover:border-white hover:bg-white/10">
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
              <li className="py-3"><Link to="/compartir" className="btn w-full border border-white/40 text-white hover:border-white hover:bg-white/10">Compartir experiencia</Link></li>
            </ul>
          </nav>
        )}
      </header>

      {/* min-h-screen: el pie queda bajo el pliegue mientras carga la página, así no «salta» (CLS). */}
      <main id="contenido" tabIndex={-1} className="min-h-screen flex-1 focus:outline-none">
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
            Guías laborales sobre tus derechos, las reformas y los cambios en el trabajo en {brand.country}, con fuentes oficiales. Además,
            experiencias de trabajadores contadas con alias y calculadoras de nómina. No somos una autoridad: la información es orientativa y
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
            <li><Link className="hover:text-white hover:underline" to="/politicas/cookies">Política de cookies</Link></li>
            {hayServiciosOpcionales() && (
              <li><button type="button" className="text-left hover:text-white hover:underline" onClick={openConsentPreferences}>Preferencias de cookies</button></li>
            )}
          </ul>
        </div>
        <div>
          <h2 className="font-sans text-sm font-semibold text-white">Contacto</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li><Link className="hover:text-white hover:underline" to="/como-funciona">Quiénes somos y cómo trabajamos</Link></li>
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
