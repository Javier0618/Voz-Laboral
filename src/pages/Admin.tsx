import { useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Dialog } from '../components/Dialog';
import { SelectField, TextArea } from '../components/Field';
import { PageHeader } from '../components/PageHeader';
import { RequireAuth } from '../components/RequireAuth';
import { EmptyState, ErrorState, LoadingState, Notice } from '../components/States';
import { StatusChip } from '../components/StatusChip';
import { SupabaseGate } from '../components/SupabaseGate';
import { useToast } from '../components/Toast';
import * as admin from '../lib/adminApi';
import { friendlyError } from '../lib/errors';
import { formatDate } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import { reportReasonLabels, statusLabels, type ExperienceStatus, type ReportReason } from '../shared/domain';

// La interfaz solo oculta enlaces. Cada lectura y cada RPC de este panel la
// valida la base de datos con RLS y comprobación de rol.

const NEXT_STATUSES: Record<ExperienceStatus, ExperienceStatus[]> = {
  en_revision: ['publicada', 'requiere_ajustes', 'restringida', 'retirada'],
  requiere_ajustes: ['en_revision', 'restringida', 'retirada'],
  publicada: ['en_disputa', 'requiere_ajustes', 'restringida', 'retirada'],
  en_disputa: ['publicada', 'requiere_ajustes', 'restringida', 'retirada'],
  restringida: ['publicada', 'en_revision', 'retirada'],
  retirada: ['en_revision'],
};

interface DecisionOption {
  value: string;
  label: string;
}

function DecisionDialog({
  title,
  options,
  onClose,
  onSubmit,
  withNote = true,
  children,
}: {
  title: string;
  options: DecisionOption[];
  onClose: () => void;
  onSubmit: (value: string, reason: string, note: string) => Promise<void>;
  withNote?: boolean;
  children?: ReactNode;
}) {
  const [value, setValue] = useState(options[0]?.value ?? '');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 3) return setError('Indica el motivo de la decisión');
    setBusy(true);
    setError(null);
    try {
      await onSubmit(value, reason.trim(), note.trim());
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <Dialog open title={title} onClose={onClose}>
      {children}
      <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
        <SelectField label="Decisión" value={value} onChange={(e) => setValue(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </SelectField>
        <TextArea label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} className="input min-h-20"
          hint="La persona afectada lo verá." />
        {withNote && (
          <TextArea label="Nota interna" optional value={note} onChange={(e) => setNote(e.target.value)} className="input min-h-20"
            hint="Solo la ve el equipo de moderación." />
        )}
        {error && <Notice tone="danger" role="alert">{error}</Notice>}
        <button type="submit" className="btn-primary" disabled={busy} aria-busy={busy}>
          {busy ? 'Guardando…' : 'Registrar decisión'}
        </button>
      </form>
    </Dialog>
  );
}

