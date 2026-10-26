import type { ReactNode } from 'react';

export function LoadingState({ label = 'Cargando' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 py-8 text-muted">
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-action motion-reduce:animate-none"
      />
      <span>{label}…</span>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border-y border-line py-8">
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="mt-1 text-muted">{children}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-4">
      <p className="font-medium text-danger">No pudimos cargar esta información</p>
      <p className="mt-1 text-ink">{message}</p>
      {onRetry && (
        <button type="button" className="btn-secondary mt-3" onClick={onRetry}>
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}

type NoticeTone = 'info' | 'warning' | 'danger' | 'success';
const toneClass: Record<NoticeTone, string> = {
  info: 'border-navy/20 bg-mist text-ink',
  warning: 'border-warning/40 bg-warning/5 text-ink',
  danger: 'border-danger/30 bg-danger/5 text-ink',
  success: 'border-action/30 bg-action-tint text-ink',
};

export function Notice({
  tone = 'info',
  title,
  children,
  role,
}: {
  tone?: NoticeTone;
  title?: string;
  children?: ReactNode;
  role?: 'status' | 'alert';
}) {
  return (
    <div role={role} className={`rounded-md border p-4 ${toneClass[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
    </div>
  );
}
