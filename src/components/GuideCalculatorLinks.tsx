import { Link } from 'react-router-dom';
import { brand } from '../config/brand';
import { calculadorasRelacionadas } from '../lib/calculadoras';

/** Bloque de calculadoras sugeridas según el texto de una guía. */
export function GuideCalculatorLinks(props: {
  slug: string;
  title: string;
  summary: string;
  topicName: string;
}) {
  const tools = calculadorasRelacionadas(props.slug, props.title, props.summary, props.topicName);
  if (!tools.length) return null;
  return (
    <section className="mt-12 max-w-prose rounded-lg border border-line bg-mist/80 p-6 print:hidden" aria-labelledby="herramientas-guia">
      <h2 id="herramientas-guia" className="font-sans text-lg font-semibold text-ink">Calculadoras relacionadas</h2>
      <p className="mt-2 text-sm leading-6 text-slate">
        Herramientas de {brand.name} para estimar cifras de este tema. Son orientativas: no reemplazan el desprendible ni una asesoría.
      </p>
      <ul className="mt-4 space-y-3">
        {tools.map((t) => (
          <li key={t.path}>
            <Link to={t.path} className="group block rounded-md border border-line bg-paper px-4 py-3 hover:border-slate">
              <span className="font-semibold text-ink group-hover:text-teal-strong group-hover:underline">{t.title}</span>
              <span className="mt-0.5 block text-sm text-slate">{t.description}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        <Link to="/calculadoras" className="btn-link">Ver todas las calculadoras</Link>
      </p>
    </section>
  );
}
