import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PublicExperience } from '../lib/api';
import { reportExperience } from '../lib/api';
import { formatDate, formatPeriod, relationshipLabel } from '../lib/format';
import { fieldErrors, reportSchema } from '../lib/schemas';
import type { AppError } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Alert, Dialog, Field, StatusChip, ToneChip } from './ui';
import { Comments, ReactionBar, useEngagement } from './Engagement';

const PREVIEW = 600;

export function ExperienceItem({ exp, showCompany = true, full = false }: { exp: PublicExperience; showCompany?: boolean; full?: boolean }) {
  const [expanded, setExpanded] = useState(full);
  const [reporting, setReporting] = useState(false);
  const [engagement, setEngagement] = useEngagement(exp.id);
  const long = exp.body.length > PREVIEW;
  const text = expanded || !long ? exp.body : `${exp.body.slice(0, PREVIEW).trimEnd()}…`;

  return (
    <article id={`e-${exp.id}`} className="scroll-mt-6 border-t border-line py-8 first:border-t-0 first:pt-2" aria-labelledby={`exp-${exp.id}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <ToneChip tone={exp.tone} />
        <Link
          to={`/experiencias?categoria=${exp.category_slug}`}
          className="rounded-full border border-teal/30 bg-teal-tint px-3 py-0.5 font-semibold text-teal-strong hover:border-teal"
        >
          {exp.category_name}
        </Link>
        <span className="text-slate">{formatPeriod(exp.period_start, exp.period_end)}</span>
        {exp.status === 'en_disputa' && <StatusChip status="en_disputa" />}
      </div>
      {full ? (
        <h1 id={`exp-${exp.id}`} className="mt-4 text-4xl font-medium leading-[1.1] tracking-[-0.01em] sm:text-5xl">
          {exp.title || exp.category_name}
        </h1>
      ) : (
        <h3 id={`exp-${exp.id}`} className="mt-3 text-2xl leading-tight">
          <Link to={`/experiencias/${exp.id}`} className="hover:underline hover:decoration-teal/60 hover:underline-offset-4">
            {exp.title || exp.category_name}
          </Link>
        </h3>
      )}
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate">
        {showCompany && (
          <>
            <Link to={`/empresas/${exp.company_slug}`} className="btn-link">{exp.company_name}</Link>
            <span aria-hidden="true">·</span>
          </>
        )}
        <span>
          Por <span className="font-semibold text-ink">{exp.author_alias}</span>
        </span>
        <span aria-hidden="true">·</span>
        <span>{relationshipLabel[exp.relationship]}</span>
      </p>
      <div className="folio-margin mt-5">
        <p className="testimony">{text}</p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {long && (
          <button type="button" className="btn-link" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Mostrar menos' : 'Leer completo'}
          </button>
        )}
        {exp.has_documents && <span className="text-slate">El autor indica que dispone de documentos</span>}
        {exp.published_at && (
          <Link to={`/experiencias/${exp.id}`} className="text-slate hover:text-ink hover:underline">
            Publicada el {formatDate(exp.published_at)}
          </Link>
        )}
        <span className="ml-auto flex items-center gap-x-5">
          <ShareButton exp={exp} />
          <button type="button" className="text-slate underline-offset-4 hover:text-danger hover:underline" onClick={() => setReporting(true)}>
            Reportar
          </button>
        </span>
      </div>
      <ReactionBar experienceId={exp.id} engagement={engagement} onChange={setEngagement} />
      {engagement && (
        <Comments
          experienceId={exp.id}
          enabled={engagement.comments_enabled}
          count={engagement.comments}
          onCountChange={(n) => setEngagement((e) => (e ? { ...e, comments: n } : e))}
          startOpen={full}
        />
      )}
      <ReportDialog experienceId={exp.id} open={reporting} onClose={() => setReporting(false)} />
    </article>
  );
}

export function experienceUrl(id: string) {
  return `${window.location.origin}/experiencias/${id}`;
}

/** Compartir: menú nativo del teléfono si existe; si no, WhatsApp o copiar el enlace. */
export function ShareButton({ exp, variant = 'link' }: { exp: PublicExperience; variant?: 'link' | 'button' }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = experienceUrl(exp.id);
  const title = `${exp.title || exp.category_name} · ${exp.company_name}`;
  const message = `Mira esta experiencia sobre ${exp.company_name} en VozLaboral: ${url}`;

  async function share() {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* cancelado o no disponible: se muestran las otras opciones */
      }
    }
    setOpen((v) => !v);
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-expanded={open}
        onClick={share}
        className={variant === 'button' ? 'btn-secondary' : 'text-slate underline-offset-4 hover:text-ink hover:underline'}
      >
        Compartir
      </button>
      {open && (
        <span className="absolute right-0 top-full z-20 mt-2 flex w-56 flex-col rounded-lg border border-line bg-paper p-2 text-sm shadow-lg">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded px-3 py-2 text-ink hover:bg-mist"
          >
            Enviar por WhatsApp<span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
          <button
            type="button"
            className="rounded px-3 py-2 text-left text-ink hover:bg-mist"
            onClick={() => navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => setCopied(false))}
          >
            {copied ? 'Enlace copiado' : 'Copiar enlace'}
          </button>
          <span role="status" className="sr-only">{copied ? 'Enlace copiado' : ''}</span>
        </span>
      )}
    </span>
  );
}

const reasons = [
  { value: 'datos_personales', label: 'Expone datos personales de alguien' },
  { value: 'amenaza', label: 'Contiene amenazas o incita a la violencia' },
  { value: 'falso_o_enganoso', label: 'Contiene información falsa o engañosa' },
  { value: 'contenido_confidencial', label: 'Revela documentos o información confidencial' },
  { value: 'spam', label: 'Es publicidad o contenido automatizado' },
  { value: 'otro', label: 'Otro motivo' },
];

function ReportDialog({ experienceId, open, onClose }: { experienceId: string; open: boolean; onClose: () => void }) {
  const { session } = useAuth();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = reportSchema.safeParse({ reason, details });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setBusy(true);
    setError(null);
    try {
      await reportExperience(experienceId, parsed.data.reason, parsed.data.details);
      setDone(true);
    } catch (err) {
      setError(err as AppError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Reportar esta experiencia">
      {!session ? (
        <p className="text-slate">
          Para evitar reportes automatizados, necesitas una cuenta. <Link to="/cuenta" className="btn-link">Inicia sesión o crea una cuenta</Link>.
        </p>
      ) : done ? (
        <div className="space-y-4">
          <Alert tone="success" title="Reporte enviado">Gracias. El equipo de moderación lo revisará.</Alert>
          <button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <fieldset>
            <legend className="label">Motivo</legend>
            <div className="mt-2 space-y-2">
              {reasons.map((r) => (
                <label key={r.value} className="flex items-start gap-3 text-sm">
                  <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="mt-1 h-4 w-4 accent-teal" />
                  {r.label}
                </label>
              ))}
            </div>
            {errors.reason && <p className="field-error">{errors.reason}</p>}
          </fieldset>
          <Field label="Detalles" optional hint="Explica qué parte del texto te preocupa." error={errors.details}>
            {(p) => <textarea {...p} className="input min-h-[96px]" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} />}
          </Field>
          {error && <Alert tone="error">{error.message}</Alert>}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Enviando…' : 'Enviar reporte'}</button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
