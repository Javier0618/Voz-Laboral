import { Link } from 'react-router-dom';
import { listExperiences } from '../lib/api';
import { formatPeriod } from '../lib/format';
import { notConfigured, useAsync } from './ui';

const SNIPPET = 180;

/**
 * Fase 4.2: puente guía ↔ comunidad. Muestra hasta 3 experiencias publicadas
 * de la misma categoría. Si no hay ninguna o falla la carga, no muestra nada:
 * la guía es el contenido principal.
 */
export function RelatedExperiences({ category, topicName }: { category: string | null; topicName: string }) {
  const { data } = useAsync(
    () => (notConfigured || !category ? Promise.resolve([]) : listExperiences({ category, pageSize: 3 })),
    [category],
  );
  const items = data ?? [];
  if (!category || items.length === 0) return null;

  return (
    <section className="mt-12 max-w-prose print:hidden" aria-labelledby="experiencias-relacionadas">
      <h2 id="experiencias-relacionadas" className="text-2xl">Lo que cuentan quienes lo han vivido</h2>
      <p className="mt-2 text-sm leading-6 text-slate">
        Experiencias publicadas sobre {topicName.toLowerCase()}. Son relatos personales: la moderación revisa que cumplan las reglas, no que
        los hechos sean ciertos.
      </p>
      <ul className="mt-5 divide-y divide-line border-y border-line">
        {items.map((e) => {
          const body = e.body.length > SNIPPET ? `${e.body.slice(0, SNIPPET).trimEnd()}…` : e.body;
          return (
            <li key={e.id}>
              <Link to={`/experiencias/${e.id}`} className="group block py-5">
                <span className="block text-sm text-slate">
                  {e.company_name} · {formatPeriod(e.period_start, e.period_end)}
                </span>
                {e.title && (
                  <span className="mt-1 block font-serif text-lg leading-snug text-ink group-hover:underline group-hover:decoration-teal/60">
                    {e.title}
                  </span>
                )}
                <span className="testimony mt-1 block text-[0.9375rem] leading-7">{body}</span>
                <span className="mt-2 block text-xs text-slate">Contada por {e.author_alias}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link to={`/experiencias/?categoria=${category}`} className="btn-link mt-4 inline-block">
        Ver más experiencias sobre {topicName.toLowerCase()}
      </Link>
    </section>
  );
}
