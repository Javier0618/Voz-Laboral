import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { claimTrackedExperience, getTrackedExperience } from '../lib/api';
import { formatDate } from '../lib/format';
import type { AppError } from '../lib/supabase';
import { reactionLabels, Comments } from '../components/Engagement';
import { Alert, ConfigNotice, EmptyState, ErrorState, Loading, notConfigured, PageHeader, StatusChip, statusHint, ToneChip, useAsync } from '../components/ui';

/** Seguimiento privado de una experiencia enviada sin cuenta. */
export default function Tracking() {
  const { token = '' } = useParams();
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => (notConfigured ? Promise.resolve(null) : getTrackedExperience(token)), [token]);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  if (notConfigured) return <div className="page py-10"><ConfigNotice /></div>;
  if (loading) return <div className="page py-10"><Loading /></div>;
  if (error) return <div className="page py-10"><ErrorState error={error} onRetry={reload} /></div>;
  if (!data) {
    return (
      <div className="page py-10">
        <EmptyState title="Este enlace no es válido" action={<Link to="/cuenta" className="btn-primary">Ir a Mi cuenta</Link>}>
          Puede que esté incompleto o que la experiencia ya se haya vinculado a una cuenta. En ese caso, la encontrarás en Mi cuenta.
        </EmptyState>
      </div>
    );
  }

  async function claim() {
    setClaiming(true);
    setClaimError(null);
    try {
      await claimTrackedExperience(token);
      navigate('/cuenta');
    } catch (err) {
      setClaimError((err as AppError).message);
      setClaiming(false);
    }
  }

  const visible = data.status === 'publicada' || data.status === 'en_disputa';

  return (
    <div className="page py-10">
      <PageHeader title="Seguimiento de tu experiencia">
        Este enlace es privado: quien lo tenga puede ver este seguimiento. No lo compartas.
      </PageHeader>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="estado">
          <div className="flex flex-wrap items-center gap-3">
            <StatusChip status={data.status} />
            <ToneChip tone={data.tone} />
            <span className="text-sm text-slate">Enviada el {formatDate(data.created_at)}</span>
          </div>
          <h2 id="estado" className="mt-4 text-3xl">{data.title || data.category_name}</h2>
          <p className="mt-1 text-slate">{data.company_name}, {data.category_name}</p>
          <p className="mt-4 max-w-prose">{statusHint(data.status)}</p>
          {data.status_reason && (
            <p className="mt-3 max-w-prose rounded bg-mist px-4 py-3 text-sm"><span className="font-semibold">Motivo de la decisión:</span> {data.status_reason}</p>
          )}

          {visible ? (
            <>
              <h3 className="mt-10 font-sans text-base font-semibold">Cómo han reaccionado</h3>
              <dl className="mt-3 grid max-w-md grid-cols-3 gap-3">
                {(['me_paso', 'me_sirvio', 'gracias'] as const).map((k) => (
                  <div key={k} className="rounded-lg border border-line p-3">
                    <dt className="text-xs text-slate">{reactionLabels[k].label}</dt>
                    <dd className="mt-1 font-serif text-2xl">{data.reactions[k] ?? 0}</dd>
                  </div>
                ))}
              </dl>
              <Comments experienceId={data.id} enabled count={data.comments_count} startOpen />
              <Link to={`/empresas/${data.company_slug}#e-${data.id}`} className="btn-secondary mt-6">Ver publicada</Link>
            </>
          ) : (
            <p className="mt-8 max-w-prose text-sm text-slate">
              Cuando se publique, aquí verás las reacciones y los comentarios de otras personas.
            </p>
          )}
        </section>

        <aside className="space-y-4" aria-label="Vincular a una cuenta">
          <div className="rounded-lg bg-ink p-6 text-white">
            <h2 className="font-serif text-xl text-white">Guárdala en tu cuenta</h2>
            <p className="mt-2 text-sm leading-6 text-white/80">
              Al vincularla podrás verla en Mi cuenta, editarla si te piden ajustes, apelar decisiones y responder comentarios con tu alias.
            </p>
            {!session ? (
              <Link to={`/cuenta?siguiente=/seguimiento/${token}`} className="btn mt-4 w-full bg-white text-ink hover:bg-teal-tint">
                Crear cuenta o iniciar sesión
              </Link>
            ) : !profile?.alias ? (
              <Link to="/cuenta" className="btn mt-4 w-full bg-white text-ink hover:bg-teal-tint">Elige tu alias primero</Link>
            ) : (
              <button type="button" className="btn mt-4 w-full bg-white text-ink hover:bg-teal-tint" disabled={claiming} onClick={claim}>
                {claiming ? 'Vinculando…' : 'Vincular a mi cuenta'}
              </button>
            )}
          </div>
          {claimError && <Alert tone="error">{claimError}</Alert>}
          <p className="text-sm text-slate">Al vincularla, se publicará con tu alias en lugar de «Persona sin cuenta».</p>
        </aside>
      </div>
    </div>
  );
}
