import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { listNotifications, markNotificationsRead, type AppNotification } from '../lib/api';
import { formatDate } from '../lib/format';
import type { AppError } from '../lib/supabase';
import { ConfigNotice, EmptyState, ErrorState, Loading, notConfigured, PageHeader, statusLabel, useAsync } from '../components/ui';

function message(n: AppNotification) {
  if (n.kind === 'comentario') return n.count === 1 ? 'Alguien comentó tu experiencia' : `${n.count} comentarios nuevos en tu experiencia`;
  if (n.kind === 'respuesta') return n.count === 1 ? 'Alguien respondió tu comentario' : `${n.count} respuestas a tu comentario`;
  if (n.kind === 'reaccion') return n.count === 1 ? 'Alguien reaccionó a tu experiencia' : `${n.count} reacciones nuevas a tu experiencia`;
  if (n.new_status === 'publicada') return 'Tu experiencia se publicó';
  if (n.new_status === 'requiere_ajustes') return 'Te pidieron ajustes en tu experiencia';
  return `Tu experiencia cambió a «${n.new_status ? statusLabel(n.new_status) : 'otro estado'}»`;
}

function target(n: AppNotification) {
  // Las decisiones de moderación se consultan en Mi cuenta, con su motivo.
  if (n.kind === 'estado' && n.new_status !== 'publicada') return '/cuenta';
  return n.experience_public ? `/experiencias/${n.experience_id}` : '/cuenta';
}

const icon: Record<AppNotification['kind'], string> = { comentario: '“', respuesta: '↩', reaccion: '+', estado: '•' };

export default function Notifications() {
  const { session, loading: authLoading } = useAuth();
  const { data, loading, error, reload } = useAsync(
    () => (notConfigured || !session ? Promise.resolve([]) : listNotifications()),
    [session?.user.id],
  );
  const [markError, setMarkError] = useState<string | null>(null);
  const unread = (data ?? []).filter((n) => !n.read_at);

  useEffect(() => {
    document.title = 'Avisos · VozLaboral';
  }, []);

  async function markAll() {
    setMarkError(null);
    try {
      await markNotificationsRead();
      window.dispatchEvent(new Event('vozlaboral:avisos'));
      reload();
    } catch (err) {
      setMarkError((err as AppError).message);
    }
  }

  async function open(n: AppNotification) {
    if (n.read_at) return;
    try {
      await markNotificationsRead([n.id]);
      window.dispatchEvent(new Event('vozlaboral:avisos'));
    } catch {
      /* el aviso se marcará después */
    }
  }

  if (notConfigured) return <div className="page py-10"><ConfigNotice /></div>;
  if (authLoading) return <div className="page py-10"><Loading /></div>;

  return (
    <div className="page max-w-3xl py-10">
      <PageHeader title="Avisos">Lo que pasa con tus experiencias: decisiones de moderación, reacciones y comentarios.</PageHeader>
      {!session ? (
        <div className="mt-8">
          <EmptyState title="Inicia sesión para ver tus avisos" action={<Link to="/cuenta?siguiente=/avisos" className="btn-primary">Iniciar sesión</Link>}>
            Si compartiste sin cuenta, usa tu enlace privado de seguimiento.
          </EmptyState>
        </div>
      ) : loading ? (
        <Loading />
      ) : error ? (
        <div className="mt-8"><ErrorState error={error} onRetry={reload} /></div>
      ) : !data?.length ? (
        <div className="mt-8">
          <EmptyState title="Aún no tienes avisos" action={<Link to="/compartir" className="btn-primary">Compartir una experiencia</Link>}>
            Cuando moderen tu experiencia o alguien reaccione o comente, te lo contamos aquí.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate" aria-live="polite">
              {unread.length ? `${unread.length} sin leer` : 'Todo leído'}
            </p>
            {unread.length > 0 && <button type="button" className="btn-secondary" onClick={markAll}>Marcar todo como leído</button>}
          </div>
          {markError && <p className="field-error">{markError}</p>}
          <ul className="mt-3 border-t border-ink/80">
            {data.map((n) => (
              <li key={n.id} className="border-b border-line">
                <Link to={target(n)} onClick={() => open(n)} className="group grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 py-5">
                  <span
                    aria-hidden="true"
                    className={`flex h-9 w-9 items-center justify-center rounded-full font-serif text-lg ${n.read_at ? 'bg-mist text-slate' : 'bg-ink text-white'}`}
                  >
                    {icon[n.kind]}
                  </span>
                  <span>
                    <span className={`block ${n.read_at ? 'text-slate' : 'font-semibold text-ink'}`}>
                      {message(n)}
                      {!n.read_at && <span className="sr-only"> (sin leer)</span>}
                    </span>
                    <span className="mt-0.5 block text-sm text-slate group-hover:underline">
                      «{n.experience_title}» · {n.company_name}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate">{formatDate(n.created_at)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
