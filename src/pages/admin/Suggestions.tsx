// Sugerencias editoriales: temas que el redactor propone publicar o actualizar.
// La administración pide la redacción, descarta o marca como existente; la
// guía redactada llega como borrador y se publica desde el editor de siempre.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  applySuggestionProposal, deleteSuggestion, listGuideSuggestions, setSuggestionStatus, type GuideSuggestion,
} from '../../lib/adminApi';
import { formatDate } from '../../lib/format';
import { TEMAS_GUIAS } from '../../lib/temasGuias';
import type { AppError } from '../../lib/supabase';
import { GuideBody } from '../../components/GuideBody';
import { Alert, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, Loading, useAsync } from '../../components/ui';

type Filter = 'nueva' | 'pedida' | 'redactada' | 'publicada' | 'archivo';

/** Redactada y ya publicada (guía nueva) o aplicada (actualización). */
const isPublished = (s: GuideSuggestion) =>
  s.status === 'redactada' && (s.kind === 'nueva' ? s.draft?.status === 'publicado' : Boolean(s.decided_at));

const filters: { id: Filter; label: string; match: (s: GuideSuggestion) => boolean }[] = [
  { id: 'nueva', label: 'Nuevas', match: (s) => s.status === 'nueva' },
  { id: 'pedida', label: 'Pedidas', match: (s) => s.status === 'pedida' },
  { id: 'redactada', label: 'Redactadas', match: (s) => s.status === 'redactada' && !isPublished(s) },
  { id: 'publicada', label: 'Publicadas', match: isPublished },
  { id: 'archivo', label: 'Descartadas', match: (s) => s.status === 'descartada' || s.status === 'existente' },
];
const priorityStyle: Record<GuideSuggestion['priority'], string> = {
  alta: 'border-amber/40 bg-amber-tint text-amber',
  media: 'border-line bg-mist text-navy',
  baja: 'border-line bg-paper text-slate',
};
const topicName = (slug: string) => TEMAS_GUIAS.find((t) => t.slug === slug)?.name;

