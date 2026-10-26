import { Link } from 'react-router-dom';
import { formatDate, formatPeriod } from '../lib/format';
import { relationshipLabels, type PublicExperience } from '../shared/domain';
import { FileIcon, ReplyIcon } from './Icons';
import { Monogram } from './Monogram';
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
    <article className="border-b border-line py-8" aria-labelledby={`exp-${e.id}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <Link
          to={`/experiencias?categoria=${e.category_id}`}
          className="rounded-full border border-line bg-mist px-2.5 py-0.5 font-medium text-navy no-underline hover:border-navy/40"
        >
          {e.category_name}
        </Link>
        <span className="text-muted">{formatPeriod(e.period_start, e.period_end)}</span>
        <span aria-hidden="true" className="hidden text-line sm:inline">|</span>
        <span className="text-muted">{relationshipLabels[e.relationship]}</span>
        {e.status !== 'publicada' && <StatusChip status={e.status} />}
      </div>

      <h3 id={`exp-${e.id}`} className="mt-3 max-w-prose text-2xl leading-snug sm:text-[1.7rem]">
        {e.title ?? `Experiencia en ${e.company_name}`}
      </h3>
      {showCompany && (
        <p className="mt-1">
          <Link to={`/empresas/${e.company_slug}`} className="font-medium">{e.company_name}</Link>
        </p>
      )}

      <div className="prose-reading mt-4 space-y-4">
        <p className="whitespace-pre-line">{e.account_direct}</p>
        {e.account_third_party && (
          <div className="border-l-2 border-line pl-4">
            <p className="font-sans text-sm font-semibold text-muted">Lo que conoce por terceros</p>
            <p className="mt-1 whitespace-pre-line text-ink/90">{e.account_third_party}</p>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        <span className="flex items-center gap-2">
          <Monogram text={e.author_alias} size="sm" tone="action" />
          <span>
            <span className="font-semibold text-ink">{e.author_alias}</span> · {formatDate(e.published_at)}
          </span>
        </span>
        {e.has_documents && (
          <span className="flex items-center gap-1.5">
            <FileIcon width={16} height={16} />
            Dice tener documentos (no publicados)
          </span>
        )}
        <span className="ml-auto">
          <ReportButton experienceId={e.id} />
        </span>
      </div>

      {response && (
        <section aria-label="Respuesta de la empresa" className="mt-5 rounded-lg border border-navy/20 bg-mist p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-navy">
            <ReplyIcon width={18} height={18} />
            Respuesta de la empresa · {formatDate(response.published_at)}
          </p>
          <p className="mt-2 max-w-prose whitespace-pre-line text-ink">{response.body}</p>
          <div className="mt-1 text-sm">
            <ReportButton responseId={response.id} />
          </div>
        </section>
      )}
    </article>
  );
}
