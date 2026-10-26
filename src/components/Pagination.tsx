export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Paginación" className="mt-6 flex flex-wrap items-center gap-3">
      <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      <span className="text-muted" aria-live="polite">
        Página {page} de {pages}
      </span>
      <button type="button" className="btn-secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Siguiente
      </button>
    </nav>
  );
}
