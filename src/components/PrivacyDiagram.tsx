import { EyeIcon, LockIcon } from './Icons';

// Elemento memorable del inicio: una publicación tal como se ve en público,
// junto a lo que la plataforma guarda en privado.
function Redacted({ label, width }: { label: string; width: string }) {
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <span className="text-ink">{label}</span>
      <span className="flex items-center gap-2 text-sm text-muted">
        <span aria-hidden="true" className={`h-2.5 rounded-full bg-line ${width}`} />
        <span>oculto</span>
      </span>
    </li>
  );
}

export function PrivacyDiagram() {
  return (
    <figure className="relative" aria-labelledby="diagrama-privacidad">
      <figcaption id="diagrama-privacidad" className="sr-only">
        Lo que ven otros y lo que queda privado cuando compartes una experiencia
      </figcaption>

      <div className="rounded-xl border border-line bg-paper">
        <div className="flex items-center gap-2 border-b border-line px-5 py-3 text-action">
          <EyeIcon />
          <h2 className="font-sans text-base font-semibold">Lo que ven otros</h2>
        </div>
        <div className="px-5 py-5">
          <p className="text-sm text-muted">Pago de salarios · marzo a agosto de 2024</p>
          <p className="mt-2 font-serif text-xl font-semibold leading-snug text-ink">
            La quincena llegaba con dos semanas de retraso
          </p>
          <p className="mt-2 font-serif text-[1.05rem] leading-relaxed text-ink/85">
            Durante seis meses los pagos se atrasaron. Lo vi en mis desprendibles y en los de mi equipo…
          </p>
          <div className="mt-4 flex items-center gap-2.5">
            <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-action-tint font-semibold text-action">
              O
            </span>
            <span className="text-sm">
              Publicada por <span className="font-semibold text-ink">Operaria_Norte</span>
            </span>
            <span className="ml-auto rounded-full border border-action/30 bg-action-tint px-2 py-0.5 text-xs font-medium text-action">
              Alias público
            </span>
          </div>
        </div>
      </div>

      <div className="relative -mt-2 ml-4 rounded-xl border border-line bg-mist sm:ml-10">
        <div className="flex items-center gap-2 border-b border-line px-5 py-3 text-navy">
          <LockIcon />
          <h2 className="font-sans text-base font-semibold">Lo que queda privado</h2>
        </div>
        <ul className="divide-y divide-line px-5">
          <Redacted label="Tu correo electrónico" width="w-24" />
          <Redacted label="Tu dirección IP" width="w-16" />
          <Redacted label="Tu cuenta y su identificador" width="w-20" />
        </ul>
      </div>
      <p className="mt-3 text-sm text-muted">Ejemplo ilustrativo. No corresponde a una publicación real.</p>
    </figure>
  );
}
