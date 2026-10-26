import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ExperienceStatus } from '../lib/api';
import type { AppError } from '../lib/supabase';
import { isConfigured } from '../lib/supabase';

// ---------------------------------------------------------------- estados
const statusStyles: Record<ExperienceStatus, { label: string; className: string; hint: string }> = {
  en_revision: { label: 'En revisión', className: 'bg-mist text-navy border-line', hint: 'El equipo de moderación aún no la ha revisado.' },
  publicada: { label: 'Publicada', className: 'bg-teal-tint text-teal-strong border-teal/30', hint: 'Visible para cualquier persona. Moderar no equivale a verificar los hechos.' },
  requiere_ajustes: { label: 'Requiere ajustes', className: 'bg-amber-tint text-amber border-amber/30', hint: 'Edítala siguiendo el motivo indicado y vuelve a enviarla.' },
  en_disputa: { label: 'En disputa', className: 'bg-amber-tint text-amber border-amber/30', hint: 'La empresa u otra persona presentó una reclamación que está en estudio.' },
  restringida: { label: 'Restringida temporalmente', className: 'bg-danger-tint text-danger border-danger/30', hint: 'Oculta mientras se revisa un riesgo concreto.' },
  retirada: { label: 'Retirada', className: 'bg-mist text-slate border-line', hint: 'No está visible públicamente.' },
};

export function StatusChip({ status }: { status: ExperienceStatus }) {
  const s = statusStyles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.className}`} title={s.hint}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}
export const statusHint = (s: ExperienceStatus) => statusStyles[s].hint;
export const statusLabel = (s: ExperienceStatus) => statusStyles[s].label;

// ---------------------------------------------------------------- mensajes
type Tone = 'info' | 'success' | 'warning' | 'error';
const toneClass: Record<Tone, string> = {
  info: 'border-navy/20 bg-mist text-ink',
  success: 'border-teal/30 bg-teal-tint text-ink',
  warning: 'border-amber/40 bg-amber-tint text-ink',
  error: 'border-danger/40 bg-danger-tint text-ink',
};

export function Alert({ tone = 'info', title, children }: { tone?: Tone; title?: string; children?: ReactNode }) {
  // role=alert solo para errores: interrumpe al lector de pantalla.
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded border-l-4 px-4 py-3 ${toneClass[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-1 text-sm' : 'text-sm'}>{children}</div>}
    </div>
  );
}

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-8 text-slate">
      <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-teal" />
      {label}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line px-6 py-10">
      <h3 className="text-xl">{title}</h3>
      {children && <div className="mt-2 max-w-prose text-slate">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: AppError; onRetry?: () => void }) {
  if (error.kind === 'config') return <ConfigNotice />;
  return (
    <Alert tone="error" title={error.kind === 'permission' ? 'Acceso no permitido' : 'No se pudo cargar la información'}>
      <p>{error.message}</p>
      {onRetry && (
        <button type="button" className="btn-link mt-2" onClick={onRetry}>
          Intentar de nuevo
        </button>
      )}
    </Alert>
  );
}

export function ConfigNotice() {
  return (
    <Alert tone="warning" title="Falta conectar la base de datos">
      <p>
        Esta instalación no tiene configuradas las variables <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>. Copia{' '}
        <code>.env.example</code> como <code>.env.local</code>, añade los datos de tu proyecto de Supabase y reinicia el servidor. No se
        muestran datos de ejemplo.
      </p>
    </Alert>
  );
}

export const notConfigured = !isConfigured;

// ---------------------------------------------------------------- formularios
export function Field({
  label, hint, error, children, optional,
}: { label: string; hint?: ReactNode; error?: string; optional?: boolean; children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid': boolean }) => ReactNode }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {optional && <span className="ml-1 font-normal text-slate">(opcional)</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': Boolean(error) })}
      {hint && <p id={hintId} className="hint">{hint}</p>}
      {error && <p id={errorId} className="field-error">{error}</p>}
    </div>
  );
}

export function Pagination({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Paginación" className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-4">
      <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Anterior
      </button>
      <span className="text-sm text-slate">Página {page} de {pages}</span>
      <button type="button" className="btn-secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Siguiente
      </button>
    </nav>
  );
}

// ---------------------------------------------------------------- diálogo
/** Diálogo modal accesible basado en <dialog>: atrapa el foco y se cierra con Escape. */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal?.();
    if (!open && el.open) el.close?.();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      className="w-[min(36rem,calc(100vw-2rem))] rounded-lg border border-line p-0 text-ink backdrop:bg-ink/50"
    >
      {open && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-xl">{title}</h2>
            <button type="button" className="-m-2 rounded p-2 text-slate hover:text-ink" onClick={onClose} aria-label="Cerrar">
              <span aria-hidden="true">✕</span>
            </button>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({
  open, title, children, confirmLabel, tone = 'danger', busy, onConfirm, onClose,
}: { open: boolean; title: string; children: ReactNode; confirmLabel: string; tone?: 'danger' | 'primary'; busy?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="text-slate">{children}</div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="button" className={tone === 'danger' ? 'btn-danger' : 'btn-primary'} disabled={busy} onClick={onConfirm}>
          {busy ? 'Procesando…' : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------- datos
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ loading: boolean; data: T | null; error: AppError | null }>({ loading: true, data: null, error: null });
  const [nonce, setNonce] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stable = useCallback(fn, deps);
  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    stable()
      .then((data) => active && setState({ loading: false, data, error: null }))
      .catch((error: AppError) => active && setState({ loading: false, data: null, error }));
    return () => {
      active = false;
    };
  }, [stable, nonce]);
  return { ...state, reload: () => setNonce((n) => n + 1) };
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="border-b border-line pb-6">
      <h1 className="text-3xl sm:text-4xl">{title}</h1>
      {children && <div className="mt-3 max-w-prose text-lg text-slate">{children}</div>}
    </header>
  );
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className="btn-link">{children}</Link>;
}
