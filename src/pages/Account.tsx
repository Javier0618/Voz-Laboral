import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  cancelAccountDeletion, getMyExperienceHistory, listMyClaims, listMyExperiences, requestAccountDeletion, submitAppeal,
  updateAlias, withdrawMyExperience, type MyExperience,
} from '../lib/api';
import { formatDate, formatPeriod } from '../lib/format';
import { aliasSchema } from '../lib/schemas';
import type { AppError } from '../lib/supabase';
import { AuthForms, NewPasswordForm } from './AuthForms';
import {
  Alert, ConfigNotice, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, Loading, notConfigured, PageHeader, StatusChip, statusHint, statusLabel, useAsync,
} from '../components/ui';

export default function Account() {
  const { session, loading } = useAuth();
  if (notConfigured) return <div className="page py-10"><ConfigNotice /></div>;
  if (loading) return <div className="page py-10"><Loading /></div>;
  return (
    <div className="page py-10">
      <PageHeader title={session ? 'Mi cuenta' : 'Accede a tu cuenta'} />
      <div className="mt-8">{session ? <AccountHome /> : <AuthForms />}</div>
    </div>
  );
}

export function NewPasswordPage() {
  return (
    <div className="page py-10">
      <PageHeader title="Crea una nueva contraseña" />
      <div className="mt-8">{notConfigured ? <ConfigNotice /> : <NewPasswordForm />}</div>
    </div>
  );
}

function AccountHome() {
  const { profile, signOut, refreshProfile } = useAuth();
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0 space-y-14">
        {profile?.status === 'suspendida' && (
          <Alert tone="error" title="Cuenta suspendida">{profile.suspended_reason ?? 'Incumplimiento reiterado de las reglas.'} Puedes seguir consultando tus datos.</Alert>
        )}
        <AliasSection />
        <MyExperiences />
        <MyClaims />
      </div>
      <aside className="space-y-10 lg:border-l lg:border-line lg:pl-8">
        <section>
          <h2 className="font-sans text-base font-semibold">Sesión</h2>
          <button type="button" className="btn-secondary mt-3 w-full" onClick={() => void signOut()}>Cerrar sesión</button>
        </section>
        <DeletionSection onChange={refreshProfile} />
        <section className="text-sm text-slate">
          <h2 className="font-sans text-base font-semibold text-ink">Tus datos</h2>
          <p className="mt-2">Puedes consultar, corregir o pedir la supresión de tus datos personales.</p>
          <Link to="/politicas/solicitudes" className="btn-link mt-2 inline-block">Cómo presentar una solicitud</Link>
        </section>
      </aside>
    </div>
  );
}

