import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { ConfirmDialog, Dialog } from '../../components/Dialog';
import { TextArea, TextField } from '../../components/Field';
import { PageHeader } from '../../components/PageHeader';
import { RequireAuth } from '../../components/RequireAuth';
import { EmptyState, ErrorState, LoadingState, Notice } from '../../components/States';
import { StatusChip } from '../../components/StatusChip';
import { SupabaseGate } from '../../components/SupabaseGate';
import { useToast } from '../../components/Toast';
import { createAppeal, listOwnExperiences, updateOwnExperience, type OwnExperience } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { formatDate } from '../../lib/format';
import { requireClient } from '../../lib/supabase';
import { useAsync } from '../../lib/useAsync';
import { MAX_ACCOUNT, MIN_ACCOUNT, statusDescriptions } from '../../shared/domain';
import { aliasResemblesEmail, aliasSchema, appealSchema, fieldErrors } from '../../shared/schemas';

function AliasSection() {
  const { session, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [alias, setAlias] = useState(profile?.alias ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = aliasSchema.safeParse(alias);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    if (aliasResemblesEmail(parsed.data, session?.user.email ?? '')) return setError('El alias no puede parecerse a tu correo');
    setBusy(true);
    setError(null);
    const { error: err } = await requireClient().from('profiles').update({ alias: parsed.data }).eq('id', session!.user.id);
    setBusy(false);
    if (err) return setError(friendlyError(err));
    await refreshProfile();
    toast.show('Alias guardado');
  }

  return (
    <section aria-labelledby="alias" className="border-b border-line py-6">
      <h2 id="alias" className="text-2xl">Tu alias</h2>
      {!profile?.alias && (
        <div className="mt-2">
          <Notice tone="info">Elige un alias para poder compartir experiencias.</Notice>
        </div>
      )}
      <form onSubmit={save} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
        <div className="flex-1">
          <TextField label="Alias público" value={alias} onChange={(e) => setAlias(e.target.value)}
            error={error ?? undefined} hint="Es lo único que otras personas ven de tu cuenta." autoComplete="off" />
        </div>
        <button type="submit" className="btn-primary sm:mt-7" disabled={busy} aria-busy={busy}>
          {busy ? 'Guardando…' : 'Guardar alias'}
        </button>
      </form>
      <p className="mt-3 text-sm text-muted">Correo de acceso (privado): {session?.user.email}</p>
    </section>
  );
}

function EditDialog({ exp, onClose, onSaved }: { exp: OwnExperience; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(exp.title ?? '');
  const [direct, setDirect] = useState(exp.account_direct);
  const [third, setThird] = useState(exp.account_third_party ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const total = direct.length + third.length;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (total < MIN_ACCOUNT || total > MAX_ACCOUNT) return setError(`El relato debe tener entre ${MIN_ACCOUNT} y ${MAX_ACCOUNT} caracteres.`);
    setBusy(true);
    setError(null);
    try {
      await updateOwnExperience(exp.id, {
        title: title.trim() || null,
        account_direct: direct.trim(),
        account_third_party: third.trim() || null,
      });
      onSaved();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open title="Editar experiencia" onClose={onClose}>
      <form onSubmit={save} className="space-y-4" noValidate>
        {exp.status === 'requiere_ajustes' && exp.moderation_reason && (
          <Notice tone="warning" title="Ajuste pedido por la moderación">{exp.moderation_reason}</Notice>
        )}
        <TextField label="Título" optional value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        <TextArea label="Lo que viste o viviste directamente" value={direct} onChange={(e) => setDirect(e.target.value)} />
        <TextArea label="Lo que conoces por terceros" optional value={third} onChange={(e) => setThird(e.target.value)} />
        <p className="text-sm text-muted" aria-live="polite">{total} caracteres</p>
        {error && <Notice tone="danger" role="alert">{error}</Notice>}
        <button type="submit" className="btn-primary" disabled={busy} aria-busy={busy}>
          {busy ? 'Enviando…' : 'Enviar a revisión'}
        </button>
      </form>
    </Dialog>
  );
}

function AppealDialog({ exp, onClose, onSaved }: { exp: OwnExperience; onClose: () => void; onSaved: () => void }) {
  const { session } = useAuth();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = appealSchema.safeParse({ reason });
    if (!parsed.success) return setError(fieldErrors(parsed.error).reason);
    setBusy(true);
    setError(null);
    try {
      await createAppeal({ appellantId: session!.user.id, experienceId: exp.id, reason: parsed.data.reason });
      onSaved();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open title="Apelar la decisión" onClose={onClose}>
      <form onSubmit={save} className="space-y-4" noValidate>
        {exp.moderation_reason && <Notice tone="info" title="Motivo de la decisión">{exp.moderation_reason}</Notice>}
        <TextArea label="Por qué pides revisarla de nuevo" value={reason} error={error ?? undefined}
          onChange={(e) => setReason(e.target.value)} className="input min-h-28" />
        <button type="submit" className="btn-primary" disabled={busy} aria-busy={busy}>
          {busy ? 'Enviando…' : 'Enviar apelación'}
        </button>
      </form>
    </Dialog>
  );
}

function History() {
  const { session } = useAuth();
  const toast = useToast();
  const data = useAsync(() => listOwnExperiences(session!.user.id), [session?.user.id]);
  const [editing, setEditing] = useState<OwnExperience | null>(null);
  const [appealing, setAppealing] = useState<OwnExperience | null>(null);

  return (
    <section aria-labelledby="historial" className="border-b border-line py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="historial" className="text-2xl">Tus experiencias</h2>
        <Link className="btn-secondary" to="/compartir">Compartir experiencia</Link>
      </div>
      {data.status === 'loading' && <LoadingState label="Cargando tu historial" />}
      {data.status === 'error' && <ErrorState message={data.error} onRetry={data.reload} />}
      {data.status === 'success' &&
        (data.data.length === 0 ? (
          <EmptyState title="Todavía no has compartido experiencias" />
        ) : (
          <ul className="mt-4 border-t border-line">
            {data.data.map((e) => (
              <li key={e.id} className="border-b border-line py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusChip status={e.status} />
                  <span className="text-sm text-muted">Enviada el {formatDate(e.created_at)}</span>
                </div>
                <p className="mt-2 font-serif text-xl font-semibold">{e.title ?? 'Sin título'}</p>
                <p className="text-sm text-muted">{statusDescriptions[e.status]}</p>
                {e.moderation_reason && (
                  <p className="mt-2"><span className="font-medium">Motivo de moderación:</span> {e.moderation_reason}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-4">
                  {(e.status === 'en_revision' || e.status === 'requiere_ajustes') && (
                    <button type="button" className="btn-link" onClick={() => setEditing(e)}>Editar</button>
                  )}
                  {['requiere_ajustes', 'en_disputa', 'restringida', 'retirada'].includes(e.status) && (
                    <button type="button" className="btn-link" onClick={() => setAppealing(e)}>Apelar</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ))}
      {editing && (
        <EditDialog
          exp={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            toast.show('Enviada a revisión');
            data.reload();
          }}
        />
      )}
      {appealing && (
        <AppealDialog
          exp={appealing}
          onClose={() => setAppealing(null)}
          onSaved={() => {
            setAppealing(null);
            toast.show('Apelación enviada a revisión');
          }}
        />
      )}
    </section>
  );
}

function DangerZone() {
  const { profile, refreshProfile, signOut } = useAuth();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request() {
    setBusy(true);
    setError(null);
    const { error: err } = await requireClient().rpc('request_account_deletion');
    setBusy(false);
    setConfirming(false);
    if (err) return setError(friendlyError(err));
    await refreshProfile();
    toast.show('Solicitud de eliminación registrada');
  }

  async function cancel() {
    setBusy(true);
    const { error: err } = await requireClient().rpc('cancel_account_deletion');
    setBusy(false);
    if (err) return setError(friendlyError(err));
    await refreshProfile();
    toast.show('Solicitud de eliminación cancelada');
  }

  return (
    <section aria-labelledby="sesion" className="py-6">
      <h2 id="sesion" className="text-2xl">Sesión y cuenta</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className="btn-secondary" onClick={() => void signOut()}>Cerrar sesión</button>
        {profile?.deletion_requested_at ? (
          <button type="button" className="btn-secondary" onClick={cancel} disabled={busy}>Cancelar la eliminación</button>
        ) : (
          <button type="button" className="btn-danger" onClick={() => setConfirming(true)}>Solicitar eliminación de la cuenta</button>
        )}
      </div>
      {profile?.deletion_requested_at && (
        <div className="mt-4">
          <Notice tone="warning" title="Eliminación solicitada">
            La pediste el {formatDate(profile.deletion_requested_at)}. La procesaremos en el plazo indicado en la{' '}
            <Link to="/privacidad">política de privacidad</Link>.
          </Notice>
        </div>
      )}
      {error && <div className="mt-4"><Notice tone="danger" role="alert">{error}</Notice></div>}
      <ConfirmDialog
        open={confirming}
        title="¿Eliminar tu cuenta?"
        danger
        busy={busy}
        confirmLabel="Sí, solicitar eliminación"
        onConfirm={request}
        onClose={() => setConfirming(false)}
        description={
          <div className="space-y-2">
            <p>Se borrará tu cuenta, tu correo y tu alias. Tus experiencias publicadas se conservarán de forma anónima.</p>
            <p>Mientras se procesa no podrás publicar. Puedes cancelar la solicitud antes de que se ejecute.</p>
          </div>
        }
      />
    </section>
  );
}

export default function Account() {
  return (
    <div className="container-page max-w-3xl">
      <PageHeader title="Mi cuenta" />
      <SupabaseGate>
        <RequireAuth>
          <AliasSection />
          <History />
          <DangerZone />
        </RequireAuth>
      </SupabaseGate>
    </div>
  );
}
