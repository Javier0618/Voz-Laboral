import { Link } from 'react-router-dom';
import { formatDate, formatPeriod } from '../lib/format';
import { relationshipLabels, type PublicExperience } from '../shared/domain';
import { ReportButton } from './ReportDialog';
import { StatusChip } from './StatusChip';

export interface ResponseLike {
  id: string;
  body: string;
  published_at: string;
}

export function ExperienceItem({
  experience: e,
  showCompany = true,
  response,
}: {
  experience: PublicExperience;
  showCompany?: boolean;
  response?: ResponseLike;
}) {
  return (
    <article className="border-b border-line py-6" aria-labelledby={`exp-${e.id}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <span className="font-medium text-ink">{e.category_name}</span>
        <span aria-hidden="true">·</span>
        <span>{formatPeriod(e.period_start, e.period_end)}</span>
        <span aria-hidden="true">·</span>
        <span>{relationshipLabels[e.relationship]}</span>
        {e.status !== 'publicada' && <StatusChip status={e.status} />}
      </div>
      <h3 id={`exp-${e.id}`} className="mt-2 text-2xl">
        {e.title ?? `Experiencia en ${e.company_name}`}
      </h3>
      {showCompany && (
        <p className="mt-1">
          <Link to={`/empresas/${e.company_slug}`}>{e.company_name}</Link>
        </p>
      )}
      <div className="prose-reading mt-3 space-y-3">
        <p className="whitespace-pre-line">{e.account_direct}</p>
        {e.account_third_party && (
          <div className="border-l-2 border-line pl-4">
            <p className="font-sans text-sm font-medium text-muted">Lo que conoce por terceros</p>
            <p className="whitespace-pre-line">{e.account_third_party}</p>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 text-sm text-muted">
        <span>
          Publicada por <span className="font-medium text-ink">{e.author_alias}</span> el {formatDate(e.published_at)}
        </span>
        {e.has_documents && <span>Dice disponer de documentos (no publicados)</span>}
        <ReportButton experienceId={e.id} />
      </div>
      {response && (
        <section aria-label="Respuesta de la empresa" className="mt-4 rounded-md border border-navy/20 bg-mist p-4">
          <p className="text-sm font-semibold text-navy">Respuesta de la empresa · {formatDate(response.published_at)}</p>
          <p className="mt-2 whitespace-pre-line text-ink">{response.body}</p>
          <div className="mt-1">
            <ReportButton responseId={response.id} />
          </div>
        </section>
      )}
    </article>
  );
}
