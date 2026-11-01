import { Link } from 'react-router-dom';
import { GUIAS_POR_CALCULADORA } from '../lib/guiasPrioritarias';

/** Enlaces a guías desde una calculadora (Fase 3). */
export function CalculatorGuideLinks({ path }: { path: string }) {
  const links = GUIAS_POR_CALCULADORA[path];
  if (!links?.length) return null;
  return (
    <section className="mt-12 max-w-prose rounded-lg border border-line bg-mist/80 p-6" aria-labelledby="guias-calc">
      <h2 id="guias-calc" className="font-sans text-lg font-semibold text-ink">Lee la guía sobre este tema</h2>
      <p className="mt-2 text-sm leading-6 text-slate">
        Cómo se calcula en la ley y qué puedes hacer si algo no cuadra con tu desprendible.
      </p>
      <ul className="mt-4 space-y-2">
        {links.map((g) => (
          <li key={g.slug}>
            <Link to={`/derechos/${g.slug}`} className="btn-link font-semibold">
              {g.label} →
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        <Link to="/derechos" className="btn-link">Ver todas las guías laborales</Link>
      </p>
    </section>
  );
}
