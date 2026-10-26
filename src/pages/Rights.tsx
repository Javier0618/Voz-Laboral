import { PageHeader } from '../components/PageHeader';
import { EmptyState, ErrorState, LoadingState, Notice } from '../components/States';
import { SupabaseGate } from '../components/SupabaseGate';
import { listLegalResources } from '../lib/api';
import { formatDate } from '../lib/format';
import { useAsync } from '../lib/useAsync';

function VerificationTag({ status }: { status: 'pendiente_verificacion' | 'verificado' }) {
  return status === 'verificado' ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-action/30 bg-action-tint px-2.5 py-0.5 text-sm font-medium text-action">
      <span aria-hidden="true">●</span>Verificado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-sm font-medium text-warning">
      <span aria-hidden="true">◐</span>Pendiente de verificación
    </span>
  );
}

function Resources() {
  const data = useAsync(listLegalResources, []);
  if (data.status === 'loading') return <LoadingState label="Cargando guías" />;
  if (data.status === 'error') return <ErrorState message={data.error} onRetry={data.reload} />;
  if (data.data.length === 0) return <EmptyState title="Todavía no hay guías publicadas" />;
  return (
    <ul className="border-t border-line">
      {data.data.map((r) => (
        <li key={r.id} className="border-b border-line py-6">
          <article aria-labelledby={`r-${r.id}`}>
            <div className="flex flex-wrap items-center gap-3">
              <h2 id={`r-${r.id}`} className="text-2xl">{r.title}</h2>
              <VerificationTag status={r.verification_status} />
            </div>
            <p className="mt-2 max-w-prose text-lg text-muted">{r.summary}</p>
            {r.verification_status === 'verificado' && r.body ? (
              <div className="prose-reading mt-3 whitespace-pre-line">{r.body}</div>
            ) : (
              <p className="mt-3 max-w-prose text-ink">
                El contenido de esta guía está pendiente de verificación por un abogado colombiano. No lo publicamos
                hasta confirmarlo.
              </p>
            )}
            {r.verified_at && <p className="mt-2 text-sm text-muted">Verificado el {formatDate(r.verified_at)}</p>}
            {r.legal_resource_sources.length > 0 && (
              <div className="mt-3">
                <p className="font-medium">Fuentes</p>
                <ul className="mt-1 space-y-1">
                  {r.legal_resource_sources.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-2">
                      {s.url && s.verification_status === 'verificado' ? (
                        <a href={s.url} rel="noopener noreferrer" target="_blank">{s.citation}</a>
                      ) : (
                        <span>{s.citation}</span>
                      )}
                      <VerificationTag status={s.verification_status} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        </li>
      ))}
    </ul>
  );
}

export default function Rights() {
  return (
    <div className="container-page">
      <PageHeader title="Tus derechos">Guías prácticas sobre situaciones laborales frecuentes en Colombia.</PageHeader>
      <div className="py-6">
        <Notice tone="warning" title="Esto no es asesoría jurídica">
          Si tu caso es urgente, busca orientación de un abogado laboral o de las autoridades del trabajo. Solo
          mostramos normas y enlaces que hayan sido verificados.
        </Notice>
      </div>
      <SupabaseGate>
        <Resources />
      </SupabaseGate>
    </div>
  );
}
