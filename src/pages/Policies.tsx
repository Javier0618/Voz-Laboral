import { useEffect, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { brand } from '../config/brand';
import { policies } from '../content/policies';
import { EmptyState } from '../components/ui';
import { setPageMeta } from '../lib/meta';

const LINK = /\[([^\]]+)\]\(((?:https:\/\/|mailto:|\/)[^)\s]*)\)/g;

/** Admite enlaces con el formato [texto](https://…) o [texto](/ruta) dentro de un párrafo. */
export function TextWithLinks({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const [whole, label, href] = m;
    const at = m.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    parts.push(
      href.startsWith('/')
        ? <Link key={at} to={href} className="btn-link">{label}</Link>
        : href.startsWith('mailto:')
        ? <a key={at} href={href} className="btn-link">{label}</a>
        : <a key={at} href={href} target="_blank" rel="noopener noreferrer" className="btn-link">{label}<span className="sr-only"> (se abre en otra pestaña)</span></a>,
    );
    last = at + whole.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export default function PolicyPage() {
  const { slug = '' } = useParams();
  const policy = policies.find((p) => p.slug === slug);

  useEffect(() => {
    setPageMeta(policy
      ? { title: `${policy.title} · ${brand.name}`, description: policy.summary, path: `/politicas/${policy.slug}`, type: 'website' }
      : { title: `Documento no encontrado · ${brand.name}`, description: 'Este documento no existe.', robots: 'noindex, follow' });
    return () => setPageMeta(null);
  }, [policy]);

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
        {policy.sections.map((s) => (
          <section key={s.heading} className="mt-10 max-w-prose">
            <h2 className="text-2xl">{s.heading}</h2>
            {s.paragraphs.map((p, i) => <p key={i} className="mt-3 leading-7 text-ink"><TextWithLinks text={p} /></p>)}
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
  // Página inexistente: no se indexa (evita que Google la trate como contenido).
  useEffect(() => {
    setPageMeta({ title: `Página no encontrada · ${brand.name}`, description: 'Esta página no existe.', robots: 'noindex, follow' });
    return () => setPageMeta(null);
  }, []);
  return (
    <div className="page py-16">
      <EmptyState title="Esta página no existe" action={<Link to="/" className="btn-primary">Ir al inicio</Link>}>
        Revisa la dirección, o busca la guía o la empresa que te interesa desde el inicio.
      </EmptyState>
    </div>
  );
}