function AliasSection() {
  const { profile, refreshProfile } = useAuth();
  const [alias, setAlias] = useState(profile?.alias ?? '');
  const [fieldError, setFieldError] = useState<string>();
  const [error, setError] = useState<AppError | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    const parsed = aliasSchema.safeParse(alias);
    if (!parsed.success) return setFieldError(parsed.error.issues[0].message);
    setFieldError(undefined);
    if (!profile) return;
    setBusy(true);
    setError(null);
    try {
      await updateAlias(profile.id, parsed.data);
      await refreshProfile();
      setSaved(true);
    } catch (err) {
      setError(err as AppError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="alias-titulo">
      <h2 id="alias-titulo" className="text-2xl">Alias público</h2>
      <p className="mt-2 max-w-prose text-slate">
        Es el nombre con el que se ven tus experiencias. No uses tu nombre real ni algo que te identifique en tu trabajo. Puedes cambiarlo
        una vez cada 7 días.
      </p>
      {!profile?.alias && <div className="mt-4"><Alert tone="info">Elige un alias para poder compartir experiencias.</Alert></div>}
      <form onSubmit={save} noValidate className="mt-5 flex max-w-lg flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Field label="Alias" error={fieldError} hint="Entre 3 y 24 caracteres: letras, números, punto, guion o guion bajo.">
            {(p) => <input {...p} className="input" value={alias} autoComplete="off" onChange={(e) => setAlias(e.target.value)} />}
          </Field>
        </div>
        <button type="submit" className="btn-primary sm:mt-7" disabled={busy || alias === profile?.alias}>{busy ? 'Guardando…' : 'Guardar alias'}</button>
      </form>
      <div className="mt-3 max-w-lg">
        {error && <Alert tone="error">{error.message}</Alert>}
        {saved && <Alert tone="success">Alias guardado.</Alert>}
      </div>
    </section>
  );
}

function MyExperiences() {
  const { data, loading, error, reload } = useAsync(() => listMyExperiences(), []);
  return (
    <section aria-labelledby="mis-exp">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="mis-exp" className="text-2xl">Mis experiencias</h2>
        <Link to="/compartir" className="btn-secondary">Compartir otra</Link>
      </div>
      <div className="mt-4">
        {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : !data?.length ? (
          <EmptyState title="Aún no has compartido experiencias" action={<Link to="/compartir" className="btn-primary">Compartir una experiencia</Link>} />
        ) : (
          <ul>{data.map((e) => <MyExperienceRow key={e.id} exp={e} onChange={reload} />)}</ul>
        )}
      </div>
    </section>
  );
}

function MyExperienceRow({ exp, onChange }: { exp: MyExperience; onChange: () => void }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const editable = exp.status === 'en_revision' || exp.status === 'requiere_ajustes';
  const appealable = ['requiere_ajustes', 'restringida', 'retirada', 'en_disputa'].includes(exp.status) && exp.status_reason !== 'Retirada por su autor.';

  async function withdraw() {
    setBusy(true);
    setError(null);
    try {
      await withdrawMyExperience(exp.id);
      setWithdrawOpen(false);
      onChange();
    } catch (err) {
      setError(err as AppError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="border-t border-line py-6">
      <div className="flex flex-wrap items-center gap-3">
        <StatusChip status={exp.status} />
        <span className="text-sm text-slate">Enviada el {formatDate(exp.created_at)}</span>
      </div>
      <h3 className="mt-2 text-xl">{exp.title || exp.category_name}</h3>
      <p className="text-sm text-slate">{exp.company_name}, {exp.category_name}. {formatPeriod(exp.period_start, exp.period_end)}</p>
      <p className="mt-2 text-sm text-slate">{statusHint(exp.status)}</p>
      {exp.status_reason && (
        <p className="mt-3 rounded bg-mist px-3 py-2 text-sm"><span className="font-semibold">Motivo de la decisión:</span> {exp.status_reason}</p>
      )}
      {error && <div className="mt-3"><Alert tone="error">{error.message}</Alert></div>}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {exp.status === 'publicada' && <Link className="btn-link" to={`/empresas/${exp.company_slug}`}>Ver en el perfil de la empresa</Link>}
        {editable && <Link className="btn-link" to={`/compartir?editar=${exp.id}`}>{exp.status === 'requiere_ajustes' ? 'Hacer los ajustes' : 'Editar'}</Link>}
        <button type="button" className="btn-link" onClick={() => setHistoryOpen(true)}>Ver historial</button>
        {appealable && <button type="button" className="btn-link" onClick={() => setAppealOpen(true)}>Apelar la decisión</button>}
        {exp.status !== 'retirada' && <button type="button" className="font-semibold text-danger underline-offset-4 hover:underline" onClick={() => setWithdrawOpen(true)}>Retirar</button>}
      </div>
      <ConfirmDialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="¿Retirar esta experiencia?" confirmLabel="Retirar experiencia" busy={busy} onConfirm={withdraw}>
        Dejará de estar visible de inmediato. La decisión queda registrada y no podrás volver a publicarla con el mismo texto.
      </ConfirmDialog>
      <HistoryDialog id={exp.id} open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <AppealDialog id={exp.id} open={appealOpen} onClose={() => setAppealOpen(false)} />
    </li>
  );
}

function HistoryDialog({ id, open, onClose }: { id: string; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Historial de decisiones">
      {open && <HistoryList id={id} />}
    </Dialog>
  );
}

function HistoryList({ id }: { id: string }) {
  const { data, loading, error } = useAsync(() => getMyExperienceHistory(id), [id]);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  if (!data?.length) return <p className="text-slate">Todavía no hay decisiones sobre esta experiencia. Está en la cola de revisión.</p>;
  return (
    <ol className="space-y-4">
      {data.map((h, i) => (
        <li key={i} className="border-l-2 border-line pl-4">
          <p className="text-sm text-slate">{formatDate(h.created_at)}</p>
          <p className="font-semibold">{statusLabel(h.new_status as MyExperience['status'])}</p>
          <p className="text-sm">{h.reason}</p>
        </li>
      ))}
    </ol>
  );
}

function AppealDialog({ id, open, onClose }: { id: string; open: boolean; onClose: () => void }) {
  const [body, setBody] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [error, setError] = useState<AppError | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 30) return setFieldError('Explica tu apelación con al menos 30 caracteres.');
    setFieldError(undefined);
    setBusy(true);
    setError(null);
    try {
      await submitAppeal(id, body.trim());
      setDone(true);
    } catch (err) {
      setError(err as AppError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Apelar la decisión">
      {done ? (
        <div className="space-y-4">
          <Alert tone="success" title="Apelación enviada">Otra persona del equipo la revisará y verás el resultado en el historial.</Alert>
          <button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="¿Por qué no estás de acuerdo?" error={fieldError}>
            {(p) => <textarea {...p} className="input min-h-[120px]" maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} />}
          </Field>
          {error && <Alert tone="error">{error.message}</Alert>}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Enviando…' : 'Enviar apelación'}</button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

const claimStatus: Record<string, string> = {
  recibida: 'Recibida', en_revision: 'En revisión', aceptada: 'Aceptada', rechazada: 'Rechazada', cerrada: 'Cerrada',
};

function MyClaims() {
  const { data, error } = useAsync(() => listMyClaims(), []);
  if (error || !data?.length) return null;
  return (
    <section aria-labelledby="mis-reclamaciones">
      <h2 id="mis-reclamaciones" className="text-2xl">Mis solicitudes de corrección</h2>
      <ul className="mt-4">
        {data.map((c) => (
          <li key={c.id} className="border-t border-line py-4">
            <p className="font-semibold">{claimStatus[c.status] ?? c.status}</p>
            <p className="text-sm text-slate">Enviada el {formatDate(c.created_at)}</p>
            {c.resolution_public && <p className="mt-2 text-sm">{c.resolution_public}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DeletionSection({ onChange }: { onChange: () => Promise<void> }) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const pending = profile?.status === 'eliminacion_solicitada';

  async function act() {
    setBusy(true);
    setError(null);
    try {
      if (pending) await cancelAccountDeletion();
      else await requestAccountDeletion();
      setOpen(false);
      await onChange();
    } catch (err) {
      setError(err as AppError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2 className="font-sans text-base font-semibold">Eliminar la cuenta</h2>
      {pending ? (
        <p className="mt-2 text-sm text-slate">
          Solicitaste la eliminación el {formatDate(profile?.deletion_requested_at)}. Tienes 15 días desde esa fecha para cancelarla.
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate">
          Tus experiencias publicadas se conservarán sin ningún vínculo con tu cuenta, firmadas como «Autor anónimo». Las que no se hayan
          publicado se retirarán.
        </p>
      )}
      {error && <div className="mt-3"><Alert tone="error">{error.message}</Alert></div>}
      <button type="button" className={`${pending ? 'btn-secondary' : 'btn-danger'} mt-3 w-full`} onClick={() => setOpen(true)}>
        {pending ? 'Cancelar la eliminación' : 'Solicitar la eliminación'}
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={pending ? '¿Cancelar la eliminación?' : '¿Eliminar tu cuenta?'}
        confirmLabel={pending ? 'Mantener mi cuenta' : 'Solicitar la eliminación'}
        tone={pending ? 'primary' : 'danger'}
        busy={busy}
        onConfirm={act}
      >
        {pending
          ? 'Tu cuenta volverá a estar activa.'
          : 'Durante 15 días podrás cancelar la solicitud. Después se anonimizarán tus publicaciones y se borrarán tu alias y tu acceso. Los registros de moderación se conservan el tiempo indicado en la política de datos.'}
      </ConfirmDialog>
    </section>
  );
}
