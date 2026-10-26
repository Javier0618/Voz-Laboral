const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** "2025-03-01" -> "marzo de 2025" (sin día: el periodo es aproximado). */
export function formatMonth(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m] = iso.split('-').map(Number);
  return `${months[m - 1]} de ${y}`;
}

export function formatPeriod(start: string, end: string | null): string {
  if (!end || end === start) return formatMonth(start);
  return `${formatMonth(start)} a ${formatMonth(end)}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  // Una fecha sin hora («2026-10-26») es un día del calendario: se lee en hora local, no en UTC.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

/** Fecha de hoy en hora local, como «2026-10-26». */
export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const relationshipLabel: Record<string, string> = {
  actual: 'Trabaja allí actualmente',
  anterior: 'Trabajó allí',
  prefiero_no_decir: 'Prefiere no decir su relación',
};

export function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString('es-CO')} ${n === 1 ? one : many}`;
}
