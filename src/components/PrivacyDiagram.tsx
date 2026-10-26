// Elemento memorable del inicio: qué ven otras personas y qué queda privado.
export function PrivacyDiagram() {
  return (
    <figure className="rounded-lg border border-line bg-paper">
      <figcaption className="border-b border-line px-5 py-3 font-medium text-ink">
        Así se ve lo que compartes
      </figcaption>
      <div className="grid sm:grid-cols-2">
        <div className="border-b border-line p-5 sm:border-b-0 sm:border-r">
          <h2 className="font-sans text-base font-semibold text-action">Lo que ven otros</h2>
          <ul className="mt-3 space-y-2 text-ink">
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-action">●</span>
              <span>
                Tu alias, por ejemplo <span className="font-medium">Operaria_Norte</span>
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-action">●</span>
              <span>Tu relato, después de la revisión</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-action">●</span>
              <span>La empresa, la categoría y el periodo</span>
            </li>
          </ul>
        </div>
        <div className="bg-mist p-5">
          <h2 className="font-sans text-base font-semibold text-navy">Lo que queda privado</h2>
          <ul className="mt-3 space-y-2 text-ink">
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-navy">○</span>
              <span>Tu correo electrónico</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-navy">○</span>
              <span>Tu dirección IP</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-navy">○</span>
              <span>Tu cuenta y su identificador</span>
            </li>
          </ul>
        </div>
      </div>
    </figure>
  );
}
