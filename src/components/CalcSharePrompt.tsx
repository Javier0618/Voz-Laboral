import { Link } from 'react-router-dom';

interface SharePromptProps {
  categoria?: string;
  motivo?: string;
  mensaje?: string;
}

export function CalcSharePrompt({
  categoria = 'salario-y-pagos',
  motivo = '¿Detectaste diferencias o tu empresa no te pagó lo correspondiente?',
  mensaje = 'Cuenta tu experiencia con un alias o sin cuenta. Tu testimonio ayuda a otros trabajadores a conocer la realidad de las empresas.',
}: SharePromptProps) {
  const url = `/compartir?categoria=${encodeURIComponent(categoria)}`;

  return (
    <div className="mt-6 rounded-lg border border-teal/30 bg-teal-tint p-5 text-sm print:hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-ink">{motivo}</p>
          <p className="mt-1 text-slate">{mensaje}</p>
        </div>
        <Link to={url} className="btn-primary shrink-0 self-start sm:self-center">
          Compartir experiencia
        </Link>
      </div>
    </div>
  );
}
