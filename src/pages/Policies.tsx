import { Link, useParams } from 'react-router-dom';
import { brand } from '../config/brand';
import { policies } from '../content/policies';
import { Alert, EmptyState } from '../components/ui';

export default function PolicyPage() {
  const { slug = '' } = useParams();
  const policy = policies.find((p) => p.slug === slug);

  if (!policy) {
    return (
      <div className="page py-10">
        <EmptyState title="No encontramos este documento" action={<Link to="/" className="btn-primary">Ir al inicio</Link>} />
      </div>
    );
  }

  return (
    <div className="page grid gap-12 py-10 lg:grid-cols-[1fr_16rem]">
      <article className="min-w-0">
        <h1 className="text-3xl sm:text-4xl">{policy.title}</h1>
        <p className="mt-3 max-w-prose text-lg text-slate">{policy.summary}</p>
        <div className="mt-6 max-w-prose">
          <Alert tone="warning" title="Borrador pendiente de revisión jurídica">
            Este texto es un borrador de trabajo y requiere revisión de un abogado colombiano antes del lanzamiento público. Los apartados
            entre corchetes están incompletos.
          </Alert>
        </div>
        {policy.sections.map((s) => (
          <section key={s.heading} className="mt-10 max-w-prose">
            <h2 className="text-2xl">{s.heading}</h2>
            {s.paragraphs.map((p, i) => <p key={i} className="mt-3 leading-7 text-ink">{p}</p>)}
          </section>
        ))}
        {brand.contactEmail && (
          <p className="mt-10 text-sm text-slate">Contacto: <a className="btn-link" href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a></p>
        )}
      </article>
      <nav aria-label="Documentos" className="text-sm lg:border-l lg:border-line lg:pl-8">
        <ul className="space-y-2">
          {policies.map((p) => (
            <li key={p.slug}>
              <Link to={`/politicas/${p.slug}`} aria-current={p.slug === slug ? 'page' : undefined}
                className={p.slug === slug ? 'font-semibold text-teal-strong' : 'text-slate hover:text-ink hover:underline'}>
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="page py-16">
      <EmptyState title="Esta página no existe" action={<Link to="/" className="btn-primary">Ir al inicio</Link>}>
        Revisa la dirección o busca la empresa que te interesa desde el inicio.
      </EmptyState>
    </div>
  );
}
