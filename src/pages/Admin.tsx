// Panel de moderación. Ocultar este panel a quien no tiene rol es solo una
// comodidad: cada operación la autoriza la base de datos.
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  addCompanyAlias, createCompany, listAppeals, listClaims, listCommentsForModeration, listModerationEvents, listReports, listSuggestions, moderateComment, moderateExperience,
  moderationQueue, publishCompanyResponse, resolveAppeal, resolveClaim, resolveReport, resolveSuggestion, setSuspension,
  type ClaimRow, type QueueItem,
  createGuide, guideViews, listGuides, setGuideStatus, type GuideRow, type GuideStatus,
} from '../lib/adminApi';
import { listCategories, type ExperienceStatus } from '../lib/api';
import { formatDate, formatPeriod, plural, relationshipLabel } from '../lib/format';
import { normalizeText } from '../lib/schemas';
import type { AppError } from '../lib/supabase';
import {
  Alert, ConfigNotice, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, Loading, notConfigured, PageHeader, StatusChip, ToneChip, statusLabel, useAsync,
} from '../components/ui';

type Tab = 'cola' | 'comentarios' | 'reportes' | 'reclamaciones' | 'apelaciones' | 'catalogo' | 'guias' | 'historial';

const flagLabel: Record<string, string> = { correo: 'Correo', telefono: 'Teléfono', documento: 'Nº de documento', confidencial: 'Confidencial' };
const statuses: ExperienceStatus[] = ['en_revision', 'publicada', 'requiere_ajustes', 'en_disputa', 'restringida', 'retirada'];