function ExperienceQueue() {
  const { session } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState<ExperienceStatus>('en_revision');
  const data = useAsync(() => admin.listQueue(status), [status]);
  const [selected, setSelected] = useState<admin.QueueExperience | null>(null);

  return (
    <section aria-labelledby="cola" className="py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="cola" className="text-2xl">Experiencias</h2>
        <div className="w-full sm:w-64">
          <SelectField label="Estado" value={status} onChange={(e) => setStatus(e.target.value as ExperienceStatus)}>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </SelectField>
        </div>
      </div>
      {data.status === 'loading' && <LoadingState />}
      {data.status === 'error' && <ErrorState message={data.error} onRetry={data.reload} />}
      {data.status === 'success' &&
        (data.data.length === 0 ? (
          <EmptyState title="No hay experiencias en este estado" />
        ) : (
          <ul className="mt-4 border-t border-line">
            {data.data.map((e) => (
              <li key={e.id} className="border-b border-line py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusChip status={e.status} />
                  <span className="text-sm text-muted">
                    {e.companies?.name} · {e.experience_categories?.name} · {formatDate(e.created_at)} · {e.profiles?.alias ?? 'Cuenta eliminada'}
                  </span>
                  {e.companies?.status !== 'activa' && <span className="text-sm font-medium text-warning">Empresa sin activar</span>}
                </div>
                <p className="mt-2 font-serif text-xl font-semibold">{e.title ?? 'Sin título'}</p>
                <p className="mt-1 line-clamp-3 max-w-prose text-ink">{e.account_direct}</p>
                {e.author_id === session?.user.id ? (
                  <p className="mt-2 text-sm text-muted">Es tu propia publicación: otra persona debe moderarla.</p>
                ) : (
                  <button type="button" className="btn-secondary mt-2" onClick={() => setSelected(e)}>Revisar</button>
                )}
              </li>
            ))}
          </ul>
        ))}
      {selected && (
        <DecisionDialog
          title="Revisar experiencia"
          options={NEXT_STATUSES[selected.status].map((s) => ({ value: s, label: statusLabels[s] }))}
          onClose={() => setSelected(null)}
          onSubmit={async (value, reason, note) => {
            await admin.moderateExperience(selected.id, value as ExperienceStatus, reason, note);
            setSelected(null);
            toast.show('Decisión registrada');
            data.reload();
          }}
        >
          <div className="prose-reading max-h-72 space-y-3 overflow-y-auto rounded-md border border-line p-3 text-base">
            <p className="whitespace-pre-line">{selected.account_direct}</p>
            {selected.account_third_party && (
              <p className="whitespace-pre-line border-l-2 border-line pl-3">{selected.account_third_party}</p>
            )}
          </div>
          {selected.has_documents && <p className="mt-2 text-sm text-muted">La persona dice tener documentos.</p>}
        </DecisionDialog>
      )}
    </section>
  );
}

function SimpleQueue<T extends { id: string; created_at: string }>({
  title,
  load,
  render,
  dialogTitle,
  options,
  decide,
  withNote,
}: {
  title: string;
  load: () => Promise<T[]>;
  render: (item: T) => ReactNode;
  dialogTitle: string;
  options: DecisionOption[];
  decide: (item: T, value: string, reason: string, note: string) => Promise<void>;
  withNote?: boolean;
}) {
  const toast = useToast();
  const data = useAsync(load, []);
  const [selected, setSelected] = useState<T | null>(null);
  return (
    <section aria-label={title} className="py-6">
      <h2 className="text-2xl">{title}</h2>
      {data.status === 'loading' && <LoadingState />}
      {data.status === 'error' && <ErrorState message={data.error} onRetry={data.reload} />}
      {data.status === 'success' &&
        (data.data.length === 0 ? (
          <EmptyState title="No hay pendientes" />
        ) : (
          <ul className="mt-4 border-t border-line">
            {data.data.map((item) => (
              <li key={item.id} className="border-b border-line py-4">
                <p className="text-sm text-muted">{formatDate(item.created_at)}</p>
                <div className="mt-1">{render(item)}</div>
                <button type="button" className="btn-secondary mt-2" onClick={() => setSelected(item)}>Resolver</button>
              </li>
            ))}
          </ul>
        ))}
      {selected && (
        <DecisionDialog
          title={dialogTitle}
          options={options}
          withNote={withNote}
          onClose={() => setSelected(null)}
          onSubmit={async (value, reason, note) => {
            await decide(selected, value, reason, note);
            setSelected(null);
            toast.show('Decisión registrada');
            data.reload();
          }}
        >
          {render(selected)}
        </DecisionDialog>
      )}
    </section>
  );
}

const TABS = ['Experiencias', 'Reportes', 'Apelaciones', 'Reclamaciones', 'Respuestas', 'Empresas'] as const;
type Tab = (typeof TABS)[number];

