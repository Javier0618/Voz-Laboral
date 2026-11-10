import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { OPEN_EVENT, readConsent, saveConsent } from '../lib/consent';
import { adsenseClient, hayServiciosOpcionales, iniciarGoogle, registrarPagina } from '../lib/analytics';

/**
 * Aviso de cookies: aparece en la primera visita si hay Google Analytics o
 * AdSense. Las cookies opcionales de medición y publicidad requieren una
 * elección explícita; las necesarias permanecen activas. Se
 * reabre desde «Preferencias de cookies», al pie de página. También registra
 * las páginas vistas.
 */
export function CookieConsent() {
  const activo = hayServiciosOpcionales();
  // La publicidad solo se menciona y se ofrece si AdSense está activo.
  const conAnuncios = Boolean(adsenseClient());
  const [abierto, setAbierto] = useState(() => activo && readConsent() === null);
  const [detalle, setDetalle] = useState(false);
  const previo = readConsent();
  const [ads, setAds] = useState(previo?.ads ?? false);
  const [analytics, setAnalytics] = useState(previo?.analytics ?? false);
  const location = useLocation();

  useEffect(() => {
    if (activo) iniciarGoogle();
  }, [activo]);

  useEffect(() => {
    const abrir = () => {
      const c = readConsent();
      setAds(c?.ads ?? false);
      setAnalytics(c?.analytics ?? false);
      setDetalle(true);
      setAbierto(true);
    };
    window.addEventListener(OPEN_EVENT, abrir);
    return () => window.removeEventListener(OPEN_EVENT, abrir);
  }, []);

  // Página vista en cada cambio de ruta (el título se actualiza justo después).
  useEffect(() => {
    if (!activo) return;
    const t = window.setTimeout(() => registrarPagina(location.pathname), 300);
    return () => window.clearTimeout(t);
  }, [activo, location.pathname]);

  if (!activo || !abierto) return null;

  const guardar = (choice: { analytics: boolean; ads: boolean }) => {
    saveConsent(choice);
    setAbierto(false);
    setDetalle(false);
  };

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookies-titulo"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper shadow-[0_-8px_30px_rgba(15,36,64,0.12)] print:hidden"
    >
      <div className="page py-5">
        <h2 id="cookies-titulo" className="font-sans text-base font-semibold text-ink">Tu privacidad</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate">
          {conAnuncios
            ? 'Usamos cookies para mejorar tu experiencia y navegación. También medimos las visitas y, si lo autorizas, mostramos publicidad personalizada. Conoce los detalles en nuestra'
            : 'Usamos cookies para mejorar tu experiencia y navegación, y medir las visitas al sitio. Conoce los detalles en nuestra'}{' '}
          <Link to="/politicas/cookies/" className="btn-link">Política de cookies</Link>
        </p>

        {detalle && (
          <fieldset className="mt-4 max-w-3xl space-y-3">
            <legend className="sr-only">Elige qué cookies aceptas</legend>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked disabled className="mt-1" />
              <span><strong className="text-ink">Necesarias.</strong> <span className="text-slate">Sesión, preferencias y tu decisión sobre las cookies. Siempre activas.</span></span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1" />
              <span><strong className="text-ink">Medición (Google Analytics).</strong> <span className="text-slate">Nos ayuda a saber qué contenidos se consultan y mejorar el sitio. Es opcional.</span></span>
            </label>
            {conAnuncios && (
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" checked={ads} onChange={(e) => setAds(e.target.checked)} className="mt-1" />
                <span><strong className="text-ink">Publicidad personalizada (Google AdSense).</strong> <span className="text-slate">Si no la aceptas, verás anuncios no personalizados.</span></span>
              </label>
            )}
          </fieldset>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {conAnuncios ? (
            <>
              <button type="button" className="btn-primary" onClick={() => guardar({ analytics: true, ads: true })}>Aceptar todas</button>
              <button type="button" className="btn-secondary" onClick={() => guardar({ analytics: false, ads: false })}>Rechazar (solo necesarias)</button>
              {detalle ? (
                <button type="button" className="btn-secondary" onClick={() => guardar({ analytics, ads })}>Guardar mi elección</button>
              ) : (
                <button type="button" className="btn-link px-2" onClick={() => setDetalle(true)}>Configurar</button>
              )}
            </>
          ) : (
            <>
              <button type="button" className="btn-primary" onClick={() => guardar({ analytics: true, ads: false })}>Aceptar todas</button>
              <button type="button" className="btn-secondary" onClick={() => guardar({ analytics: false, ads: false })}>Rechazar (solo necesarias)</button>
              {detalle ? (
                <button type="button" className="btn-secondary" onClick={() => guardar({ analytics, ads: false })}>Guardar mi elección</button>
              ) : (
                <button type="button" className="btn-link px-2" onClick={() => setDetalle(true)}>Configurar</button>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
