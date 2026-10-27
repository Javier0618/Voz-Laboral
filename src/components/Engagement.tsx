import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  addComment,
  addReaction,
  deleteMyComment,
  getEngagement,
  listComments,
  removeReaction,
  reportComment,
  type Engagement,
  type ExperienceComment,
  type ReactionKind,
} from '../lib/api';
import { formatDate } from '../lib/format';
import { COMMENT_MAX, commentSchema, detectPersonalData } from '../lib/schemas';
import type { AppError } from '../lib/supabase';
import { Alert } from './ui';

// ---------------------------------------------------------------- carga agrupada
// Las experiencias de una página piden su interacción a la vez: se juntan en
// una sola consulta en lugar de una por experiencia.
let pending: { id: string; resolve: (e: Engagement | null) => void }[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function loadEngagement(id: string): Promise<Engagement | null> {
  return new Promise((resolve) => {
    pending.push({ id, resolve });
    if (timer) return;
    timer = setTimeout(async () => {
      const batch = pending;
      pending = [];
      timer = null;
      try {
        const rows = await getEngagement([...new Set(batch.map((b) => b.id))]);
        batch.forEach((b) => b.resolve(rows.find((r) => r.experience_id === b.id) ?? null));
      } catch {
        batch.forEach((b) => b.resolve(null));
      }
    }, 20);
  });
}

export const reactionLabels: Record<ReactionKind, { label: string; short: string }> = {
  me_paso: { label: 'Me pasó igual', short: 'Me pasó igual' },
  me_sirvio: { label: 'Me sirvió', short: 'Me sirvió' },
  gracias: { label: 'Gracias por compartir', short: 'Gracias' },
};

const KINDS: ReactionKind[] = ['me_paso', 'me_sirvio', 'gracias'];

export function useEngagement(experienceId: string) {
  const [data, setData] = useState<Engagement | null>(null);
  useEffect(() => {
    let active = true;
    loadEngagement(experienceId).then((e) => active && setData(e));
    return () => {
      active = false;
    };
  }, [experienceId]);
  return [data, setData] as const;
}

// ---------------------------------------------------------------- reacciones
export function ReactionBar({ experienceId, engagement, onChange }: {
  experienceId: string;
  engagement: Engagement | null;
  onChange: (e: Engagement) => void;
}) {
  const { session } = useAuth();
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<ReactionKind | null>(null);
  if (!engagement) return null;

  async function toggle(kind: ReactionKind) {
    if (!session) return setNeedsLogin(true);
    if (!engagement) return;
    const mine = engagement.my_reactions.includes(kind);
    setBusy(kind);
    setError(null);
    // Actualización optimista: se revierte si la base de datos lo rechaza.
    const next: Engagement = {
      ...engagement,
      [kind]: engagement[kind] + (mine ? -1 : 1),
      my_reactions: mine ? engagement.my_reactions.filter((k) => k !== kind) : [...engagement.my_reactions, kind],
    };
    onChange(next);
    try {
      if (mine) await removeReaction(experienceId, kind);
      else await addReaction(experienceId, kind);
    } catch (err) {
      onChange(engagement);
      setError((err as AppError).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-5">
      <div role="group" aria-label="Reacciones" className="flex flex-wrap gap-2">
        {KINDS.map((k) => {
          const active = engagement.my_reactions.includes(k);
          return (
            <button
              key={k}
              type="button"
              aria-pressed={active}
              disabled={busy === k}
              onClick={() => toggle(k)}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors ${
                active ? 'border-teal bg-teal-tint text-teal-strong' : 'border-line bg-paper text-ink hover:border-slate'
              }`}
            >
              {reactionLabels[k].short}
              <span className={`tabular-nums ${active ? 'text-teal-strong' : 'text-slate'}`}>{engagement[k]}</span>
            </button>
          );
        })}
      </div>
      {needsLogin && !session && (
        <p className="mt-2 text-sm text-slate" role="status">
          <Link to="/cuenta" className="btn-link">Inicia sesión o crea una cuenta</Link> para reaccionar. Así contamos una reacción por persona.
        </p>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------- comentarios
function CommentReport({ experienceId, commentId, onDone }: { experienceId: string; commentId: string; onDone: () => void }) {
  const [reason, setReason] = useState('datos_personales');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  if (done) return <p className="mt-2 text-sm text-slate" role="status">Gracias. La moderación revisará este comentario.</p>;
  return (
    <form
      className="mt-2 flex flex-wrap items-center gap-2 text-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await reportComment(experienceId, commentId, reason, '');
          setDone(true);
        } catch (err) {
          setError((err as AppError).message);
        }
      }}
    >
      <label className="sr-only" htmlFor={`motivo-${commentId}`}>Motivo del reporte</label>
      <select id={`motivo-${commentId}`} className="input min-h-[36px] w-auto py-1 text-sm" value={reason} onChange={(e) => setReason(e.target.value)}>
        <option value="datos_personales">Expone datos personales</option>
        <option value="amenaza">Amenaza o ataque personal</option>
        <option value="falso_o_enganoso">Información falsa o engañosa</option>
        <option value="spam">Publicidad o spam</option>
        <option value="otro">Otro motivo</option>
      </select>
      <button type="submit" className="btn-secondary min-h-[36px] py-1">Enviar reporte</button>
      <button type="button" className="text-slate hover:underline" onClick={onDone}>Cancelar</button>
      {error && <p className="field-error w-full">{error}</p>}
    </form>
  );
}

function ReplyForm({ experienceId, parentId, onDone }: { experienceId: string; parentId: string; onDone: (sent: boolean) => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-3"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const parsed = commentSchema.safeParse(text);
        if (!parsed.success) return setError(parsed.error.issues[0].message);
        setBusy(true);
        setError(null);
        try {
          await addComment(experienceId, parsed.data, parentId);
          onDone(true);
        } catch (err) {
          setError((err as AppError).message);
          setBusy(false);
        }
      }}
    >
      <label htmlFor={`respuesta-${parentId}`} className="sr-only">Tu respuesta</label>
      <textarea
        id={`respuesta-${parentId}`}
        className="input min-h-[72px]"
        maxLength={COMMENT_MAX}
        value={text}
        autoFocus
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe tu respuesta. Sin nombres ni datos de contacto."
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary min-h-[40px]" disabled={busy}>{busy ? 'Publicando…' : 'Responder'}</button>
        <button type="button" className="text-sm text-slate hover:underline" onClick={() => onDone(false)}>Cancelar</button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </form>
  );
}

function CommentItem({ c, experienceId, onChanged, replies = [], canReply = false, isReply = false }: {
  c: ExperienceComment;
  experienceId: string;
  onChanged: () => void;
  replies?: ExperienceComment[];
  canReply?: boolean;
  isReply?: boolean;
}) {
  const { session } = useAuth();
  const [reporting, setReporting] = useState(false);
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <li className={isReply ? 'mt-3 border-l-2 border-line pl-4' : 'border-t border-line py-4 first:border-t-0'}>
      <p className="flex flex-wrap items-center gap-x-2 text-sm">
        <span className="font-semibold">{c.author_alias}</span>
        {c.is_experience_author && <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-white">Autor de la experiencia</span>}
        <span className="text-slate">{formatDate(c.created_at)}</span>
        {c.status === 'retenido' && (
          <span className="rounded-full border border-amber/30 bg-amber-tint px-2 py-0.5 text-xs font-semibold text-amber">
            En revisión: solo lo ves tú
          </span>
        )}
      </p>
      <p className="mt-1 whitespace-pre-line text-ink">{c.body}</p>
      <div className="mt-1 flex gap-4 text-sm">
        {canReply && !replying && c.status === 'publicado' && (
          <button type="button" className="font-semibold text-teal-strong hover:underline" onClick={() => setReplying(true)}>Responder</button>
        )}
        {c.is_mine ? (
          <button
            type="button"
            className="text-slate hover:text-danger hover:underline"
            onClick={async () => {
              try {
                await deleteMyComment(c.id);
                onChanged();
              } catch (err) {
                setError((err as AppError).message);
              }
            }}
          >
            Borrar
          </button>
        ) : session && !reporting ? (
          <button type="button" className="text-slate hover:text-danger hover:underline" onClick={() => setReporting(true)}>Reportar</button>
        ) : null}
      </div>
      {reporting && <CommentReport experienceId={experienceId} commentId={c.id} onDone={() => setReporting(false)} />}
      {error && <p className="field-error">{error}</p>}
      {replies.length > 0 && (
        <ul aria-label={`Respuestas a ${c.author_alias}`}>
          {replies.map((r) => <CommentItem key={r.id} c={r} experienceId={experienceId} onChanged={onChanged} isReply />)}
        </ul>
      )}
      {replying && (
        <ReplyForm
          experienceId={experienceId}
          parentId={c.id}
          onDone={(sent) => {
            setReplying(false);
            if (sent) onChanged();
          }}
        />
      )}
    </li>
  );
}

export function Comments({ experienceId, enabled, count, onCountChange, startOpen = false }: {
  experienceId: string;
  enabled: boolean;
  count: number;
  onCountChange?: (n: number) => void;
  startOpen?: boolean;
}) {
  const { session, profile } = useAuth();
  const [open, setOpen] = useState(startOpen);
  const [items, setItems] = useState<ExperienceComment[] | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () =>
    listComments(experienceId)
      .then((rows) => {
        setItems(rows);
        onCountChange?.(rows.filter((r) => r.status === 'publicado').length);
      })
      .catch((err: AppError) => setError(err.message));

  useEffect(() => {
    if (open && items === null) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = commentSchema.safeParse(text);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await addComment(experienceId, parsed.data);
      setText('');
      if (detectPersonalData(parsed.data).length) {
        setNotice('Tu comentario parece incluir datos personales: quedó en revisión y solo tú lo ves por ahora.');
      }
      await reload();
    } catch (err) {
      setError((err as AppError).message);
    } finally {
      setBusy(false);
    }
  }

  const panelId = `comentarios-${experienceId}`;
  return (
    <div className="mt-4">
      <button type="button" className="btn-link text-sm" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
        {open ? 'Ocultar comentarios' : count > 0 ? `Ver ${count} ${count === 1 ? 'comentario' : 'comentarios'}` : enabled ? 'Comentar' : 'Comentarios desactivados'}
      </button>
      {open && (
        <div id={panelId} className="mt-3 max-w-prose rounded-lg border border-line px-5 py-2">
          {items === null && !error ? (
            <p className="py-4 text-sm text-slate">Cargando comentarios…</p>
          ) : items && items.length > 0 ? (
            <ul>
              {items.filter((c) => !c.parent_id).map((c) => (
                <CommentItem
                  key={c.id}
                  c={c}
                  experienceId={experienceId}
                  onChanged={reload}
                  replies={items.filter((r) => r.parent_id === c.id)}
                  canReply={enabled && Boolean(session && profile?.alias)}
                />
              ))}
            </ul>
          ) : (
            <p className="py-4 text-sm text-slate">{enabled ? 'Aún no hay comentarios. Puedes ser la primera persona en comentar.' : 'Su autor desactivó los comentarios.'}</p>
          )}

          {enabled && (
            <div className="border-t border-line py-4">
              {!session ? (
                <p className="text-sm text-slate">
                  <Link to="/cuenta" className="btn-link">Inicia sesión o crea una cuenta</Link> para comentar.
                </p>
              ) : !profile?.alias ? (
                <p className="text-sm text-slate"><Link to="/cuenta" className="btn-link">Elige un alias</Link> para comentar.</p>
              ) : (
                <form onSubmit={submit} noValidate>
                  <label htmlFor={`nuevo-${experienceId}`} className="label">Tu comentario</label>
                  <textarea
                    id={`nuevo-${experienceId}`}
                    className="input min-h-[88px]"
                    maxLength={COMMENT_MAX}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Aporta tu experiencia o una palabra de apoyo. Sin nombres ni datos de contacto."
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Publicando…' : 'Publicar comentario'}</button>
                    <span className="text-sm text-slate">Se publica con tu alias.</span>
                  </div>
                </form>
              )}
              {error && <p className="field-error">{error}</p>}
              {notice && <div className="mt-3"><Alert tone="warning">{notice}</Alert></div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
