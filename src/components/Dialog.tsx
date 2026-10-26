import { useEffect, useId, useRef, type ReactNode } from 'react';

// Diálogo modal accesible sobre <dialog> nativo: atrapa el foco, se cierra
// con Escape y devuelve el foco al elemento que lo abrió.
export function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      opener.current = document.activeElement;
      if (typeof el.showModal === 'function') el.showModal();
      else el.setAttribute('open', '');
    } else if (!open && el.open) {
      if (typeof el.close === 'function') el.close();
      else el.removeAttribute('open');
      (opener.current as HTMLElement | null)?.focus?.();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="w-[min(36rem,calc(100vw-2rem))] rounded-lg border border-line bg-paper p-0 text-ink backdrop:bg-ink/40"
    >
      {open && (
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-2xl">
              {title}
            </h2>
            <button type="button" className="btn-secondary min-h-11 px-3" onClick={onClose}>
              Cerrar
            </button>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <div className="text-ink">{description}</div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className={danger ? 'btn-danger' : 'btn-primary'}
          onClick={onConfirm}
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? 'Procesando…' : confirmLabel}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
          Cancelar
        </button>
      </div>
    </Dialog>
  );
}
