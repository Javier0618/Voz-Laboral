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
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

export const relationshipLabel: Record<string, string> = {
  actual: 'Trabaja allí actualmente',
  anterior: 'Trabajó allí',
  prefiero_no_decir: 'Prefiere no decir su relación',
};

export function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString('es-CO')} ${n === 1 ? one : many}`;
}
