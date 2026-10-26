const monthFormatter = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dateFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

export function formatMonth(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  const [y, m] = isoDate.split('-').map(Number);
  return monthFormatter.format(new Date(Date.UTC(y, (m ?? 1) - 1, 1)));
}

export function formatPeriod(start: string | null, end: string | null): string {
  if (!start) return 'Sin periodo';
  const from = formatMonth(start);
  if (!end || end.slice(0, 7) === start.slice(0, 7)) return from;
  return `${from} a ${formatMonth(end)}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return dateFormatter.format(new Date(iso));
}

/** "2025-03" -> "2025-03-01" */
export function monthToDate(month: string): string {
  return `${month}-01`;
}

export function pluralize(n: number, one: string, many: string): string {
  return `${n.toLocaleString('es-CO')} ${n === 1 ? one : many}`;
}
