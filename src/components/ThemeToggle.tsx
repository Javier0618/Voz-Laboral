import { useEffect, useState } from 'react';
import { applyTheme, resolveTheme, setTheme, type Theme } from '../lib/theme';

/** Botón sol/luna para alternar modo claro y oscuro. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setLocal] = useState<Theme>('light');

  useEffect(() => {
    const t = resolveTheme();
    setLocal(t);
    applyTheme(t);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      try {
        if (localStorage.getItem('vl-theme')) return;
      } catch {
        return;
      }
      const next = resolveTheme(null);
      setLocal(next);
      applyTheme(next);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const next = theme === 'dark' ? 'light' : 'dark';
  const label = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  return (
    <button
      type="button"
      className={`flex h-11 w-11 items-center justify-center rounded text-white/85 hover:bg-white/10 hover:text-white ${className}`}
      aria-label={label}
      title={label}
      onClick={() => {
        setTheme(next);
        setLocal(next);
      }}
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5Z" />
        </svg>
      )}
    </button>
  );
}