function Panel() {
  const { isModerator, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('Experiencias');
  if (loading) return <LoadingState />;
  if (!isModerator) {
    return <Notice tone="warning" title="Sin acceso">Esta sección es solo para el equipo de moderación.</Notice>;
  }
  return (
    <>
      <div role="tablist" aria-label="Secciones de moderación" className="flex flex-wrap gap-2 border-b border-line py-4">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={tab}>
        {tab === 'Experiencias' && <ExperienceQueue />}
        {tab === 'Reportes' && (
          <SimpleQueue
            title="Reportes abiertos"
            load={admin.listOpenReports}
            dialogTitle="Resolver reporte"
            withNote={false}
            options={[
              { value: 'resuelto', label: 'Resuelto' },
              { value: 'descartado', label: 'Descartado' },
              { value: 'en_revision', label: 'En revisión' },
            ]}
            render={(r) => (
              <>
                <p className="font-medium">{reportReasonLabels[r.reason as ReportReason] ?? r.reason}</p>
                {r.details && <p className="text-ink">{r.details}</p>}
                <p className="text-sm text-muted">
                  {r.experience_id ? `Experiencia ${r.experience_id}` : `Respuesta ${r.company_response_id}`}
                </p>
              </>
            )}
            decide={(r, v, reason) => admin.resolveReport(r.id, v as 'resuelto', reason)}
          />
        )}
        {tab === 'Apelaciones' && (
          <SimpleQueue
            title="Apelaciones pendientes"
            load={admin.listPendingAppeals}
            dialogTitle="Resolver apelación"
            withNote={false}
            options={[
              { value: 'aceptada', label: 'Aceptada' },
              { value: 'rechazada', label: 'Rechazada' },
            ]}
            render={(a) => (
              <>
                <p className="text-ink">{a.reason}</p>
                <p className="text-sm text-muted">
                  Experiencia {a.experience_id}. Si la aceptas, cambia luego su estado en Experiencias.
                </p>
              </>
            )}
            decide={(a, v, reason) => admin.resolveAppeal(a.id, v as 'aceptada', reason)}
          />
        )}
        {tab === 'Reclamaciones' && (
          <SimpleQueue
            title="Reclamaciones de empresas"
            load={admin.listPendingClaims}
            dialogTitle="Revisar reclamación"
            withNote={false}
            options={[
              { value: 'aprobada', label: 'Aprobada' },
              { value: 'rechazada', label: 'Rechazada' },
            ]}
            render={(c) => (
              <>
                <p className="font-medium">
                  {c.claim_type === 'representacion' ? 'Representación' : 'Corrección'} · {c.companies?.name}
                </p>
                <p className="text-ink">{c.message}</p>
                <p className="text-sm text-muted">{c.claimant_name}, {c.claimant_position} · {c.contact_email}</p>
              </>
            )}
            decide={(c, v, reason) => admin.reviewClaim(c.id, v as 'aprobada', reason)}
          />
        )}
        {tab === 'Respuestas' && (
          <SimpleQueue
            title="Respuestas de empresas"
            load={admin.listPendingResponses}
            dialogTitle="Moderar respuesta"
            withNote={false}
            options={[
              { value: 'publicada', label: 'Publicar' },
              { value: 'retirada', label: 'Retirar' },
            ]}
            render={(r) => (
              <>
                <p className="font-medium">{r.companies?.name}</p>
                <p className="text-ink">{r.body}</p>
              </>
            )}
            decide={(r, v, reason) => admin.moderateResponse(r.id, v as 'publicada', reason)}
          />
        )}
        {tab === 'Empresas' && (
          <SimpleQueue
            title="Empresas propuestas"
            load={admin.listProposedCompanies}
            dialogTitle="Revisar empresa"
            withNote={false}
            options={[
              { value: 'activa', label: 'Activar' },
              { value: 'oculta', label: 'Ocultar' },
            ]}
            render={(c) => (
              <>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted">{[c.city, c.sector].filter(Boolean).join(' · ')}</p>
              </>
            )}
            decide={(c, v, reason) => admin.setCompanyStatus(c.id, v as 'activa', reason)}
          />
        )}
      </div>
    </>
  );
}

export default function Admin() {
  return (
    <>
      <PageHeader title="Moderación" crumbs={[{ to: '/admin', label: 'Moderación' }]}>
        Todas las decisiones quedan registradas con su motivo.
      </PageHeader>
      <div className="container-page">
        <SupabaseGate>
          <RequireAuth>
            <Panel />
          </RequireAuth>
        </SupabaseGate>
      </div>
    </>
  );
}
