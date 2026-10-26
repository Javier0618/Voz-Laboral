import { statusLabels, type ExperienceStatus } from '../shared/domain';

// Cada estado combina color, icono y texto: nunca depende solo del color.
const styles: Record<ExperienceStatus, { className: string; icon: string }> = {
  en_revision: { className: 'border-navy/30 bg-mist text-navy', icon: '○' },
  publicada: { className: 'border-action/30 bg-action-tint text-action', icon: '●' },
  requiere_ajustes: { className: 'border-warning/50 bg-paper text-warning', icon: '◐' },
  en_disputa: { className: 'border-warning/40 bg-paper text-warning', icon: '◆' },
  restringida: { className: 'border-danger/40 bg-paper text-danger', icon: '◇' },
  retirada: { className: 'border-line bg-mist text-muted', icon: '×' },
};

export function StatusChip({ status }: { status: ExperienceStatus }) {
  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-medium ${s.className}`}
    >
      <span aria-hidden="true">{s.icon}</span>
      {statusLabels[status]}
    </span>
  );
}
