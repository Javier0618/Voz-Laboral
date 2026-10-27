import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { unreadNotificationsCount } from '../lib/api';

// Contador de avisos sin leer. Se actualiza al navegar y cada 2 minutos
// mientras la pestaña está visible.
export function useUnreadCount() {
  const { session } = useAuth();
  const location = useLocation();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!session) {
      setCount(0);
      return;
    }
    let active = true;
    const load = () => {
      if (document.visibilityState === 'visible') unreadNotificationsCount().then((n) => active && setCount(n)).catch(() => undefined);
    };
    load();
    const timer = setInterval(load, 120_000);
    window.addEventListener('vozlaboral:avisos', load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('vozlaboral:avisos', load);
    };
  }, [session, location.pathname]);
  return count;
}

export function NotificationBell({ className = '' }: { className?: string }) {
  const count = useUnreadCount();
  const label = count > 0 ? `Avisos: ${count} sin leer` : 'Avisos';
  return (
    <Link to="/avisos" aria-label={label} title={label} className={`relative inline-flex h-11 w-11 items-center justify-center rounded text-white/85 hover:bg-white/10 hover:text-white ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </svg>
      {count > 0 && (
        <span aria-hidden="true" className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1 text-xs font-semibold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
