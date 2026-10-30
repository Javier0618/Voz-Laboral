import { TIPOS_HORA, type ResultadoTurnos, type TipoHora } from '../lib/nomina';

const fmtH = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 2 });

const GRUPOS: { titulo: string; tipos: TipoHora[]; ayuda: string }[] = [
  {
    titulo: 'Horas extra',
    tipos: ['HED', 'HEN', 'HEDD', 'HEDN'],
    ayuda: 'Por encima de tu jornada. Se pagan la hora completa más el recargo.',
  },
  {
    titulo: 'Recargos de la jornada normal',
    tipos: ['RN', 'RDD', 'RDN'],
    ayuda:
      'Horas de tu jornada que caen de noche o en domingo/festivo. Solo se suma el porcentaje; la hora ya va en el salario o en el valor del día.',
  },
];

/** Resumen en vivo de extras y recargos a partir del calendario de turnos. */
export function ResumenClasificacionHoras({ r, compact }: { r: ResultadoTurnos; compact?: boolean }) {
  if (r.turnos === 0 || r.horasTrabajadas < 0.001) return null;
  const extras = r.horasTrabajadas - r.horasOrdinarias;
  const nombre = (tipo: TipoHora) => TIPOS_HORA.find((t) => t.tipo === tipo)?.nombre ?? tipo;

  return (
    <section
      className={compact ? 'mt-3 rounded border border-line bg-paper p-3' : 'mt-4 rounded-lg border border-line bg-mist/80 p-4 sm:p-5'}
      aria-labelledby="clasificacion-horas"
    >
      <h3 id="clasificacion-horas" className="font-sans text-sm font-semibold text-ink">
        Clasificación de tus turnos
      </h3>
      <p className="mt-2 text-sm text-slate">
        <span className="font-semibold text-ink">{fmtH(r.horasTrabajadas)} h</span> trabajadas
        <span aria-hidden="true"> · </span>
        <span className="font-semibold text-ink">{fmtH(r.horasOrdinarias)} h</span> ordinarias
        <span aria-hidden="true"> · </span>
        <span className="font-semibold text-ink">{fmtH(extras)} h</span> extra
      </p>

      {GRUPOS.map((g) => {
        const filas = g.tipos.filter((t) => r.horas[t] > 0.001);
        if (!filas.length) return null;
        return (
          <div key={g.titulo} className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-strong">{g.titulo}</p>
            <p className="mt-0.5 text-xs text-slate">{g.ayuda}</p>
            <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
              {filas.map((t) => (
                <div key={t} className="contents">
                  <dt className="text-slate">{nombre(t)}</dt>
                  <dd className="tabular-nums font-medium text-ink">{fmtH(r.horas[t])} h</dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}

      {extras < 0.001 && !GRUPOS.some((g) => g.tipos.some((t) => r.horas[t] > 0.001)) ? (
        <p className="mt-3 text-sm text-slate">Todos los minutos entran como jornada ordinaria diurna (sin recargo ni extra).</p>
      ) : null}
    </section>
  );
}