export function Suggestions() {
  const { data, loading, error, reload } = useAsync(() => listGuideSuggestions(), []);
  const [filter, setFilter] = useState<Filter>('nueva');
  const count = (f: Filter) => (data ?? []).filter(filters.find((x) => x.id === f)!.match).length;
  const visible = (data ?? []).filter(filters.find((x) => x.id === filter)!.match);
  const order = { alta: 0, media: 1, baja: 2 };
  if (filter === 'nueva') visible.sort((a, b) => order[a.priority] - order[b.priority]);

  return (
    <section>
      <p className="max-w-prose text-slate">
        Temas que conviene publicar o actualizar, con el motivo y sus fuentes. Pulsa «Redactar guía» en los que te interesen: la guía llega
        como <strong>borrador</strong> y la publicas desde Guías después de revisarla.
      </p>
      <div role="tablist" aria-label="Estado de las sugerencias" className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${filter === f.id ? 'border-ink bg-ink text-white' : 'border-line text-slate hover:border-slate hover:text-ink'}`}>
            {f.label}{data ? ` · ${count(f.id)}` : ''}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : !visible.length ? (
          <EmptyState title={filter === 'nueva' ? 'No hay sugerencias nuevas' : 'No hay sugerencias aquí'}>
            {filter === 'nueva'
              ? 'Las sugerencias las crea el redactor después de revisar las fuentes oficiales. Pídelo en una conversación con Claude: «revisa qué guías conviene publicar».'
              : filter === 'pedida'
                ? 'Cuando pulses «Redactar guía» en una sugerencia, aparecerá aquí hasta que el redactor la escriba.'
                : filter === 'publicada'
                  ? 'Aquí quedan las sugerencias cuya guía ya publicaste, o cuya actualización aplicaste.'
                  : 'Nada por ahora.'}
          </EmptyState>
        ) : (
          <ul className="space-y-5">{visible.map((s) => <SuggestionCard key={s.id} s={s} onDone={reload} />)}</ul>
        )}
      </div>
    </section>
  );
}

function SuggestionCard({ s, onDone }: { s: GuideSuggestion; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [preview, setPreview] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  async function act(task: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await task();
      onDone();
    } catch (err) {
      setError((err as AppError).message);
    } finally {
      setBusy(false);
    }
  }

  const topic = topicName(s.topic);
  return (
    <li className="rounded-lg border border-line bg-paper p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className={`rounded-full border px-2.5 py-0.5 ${priorityStyle[s.priority]}`}>Prioridad {s.priority}</span>
        <span className="rounded-full border border-line px-2.5 py-0.5 text-slate">{s.kind === 'nueva' ? 'Guía nueva' : 'Actualizar una guía'}</span>
        {topic && <span className="rounded-full border border-line px-2.5 py-0.5 text-slate">{topic}</span>}
        <span className="font-normal text-slate">Sugerida el {formatDate(s.created_at)}</span>
      </div>
      <h3 className="mt-3 font-serif text-2xl leading-snug">{s.title}</h3>
      {s.kind === 'actualizar' && s.target && (
        <p className="mt-1 text-sm text-slate">
          Guía: <Link to={`/moderacion/guias/${s.target.id}`} className="btn-link font-normal">{s.target.title}</Link>
          {s.target.status === 'publicado' ? ' (publicada)' : ''}
        </p>
      )}
      <dl className="mt-4 space-y-3 text-[0.9375rem]">
        <div><dt className="font-semibold">Por qué publicarla</dt><dd className="mt-0.5 max-w-prose text-slate">{s.reason}</dd></div>
        {s.demand && <div><dt className="font-semibold">Interés</dt><dd className="mt-0.5 max-w-prose text-slate">{s.demand}</dd></div>}
        {s.keywords.length > 0 && (
          <div>
            <dt className="font-semibold">Búsquedas a las que respondería</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">{s.keywords.map((k) => <span key={k} className="rounded bg-mist px-2 py-0.5 text-sm text-navy">{k}</span>)}</dd>
          </div>
        )}
        {s.sources.length > 0 && (
          <div>
            <dt className="font-semibold">Fuentes</dt>
            <dd>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {s.sources.map((f) => (
                  <li key={f.url}><a href={f.url} target="_blank" rel="noopener noreferrer" className="btn-link font-normal">{f.label}<span className="sr-only"> (se abre en otra pestaña)</span></a></li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        {s.instructions && <div><dt className="font-semibold">Tus indicaciones</dt><dd className="mt-0.5 max-w-prose text-slate">{s.instructions}</dd></div>}
      </dl>

      {error && <div className="mt-4"><Alert tone="error">{error}</Alert></div>}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        {s.status === 'nueva' && (
          <>
            <button type="button" className="btn-primary" disabled={busy} onClick={() => setAsking(true)}>
              {s.kind === 'nueva' ? 'Redactar guía' : 'Redactar actualización'}
            </button>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => act(() => setSuggestionStatus(s.id, 'existente'))}>Ya la tenemos</button>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => act(() => setSuggestionStatus(s.id, 'descartada'))}>Descartar</button>
          </>
        )}
        {s.status === 'pedida' && (
          <>
            <p className="text-sm text-slate">Pedida el {formatDate(s.requested_at!)}. El redactor la escribirá en su próxima revisión.</p>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => act(() => setSuggestionStatus(s.id, 'nueva'))}>Cancelar pedido</button>
          </>
        )}
        {s.status === 'redactada' && s.kind === 'nueva' && (
          s.draft ? (
            <>
              {s.draft.status === 'publicado'
                ? <Link to={`/derechos/${s.draft.slug}`} className="btn-secondary">Ver la guía publicada</Link>
                : <Link to={`/moderacion/guias/${s.draft.id}`} className="btn-primary">Revisar el borrador</Link>}
              <p className="text-sm text-slate">
                Redactada el {formatDate(s.drafted_at!)} · {s.draft.status === 'publicado' ? 'publicada' : 'en borrador, sin publicar'}
              </p>
            </>
          ) : <p className="text-sm text-slate">El borrador de esta sugerencia se borró.</p>
        )}
        {s.status === 'redactada' && s.kind === 'actualizar' && (
          s.decided_at || applied ? (
            <>
              <p className="text-sm text-slate">Propuesta aplicada{s.decided_at ? ` el ${formatDate(s.decided_at)}` : ''}.</p>
              {s.target && <Link to={`/moderacion/guias/${s.target.id}`} className="btn-secondary">Abrir la guía</Link>}
            </>
          ) : (
            <>
              <button type="button" className="btn-primary" disabled={busy} onClick={() => setPreview(true)}>Ver propuesta</button>
              <button type="button" className="btn-secondary" disabled={busy || !s.target} onClick={() => setApplying(true)}>Aplicar a la guía</button>
              <button type="button" className="btn-secondary" disabled={busy} onClick={() => act(() => setSuggestionStatus(s.id, 'descartada'))}>Descartar</button>
            </>
          )
        )}
        {(s.status === 'descartada' || s.status === 'existente') && (
          <>
            <p className="text-sm text-slate">{s.status === 'existente' ? 'Marcada como «ya la tenemos»' : 'Descartada'}{s.decided_at ? ` el ${formatDate(s.decided_at)}` : ''}.</p>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => act(() => setSuggestionStatus(s.id, 'nueva'))}>Reabrir</button>
            <button type="button" className="btn-danger" disabled={busy} onClick={() => setRemoving(true)}>Eliminar</button>
          </>
        )}
      </div>

      <RequestDialog open={asking} suggestion={s} onClose={() => setAsking(false)}
        onConfirm={(instructions) => act(() => setSuggestionStatus(s.id, 'pedida', instructions)).then(() => setAsking(false))} busy={busy} />
      <Dialog open={preview} onClose={() => setPreview(false)} title="Propuesta de actualización">
        {s.proposal_notes && <Alert tone="info" title="Qué cambia">{s.proposal_notes}</Alert>}
        <div className="mt-4 max-h-[60vh] overflow-y-auto rounded border border-line p-4">{s.proposal && <GuideBody content={s.proposal} />}</div>
      </Dialog>
      <ConfirmDialog open={applying} onClose={() => setApplying(false)} title="¿Aplicar la propuesta a la guía?" confirmLabel="Aplicar" tone="primary" busy={busy}
        onConfirm={() => act(async () => { await applySuggestionProposal(s.id); setApplied(s.id); setApplying(false); })}>
        El texto de «{s.target?.title}» se reemplaza por el propuesto.
        {s.target?.status === 'publicado' ? ' La guía está publicada: el cambio se verá de inmediato. Revisa la propuesta antes.' : ''}
      </ConfirmDialog>
      <ConfirmDialog open={removing} onClose={() => setRemoving(false)} title="¿Eliminar esta sugerencia?" confirmLabel="Eliminar" busy={busy}
        onConfirm={() => act(async () => { await deleteSuggestion(s.id); setRemoving(false); })}>
        «{s.title}» se borra de forma definitiva. Si el redactor vuelve a encontrar el tema, podrá sugerirlo de nuevo.
      </ConfirmDialog>
    </li>
  );
}

function RequestDialog({ open, suggestion: s, busy, onClose, onConfirm }: {
  open: boolean; suggestion: GuideSuggestion; busy: boolean; onClose: () => void; onConfirm: (instructions: string) => void;
}) {
  const [instructions, setInstructions] = useState('');
  return (
    <Dialog open={open} onClose={onClose} title={s.kind === 'nueva' ? 'Pedir la redacción de la guía' : 'Pedir la actualización'}>
      <p className="text-slate">
        El redactor escribirá «{s.title}» con la plantilla editorial, sus fuentes oficiales y lo necesario para buscadores.{' '}
        {s.kind === 'nueva' ? 'Llegará como borrador: nada se publica sin tu revisión.' : 'Llegará como propuesta: tú decides si la aplicas.'}
      </p>
      <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); onConfirm(instructions); }}>
        <Field label="Indicaciones para el redactor" optional hint="Por ejemplo: enfócate en trabajadores por días, incluye un ejemplo con el salario mínimo.">
          {(p) => <textarea {...p} className="input min-h-[96px]" maxLength={2000} value={instructions} onChange={(e) => setInstructions(e.target.value)} />}
        </Field>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Enviando…' : 'Pedir redacción'}</button>
        </div>
      </form>
    </Dialog>
  );
}