export default function Admin() {
  const { session, isModerator, isAdmin, loading } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'cola';
  const setTab = (t: Tab) => setParams(t === 'cola' ? {} : { tab: t }, { replace: true });

  if (notConfigured) return <div className="page py-10"><ConfigNotice /></div>;
  if (loading) return <div className="page py-10"><Loading /></div>;
  if (!session || !isModerator) {
    return (
      <div className="page py-10">
        <Alert tone="warning" title="Acceso restringido">
          Esta sección es solo para el equipo de moderación. Si crees que deberías tener acceso, contacta con la administración.
        </Alert>
        <Link to="/" className="btn-secondary mt-6">Ir al inicio</Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; admin?: boolean }[] = [
    { id: 'cola', label: 'Cola de revisión' },
    { id: 'comentarios', label: 'Comentarios' },
    { id: 'reportes', label: 'Reportes' },
    { id: 'reclamaciones', label: 'Reclamaciones' },
    { id: 'apelaciones', label: 'Apelaciones' },
    { id: 'catalogo', label: 'Catálogo', admin: true },
    { id: 'guias', label: 'Guías', admin: true },
    { id: 'historial', label: 'Historial' },
  ];

  return (
    <div className="page py-10">
      <PageHeader title="Moderación">
        Cada decisión exige un motivo y queda registrada con su responsable. La moderación comprueba las reglas, no la veracidad de los hechos.
      </PageHeader>
      <div role="tablist" aria-label="Secciones de moderación" className="mt-6 flex flex-wrap gap-1 border-b border-line">
        {tabs.filter((t) => !t.admin || isAdmin).map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} id={`tab-${t.id}`} aria-controls={`panel-${t.id}`}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold ${tab === t.id ? 'border-teal text-teal-strong' : 'border-transparent text-slate hover:text-ink'}`}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-8">
        {tab === 'cola' && <Queue />}
        {tab === 'comentarios' && <CommentsModeration />}
        {tab === 'reportes' && <Reports />}
        {tab === 'reclamaciones' && <Claims />}
        {tab === 'apelaciones' && <Appeals />}
        {tab === 'catalogo' && isAdmin && <Catalog />}
        {tab === 'guias' && isAdmin && <Guides />}
        {tab === 'historial' && <History />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- cola
function Queue() {
  const [status, setStatus] = useState<ExperienceStatus>('en_revision');
  const { data, loading, error, reload } = useAsync(() => moderationQueue(status), [status]);
  return (
    <section>
      <label className="flex max-w-xs flex-col gap-1">
        <span className="label">Estado</span>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as ExperienceStatus)}>
          {statuses.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
      </label>
      <p className="mt-3 text-sm text-slate">Primero aparecen las publicaciones con avisos automáticos de datos personales.</p>
      <div className="mt-4">
        {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : !data?.length ? (
          <EmptyState title="No hay publicaciones en este estado" />
        ) : (
          <ul>{data.map((item) => <QueueRow key={item.id} item={item} onDone={reload} />)}</ul>
        )}
      </div>
    </section>
  );
}

function QueueRow({ item, onDone }: { item: QueueItem; onDone: () => void }) {
  const [deciding, setDeciding] = useState(false);
  const [suspending, setSuspending] = useState(false);
  return (
    <li className="border-t border-line py-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusChip status={item.status} />
        {item.tone && <ToneChip tone={item.tone} />}
        {item.submitted_without_account && <span className="rounded-full border border-line bg-mist px-2 py-0.5 text-xs font-semibold text-navy">Enviada sin cuenta</span>}
        {item.auto_flags.map((f) => (
          <span key={f} className="rounded-full border border-amber/40 bg-amber-tint px-2 py-0.5 text-xs font-semibold text-amber">{flagLabel[f] ?? f}</span>
        ))}
        {Number(item.open_reports) > 0 && <span className="rounded-full border border-danger/40 bg-danger-tint px-2 py-0.5 text-xs font-semibold text-danger">{plural(Number(item.open_reports), 'reporte abierto', 'reportes abiertos')}</span>}
        <span className="text-slate">Recibida el {formatDate(item.created_at)}</span>
      </div>
      <h3 className="mt-2 text-xl">{item.title || item.category_slug}</h3>
      <p className="text-sm text-slate">
        {item.company_name}. {relationshipLabel[item.relationship]}. {formatPeriod(item.period_start, item.period_end)}. Alias: {item.author_alias}
        {item.has_documents && '. Indica que dispone de documentos'}
      </p>
      <p className="testimony mt-3">{item.body}</p>
      {item.status_reason && <p className="mt-3 text-sm"><span className="font-semibold">Último motivo:</span> {item.status_reason}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={() => setDeciding(true)}>Tomar una decisión</button>
        {item.author_id && <button type="button" className="btn-secondary" onClick={() => setSuspending(true)}>Suspender la cuenta autora</button>}
      </div>
      <DecisionDialog item={item} open={deciding} onClose={() => setDeciding(false)} onDone={onDone} />
      {item.author_id && <SuspendDialog userId={item.author_id} alias={item.author_alias} open={suspending} onClose={() => setSuspending(false)} />}
    </li>
  );
}

function DecisionDialog({ item, open, onClose, onDone }: { item: QueueItem; open: boolean; onClose: () => void; onDone: () => void }) {
  const [status, setStatus] = useState<ExperienceStatus | ''>('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<AppError | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (!status) v.status = 'Elige el nuevo estado.';
    if (reason.trim().length < 10) v.reason = 'Escribe un motivo de al menos 10 caracteres. El autor lo leerá.';
    setErrors(v);
    if (Object.keys(v).length || !status) return;
    setBusy(true);
    setError(null);
    try {
      await moderateExperience(item.id, status, reason.trim(), note.trim());
      onClose();
      onDone();
    } catch (err) {
      setError(err as AppError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Decisión de moderación">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Nuevo estado" error={errors.status}>
          {(p) => (
            <select {...p} className="input" value={status} onChange={(e) => setStatus(e.target.value as ExperienceStatus)}>
              <option value="">Elige un estado</option>
              {statuses.filter((s) => s !== item.status).map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          )}
        </Field>
        <Field label="Motivo para el autor" error={errors.reason} hint="Se muestra al autor. Sé concreto y respetuoso.">
          {(p) => <textarea {...p} className="input min-h-[96px]" value={reason} onChange={(e) => setReason(e.target.value)} />}
        </Field>
        <Field label="Nota interna" optional hint="Solo la ve el equipo. No copies datos personales innecesarios.">
          {(p) => <textarea {...p} className="input min-h-[72px]" value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
        {error && <Alert tone="error">{error.message}</Alert>}
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Registrar decisión'}</button>
        </div>
      </form>
    </Dialog>
  );
}

function SuspendDialog({ userId, alias, open, onClose }: { userId: string; alias: string; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<AppError | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 10) return setError({ kind: 'validation', message: 'Escribe un motivo de al menos 10 caracteres.' } as AppError);
    setBusy(true);
    setError(null);
    try {
      await setSuspension(userId, true, reason.trim());
      setDone(true);
    } catch (err) {
      setError(err as AppError);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onClose={onClose} title={`Suspender la cuenta «${alias}»`}>
      {done ? (
        <div className="space-y-4"><Alert tone="success">Cuenta suspendida. La decisión quedó registrada.</Alert><button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button></div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <p className="text-sm text-slate">Úsalo solo ante incumplimientos reiterados. La cuenta no podrá publicar hasta que se levante la suspensión.</p>
          <Field label="Motivo">
            {(p) => <textarea {...p} className="input min-h-[96px]" value={reason} onChange={(e) => setReason(e.target.value)} />}
          </Field>
          {error && <Alert tone="error">{error.message}</Alert>}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-danger" disabled={busy}>{busy ? 'Guardando…' : 'Suspender cuenta'}</button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

// ---------------------------------------------------------------- resolución genérica
function ResolveForm({
  options, onSubmit, submitLabel, minLength = 10, noteLabel = 'Respuesta',
}: { options: { value: string; label: string }[]; onSubmit: (status: string, text: string, note: string) => Promise<unknown>; submitLabel: string; minLength?: number; noteLabel?: string }) {
  const [status, setStatus] = useState('');
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      noValidate
      className="mt-4 grid gap-3 rounded border border-line bg-mist/50 p-4 md:grid-cols-[12rem_1fr]"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!status || text.trim().length < minLength) return setError(`Elige un estado y escribe al menos ${minLength} caracteres.`);
        setBusy(true);
        setError(null);
        try {
          await onSubmit(status, text.trim(), note.trim());
        } catch (err) {
          setError((err as AppError).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <select className="input" aria-label="Nuevo estado" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">Nuevo estado</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <textarea className="input min-h-[44px]" aria-label={noteLabel} placeholder={noteLabel} value={text} onChange={(e) => setText(e.target.value)} />
      <input className="input md:col-start-2" aria-label="Nota interna (opcional)" placeholder="Nota interna (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
      {error && <p className="field-error md:col-span-2" role="alert">{error}</p>}
      <div className="md:col-span-2"><button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : submitLabel}</button></div>
    </form>
  );
}

function StatusFilter({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex max-w-xs flex-col gap-1">
      <span className="label">Estado</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

// ---------------------------------------------------------------- comentarios
function CommentsModeration() {
  const [filter, setFilter] = useState<'retenido' | 'reportados' | 'ocultos'>('retenido');
  const { data, loading, error, reload } = useAsync(() => listCommentsForModeration(filter), [filter]);
  return (
    <section>
      <StatusFilter
        value={filter}
        onChange={(v) => setFilter(v as typeof filter)}
        options={[{ value: 'retenido', label: 'Retenidos por datos personales' }, { value: 'reportados', label: 'Publicados con reportes' }, { value: 'ocultos', label: 'Ocultos' }]}
      />
      <p className="mt-3 max-w-prose text-sm text-slate">
        Los comentarios se publican al instante. Solo llegan aquí los que parecen tener datos personales o los que alguien reportó.
      </p>
      <div className="mt-4">
        {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : !data?.length ? <EmptyState title="No hay comentarios en este estado" /> : (
          <ul>
            {data.map((c) => (
              <li key={c.id} className="border-t border-line py-5">
                <p className="text-sm text-slate">
                  {c.author_alias} · {formatDate(c.created_at)} · en «{c.experience_title}» ({c.company_name})
                </p>
                <p className="mt-2 whitespace-pre-line">{c.body}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {c.auto_flags.map((f) => <span key={f} className="rounded-full bg-amber-tint px-2 py-0.5 font-semibold text-amber">{flagLabel[f] ?? f}</span>)}
                  {Number(c.open_reports) > 0 && <span className="rounded-full bg-danger-tint px-2 py-0.5 font-semibold text-danger">{plural(Number(c.open_reports), 'reporte abierto', 'reportes abiertos')}</span>}
                </div>
                <ResolveForm
                  submitLabel="Registrar decisión"
                  noteLabel="Motivo (queda en el historial)"
                  options={[...(c.status !== 'publicado' ? [{ value: 'publicado', label: 'Publicar' }] : []), ...(c.status !== 'oculto' ? [{ value: 'oculto', label: 'Ocultar' }] : [])]}
                  onSubmit={async (s, t) => { await moderateComment(c.id, s as 'publicado' | 'oculto', t); reload(); }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- reportes
const reportReasons: Record<string, string> = {
  datos_personales: 'Datos personales', amenaza: 'Amenaza', falso_o_enganoso: 'Falso o engañoso', contenido_confidencial: 'Contenido confidencial', spam: 'Spam', otro: 'Otro',
};
function Reports() {
  const [status, setStatus] = useState('abierto');
  const { data, loading, error, reload } = useAsync(() => listReports(status), [status]);
  return (
    <section>
      <StatusFilter value={status} onChange={setStatus} options={[{ value: 'abierto', label: 'Abiertos' }, { value: 'en_revision', label: 'En revisión' }, { value: 'resuelto', label: 'Resueltos' }, { value: 'descartado', label: 'Descartados' }]} />
      <div className="mt-4">
        {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : !data?.length ? <EmptyState title="No hay reportes en este estado" /> : (
          <ul>
            {data.map((r) => (
              <li key={r.id} className="border-t border-line py-5">
                <p className="font-semibold">{reportReasons[r.reason] ?? r.reason}</p>
                <p className="text-sm text-slate">
                  Recibido el {formatDate(r.created_at)}. {r.comment_id ? `Comentario ${r.comment_id.slice(0, 8)} en la experiencia` : 'Experiencia'} {r.experience_id.slice(0, 8)}
                </p>
                {r.details && <p className="mt-2">{r.details}</p>}
                {r.resolution_note && <p className="mt-2 text-sm"><span className="font-semibold">Resolución:</span> {r.resolution_note}</p>}
                <p className="mt-2 text-sm text-slate">Para actuar sobre la publicación, búscala en la cola con su estado actual o en el historial.</p>
                {(r.status === 'abierto' || r.status === 'en_revision') && (
                  <ResolveForm
                    submitLabel="Registrar resolución"
                    minLength={5}
                    noteLabel="Nota de resolución"
                    options={[{ value: 'en_revision', label: 'En revisión' }, { value: 'resuelto', label: 'Resuelto' }, { value: 'descartado', label: 'Descartado' }]}
                    onSubmit={async (s, t) => { await resolveReport(r.id, s, t); reload(); }}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- reclamaciones
const claimTypeLabel: Record<string, string> = {
  error_verificable: 'Error verificable', datos_privados: 'Información privada', desacuerdo_opinion: 'Desacuerdo con una opinión', datos_empresa: 'Datos de la empresa', otro: 'Otro',
};
const actionLabel: Record<string, string> = { correccion: 'Corrección', revision: 'Revisión', retiro_datos_privados: 'Retiro de datos privados', respuesta_publica: 'Respuesta pública' };

function Claims() {
  const [status, setStatus] = useState('recibida');
  const { data, loading, error, reload } = useAsync(() => listClaims(status), [status]);
  return (
    <section>
      <StatusFilter value={status} onChange={setStatus} options={[{ value: 'recibida', label: 'Recibidas' }, { value: 'en_revision', label: 'En revisión' }, { value: 'aceptada', label: 'Aceptadas' }, { value: 'rechazada', label: 'Rechazadas' }, { value: 'cerrada', label: 'Cerradas' }]} />
      <Alert tone="info">
        Distingue entre corregir un error verificable, retirar información privada y discrepar de una opinión legítima. Una reclamación nunca justifica revelar al autor.
      </Alert>
      <div className="mt-4">
        {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : !data?.length ? <EmptyState title="No hay reclamaciones en este estado" /> : (
          <ul>{data.map((c) => <ClaimRowItem key={c.id} claim={c} onDone={reload} />)}</ul>
        )}
      </div>
    </section>
  );
}

function ClaimRowItem({ claim: c, onDone }: { claim: ClaimRow; onDone: () => void }) {
  const [responding, setResponding] = useState(false);
  return (
    <li className="border-t border-line py-5">
      <p className="font-semibold">{claimTypeLabel[c.claim_type]}: solicita {actionLabel[c.requested_action]?.toLowerCase()}</p>
      <p className="text-sm text-slate">
        {c.claimant_name}, {c.claimant_role}. {c.contact_email}. Recibida el {formatDate(c.created_at)}
        {c.experience_id && `. Experiencia ${c.experience_id.slice(0, 8)}`}
      </p>
      <p className="mt-2 whitespace-pre-line">{c.description}</p>
      {c.resolution_public && <p className="mt-2 text-sm"><span className="font-semibold">Respuesta:</span> {c.resolution_public}</p>}
      {(c.status === 'recibida' || c.status === 'en_revision') && (
        <ResolveForm
          submitLabel="Registrar respuesta"
          noteLabel="Respuesta para quien reclama"
          options={[{ value: 'en_revision', label: 'En revisión' }, { value: 'aceptada', label: 'Aceptada' }, { value: 'rechazada', label: 'Rechazada' }, { value: 'cerrada', label: 'Cerrada' }]}
          onSubmit={async (s, t, n) => { await resolveClaim(c.id, s, t, n); onDone(); }}
        />
      )}
      {c.requested_action === 'respuesta_publica' && (
        <button type="button" className="btn-link mt-3 text-sm" onClick={() => setResponding(true)}>Publicar respuesta de la empresa</button>
      )}
      <ResponseDialog claim={c} open={responding} onClose={() => setResponding(false)} />
    </li>
  );
}

function ResponseDialog({ claim, open, onClose }: { claim: ClaimRow; open: boolean; onClose: () => void }) {
  const [label, setLabel] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onClose={onClose} title="Publicar respuesta de la empresa">
      {done ? (
        <div className="space-y-4"><Alert tone="success">Respuesta publicada en el perfil de la empresa.</Alert><button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button></div>
      ) : (
        <form noValidate className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          if (label.trim().length < 3 || body.trim().length < 20) return setError('Indica cómo se identifica al representante y una respuesta de al menos 20 caracteres.');
          setBusy(true);
          setError(null);
          try {
            await publishCompanyResponse({ companyId: claim.company_id, experienceId: claim.experience_id ?? undefined, claimId: claim.id, label: label.trim(), body: body.trim() });
            setDone(true);
          } catch (err) {
            setError((err as AppError).message);
          } finally {
            setBusy(false);
          }
        }}>
          <Alert tone="warning">Publica solo después de verificar que la persona representa a la empresa.</Alert>
          <Field label="Identificación pública" hint="Por ejemplo: «Área de talento humano de la empresa (verificado)».">
            {(p) => <input {...p} className="input" value={label} onChange={(e) => setLabel(e.target.value)} />}
          </Field>
          <Field label="Respuesta">
            {(p) => <textarea {...p} className="input min-h-[140px]" maxLength={3000} value={body} onChange={(e) => setBody(e.target.value)} />}
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Publicando…' : 'Publicar respuesta'}</button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

// ---------------------------------------------------------------- apelaciones
function Appeals() {
  const [status, setStatus] = useState('recibida');
  const { data, loading, error, reload } = useAsync(() => listAppeals(status), [status]);
  return (
    <section>
      <StatusFilter value={status} onChange={setStatus} options={[{ value: 'recibida', label: 'Recibidas' }, { value: 'en_revision', label: 'En revisión' }, { value: 'aceptada', label: 'Aceptadas' }, { value: 'rechazada', label: 'Rechazadas' }]} />
      <p className="mt-3 text-sm text-slate">Si aceptas una apelación, cambia también el estado de la publicación desde la cola.</p>
      <div className="mt-4">
        {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : !data?.length ? <EmptyState title="No hay apelaciones en este estado" /> : (
          <ul>
            {data.map((a) => (
              <li key={a.id} className="border-t border-line py-5">
                <p className="text-sm text-slate">Recibida el {formatDate(a.created_at)}. Experiencia {a.experience_id.slice(0, 8)}</p>
                <p className="mt-2 whitespace-pre-line">{a.body}</p>
                {a.resolution && <p className="mt-2 text-sm"><span className="font-semibold">Resolución:</span> {a.resolution}</p>}
                {(a.status === 'recibida' || a.status === 'en_revision') && (
                  <ResolveForm
                    submitLabel="Registrar resolución"
                    noteLabel="Resolución para el autor"
                    options={[{ value: 'en_revision', label: 'En revisión' }, { value: 'aceptada', label: 'Aceptada' }, { value: 'rechazada', label: 'Rechazada' }]}
                    onSubmit={async (s, t, n) => { await resolveAppeal(a.id, s, t, n); reload(); }}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- catálogo
function Catalog() {
  const suggestions = useAsync(() => listSuggestions(), []);
  const [form, setForm] = useState({ trade_name: '', legal_name: '', sector: '', city: '', department: '', website: '', slug: '', aliases: '' });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const autoSlug = normalizeText(`${form.trade_name} ${form.city}`).replace(/ /g, '-').slice(0, 80);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(null);
    if (!form.trade_name.trim() || !form.sector.trim() || !form.city.trim() || !form.department.trim()) {
      return setError('Completa nombre comercial, sector, ciudad y departamento.');
    }
    if (form.website && !/^https:\/\/\S+$/.test(form.website.trim())) return setError('El sitio web debe empezar por https://');
    setBusy(true);
    setError(null);
    try {
      const { id } = await createCompany({
        slug: form.slug.trim() || autoSlug, trade_name: form.trade_name.trim(), legal_name: form.legal_name.trim(), sector: form.sector.trim(),
        city: form.city.trim(), department: form.department.trim(), website: form.website.trim(),
      });
      for (const alias of form.aliases.split(',').map((a) => a.trim()).filter(Boolean)) await addCompanyAlias(id, alias);
      setSaved(form.trade_name.trim());
      setForm({ trade_name: '', legal_name: '', sector: '', city: '', department: '', website: '', slug: '', aliases: '' });
    } catch (err) {
      setError((err as AppError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <section>
        <h2 className="text-2xl">Añadir una empresa</h2>
        <p className="mt-2 text-sm text-slate">Verifica los datos con una fuente oficial antes de crearla. No registres el NIT aquí: se guarda aparte, sin acceso público.</p>
        <form onSubmit={submit} noValidate className="mt-5 space-y-4">
          <Field label="Nombre comercial">{(p) => <input {...p} className="input" value={form.trade_name} onChange={(e) => setForm({ ...form, trade_name: e.target.value })} />}</Field>
          <Field label="Razón social" optional>{(p) => <input {...p} className="input" value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} />}</Field>
          <Field label="Sector económico">{(p) => <input {...p} className="input" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ciudad">{(p) => <input {...p} className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />}</Field>
            <Field label="Departamento">{(p) => <input {...p} className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />}</Field>
          </div>
          <Field label="Sitio web oficial" optional>{(p) => <input {...p} type="url" className="input" placeholder="https://" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />}</Field>
          <Field label="Nombres alternativos" optional hint="Separados por comas: siglas, marcas o nombres anteriores.">{(p) => <input {...p} className="input" value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} />}</Field>
          <Field label="Dirección del perfil" optional hint={`Si la dejas vacía se usará «${autoSlug || '…'}».`}>{(p) => <input {...p} className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />}</Field>
          {error && <Alert tone="error">{error}</Alert>}
          {saved && <Alert tone="success">Empresa «{saved}» añadida. El alta quedó registrada en el historial.</Alert>}
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Añadir empresa'}</button>
        </form>
      </section>
      <section>
        <h2 className="text-2xl">Sugerencias pendientes</h2>
        <div className="mt-4">
          {suggestions.loading ? <Loading /> : suggestions.error ? <ErrorState error={suggestions.error} onRetry={suggestions.reload} /> : !suggestions.data?.length ? (
            <EmptyState title="No hay sugerencias pendientes" />
          ) : (
            <ul>
              {suggestions.data.map((s) => (
                <li key={s.id} className="border-t border-line py-4">
                  <p className="font-semibold">{s.trade_name}</p>
                  <p className="text-sm text-slate">{s.city}{s.department && `, ${s.department}`}. {formatDate(s.created_at)}</p>
                  {s.website && <p className="text-sm break-all">{s.website}</p>}
                  {s.note && <p className="mt-1 text-sm">{s.note}</p>}
                  <ResolveForm
                    submitLabel="Registrar"
                    minLength={5}
                    noteLabel="Nota"
                    options={[{ value: 'aprobada', label: 'Aprobada (ya creada)' }, { value: 'duplicada', label: 'Duplicada' }, { value: 'rechazada', label: 'Rechazada' }]}
                    onSubmit={async (st, t) => { await resolveSuggestion(s.id, st, t); suggestions.reload(); }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- historial
const targetLabel: Record<string, string> = {
  experience: 'Experiencia', report: 'Reporte', claim: 'Reclamación', appeal: 'Apelación', profile: 'Cuenta', company: 'Empresa',
  company_response: 'Respuesta empresarial', company_suggestion: 'Sugerencia', legal_resource: 'Guía',
};
function History() {
  const [filter, setFilter] = useState('');
  const [applied, setApplied] = useState('');
  const { data, loading, error, reload } = useAsync(() => listModerationEvents(applied || undefined), [applied]);
  return (
    <section>
      <form className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); setApplied(filter.trim()); }}>
        <div className="flex-1">
          <label htmlFor="h-id" className="label">Identificador del elemento</label>
          <input id="h-id" className="input" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Vacío para ver las últimas 100 decisiones" />
        </div>
        <button type="submit" className="btn-secondary">Filtrar</button>
      </form>
      <p className="mt-3 text-sm text-slate">El historial no se puede editar ni borrar desde la aplicación.</p>
      <div className="mt-4 overflow-x-auto">
        {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : !data?.length ? <EmptyState title="Sin decisiones registradas" /> : (
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line text-slate">
              <tr><th className="py-2 pr-4 font-semibold">Fecha</th><th className="py-2 pr-4 font-semibold">Elemento</th><th className="py-2 pr-4 font-semibold">Cambio</th><th className="py-2 pr-4 font-semibold">Motivo</th><th className="py-2 font-semibold">Responsable</th></tr>
            </thead>
            <tbody>
              {data.map((ev) => (
                <tr key={ev.id} className="border-b border-line align-top">
                  <td className="py-3 pr-4 whitespace-nowrap">{formatDate(ev.created_at)}</td>
                  <td className="py-3 pr-4">{targetLabel[ev.target_type] ?? ev.target_type} <span className="block font-mono text-xs text-slate">{ev.target_id.slice(0, 8)}</span></td>
                  <td className="py-3 pr-4">{ev.previous_status ?? 'nuevo'} a {ev.new_status ?? '-'}</td>
                  <td className="py-3 pr-4">{ev.reason}{ev.internal_note && <span className="block text-slate">Nota: {ev.internal_note}</span>}</td>
                  <td className="py-3 font-mono text-xs text-slate">{ev.actor_id ? ev.actor_id.slice(0, 8) : 'sistema'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- guías
const guideStatusLabel: Record<GuideStatus, string> = {
  borrador: 'Borrador', pendiente_verificacion: 'Pendiente de verificación', publicado: 'Publicada', archivado: 'Archivada',
};

function Guides() {
  const { data, loading, error, reload } = useAsync(() => listGuides(), []);
  const [creating, setCreating] = useState(false);
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-slate">{data ? plural(data.length, 'guía', 'guías') : ''}</p>
        <button type="button" className="btn-primary" onClick={() => setCreating(true)}>Nueva guía</button>
      </div>
      <NewGuideDialog open={creating} onClose={() => setCreating(false)} />
      <Alert tone="warning" title="Publica solo guías revisadas">
        Cada guía debe revisarla un abogado contra su fuente oficial antes de publicarse. Al publicar se registra la fecha de hoy como
        fecha de verificación.
      </Alert>
      <div className="mt-6">
        {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : !data?.length ? (
          <EmptyState title="No hay guías cargadas">Carga el archivo supabase/contenido/guias-derechos-2026.sql desde el SQL Editor.</EmptyState>
        ) : (
          <ul>{data.map((g) => <GuideRowItem key={g.id} guide={g} onDone={reload} />)}</ul>
        )}
      </div>
    </section>
  );
}

function GuideRowItem({ guide: g, onDone }: { guide: GuideRow; onDone: () => void }) {
  const { session } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(status: GuideStatus) {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      await setGuideStatus(g.id, status, session.user.id);
      setConfirming(false);
      onDone();
    } catch (err) {
      setError((err as AppError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="border-t border-line py-5">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate">
        <span className="rounded-[3px] border border-line px-2 py-0.5 text-xs font-semibold text-ink">{guideStatusLabel[g.status]}</span>
        <span>{g.legal_resource_sources.length} {g.legal_resource_sources.length === 1 ? 'fuente' : 'fuentes'}</span>
        {g.status === 'publicado' && <span>{plural(guideViews(g.legal_resource_stats).views, 'visita', 'visitas')}</span>}
        {g.last_verified_at && <span>Verificada el {formatDate(g.last_verified_at)}</span>}
      </div>
      <h3 className="mt-2 text-xl">
        <Link to={`/moderacion/guias/${g.id}`} className="hover:text-teal-strong hover:underline">{g.title}</Link>
      </h3>
      <p className="mt-1 max-w-prose text-slate">{g.summary}</p>
      {error && <div className="mt-3"><Alert tone="error">{error}</Alert></div>}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to={`/moderacion/guias/${g.id}`} className="btn-primary">Abrir y editar</Link>
        {g.status !== 'publicado' && <button type="button" className="btn-secondary" disabled={busy} onClick={() => setConfirming(true)}>Publicar guía</button>}
        {g.status === 'publicado' && <Link to={`/derechos/${g.slug}`} className="btn-secondary">Ver publicada</Link>}
        {g.status === 'publicado' && <button type="button" className="btn-secondary" disabled={busy} onClick={() => change('pendiente_verificacion')}>Retirar para revisar</button>}
        {g.status !== 'archivado' && <button type="button" className="btn-secondary" disabled={busy} onClick={() => change('archivado')}>Archivar</button>}
      </div>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="¿Publicar esta guía?"
        confirmLabel="Publicar guía"
        tone="primary"
        busy={busy}
        onConfirm={() => change('publicado')}
      >
        Confirma que un abogado revisó el contenido contra las fuentes oficiales citadas. La guía será visible para cualquier persona en Tus
        derechos.
      </ConfirmDialog>
    </li>
  );
}

function NewGuideDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const categories = useAsync(() => (open ? listCategories() : Promise.resolve([])), [open]);
  const [form, setForm] = useState({ title: '', summary: '', category_slug: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const slug = normalizeText(form.title).replace(/ /g, '-').slice(0, 80).replace(/-+$/, '');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (form.title.trim().length < 5 || form.title.trim().length > 160) v.title = 'El título debe tener entre 5 y 160 caracteres.';
    if (form.summary.trim().length < 20 || form.summary.trim().length > 400) v.summary = 'El resumen debe tener entre 20 y 400 caracteres.';
    if (slug.length < 3) v.title = v.title ?? 'El título necesita letras o números.';
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    setError(null);
    try {
      const id = await createGuide({ title: form.title.trim(), summary: form.summary.trim(), category_slug: form.category_slug || null }, slug);
      navigate(`/moderacion/guias/${id}`);
    } catch (err) {
      setError((err as AppError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nueva guía">
      <form onSubmit={submit} noValidate className="space-y-4">
        <p className="text-sm text-slate">Se crea como borrador, no visible al público. Después la completas en el editor.</p>
        <Field label="Título" error={errors.title} hint={slug ? `Dirección: /derechos/${slug}` : undefined}>
          {(p) => <input {...p} className="input" maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />}
        </Field>
        <Field label="Resumen" error={errors.summary} hint="Una o dos frases que aparecen en el listado de guías.">
          {(p) => <textarea {...p} className="input min-h-[88px]" maxLength={400} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />}
        </Field>
        <Field label="Categoría" optional>
          {(p) => (
            <select {...p} className="input" value={form.category_slug} onChange={(e) => setForm({ ...form, category_slug: e.target.value })}>
              <option value="">Temas generales</option>
              {categories.data?.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          )}
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Creando…' : 'Crear y editar'}</button>
        </div>
      </form>
    </Dialog>
  );
}
