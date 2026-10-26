import { Link, useParams } from 'react-router-dom';
import { getLegalResource, listCategories, listLegalResources } from '../lib/api';
import { formatDate } from '../lib/format';
import { ConfigNotice, EmptyState, ErrorState, Loading, notConfigured, PageHeader, useAsync } from '../components/ui';

const disclaimer =
  'Información general. No es asesoría jurídica ni una decisión sobre un caso particular. Para tu situación concreta, consulta al Ministerio del Trabajo, a un inspector de trabajo o a un profesional del derecho.';

export default function Rights() {
  const resources = useAsync(() => (notConfigured ? Promise.resolve([]) : listLegalResources()), []);
  const categories = useAsync(() => (notConfigured ? Promise.resolve([]) : listCategories()), []);

  return (
    <div className="page py-10">
      <PageHeader title="Tus derechos laborales">
        Guías de información general sobre los temas que más aparecen en las experiencias. Cada guía cita su fuente oficial y la fecha en
        que se verificó por última vez.
      </PageHeader>
      <p className="mt-6 max-w-prose rounded border-l-4 border-navy/30 bg-mist px-4 py-3 text-sm">{disclaimer}</p>

      <div className="mt-10">
        {notConfigured ? <ConfigNotice /> : resources.loading ? <Loading /> : resources.error ? (
          <ErrorState error={resources.error} onRetry={resources.reload} />
        ) : !resources.data?.length ? (
          <EmptyState title="Las guías están en verificación">
            Publicamos cada guía solo después de comprobar su contenido contra la fuente oficial vigente. Mientras tanto, para orientación sobre
            tu caso acude a los canales del Ministerio del Trabajo o a un profesional del derecho.
          </EmptyState>
        ) : (
          <div className="space-y-12">
            {[...(categories.data ?? []), { slug: '', name: 'Temas generales' }].map((cat) => {
              const items = resources.data!.filter((r) => (r.category_slug ?? '') === cat.slug);
              if (!items.length) return null;
              return (
                <section key={cat.slug || 'general'} aria-labelledby={`cat-${cat.slug || 'general'}`}>
                  <h2 id={`cat-${cat.slug || 'general'}`} className="text-2xl">{cat.name}</h2>
                  <ul className="mt-4">
                    {items.map((r) => (
                      <li key={r.id} className="border-t border-line">
                        <Link to={`/derechos/${r.slug}`} className="group block py-5">
                          <span className="block font-serif text-xl text-ink group-hover:text-teal-strong group-hover:underline">{r.title}</span>
                          <span className="mt-1 block max-w-prose text-slate">{r.summary}</span>
                          {r.last_verified_at && <span className="mt-2 block text-sm text-slate">Verificada el {formatDate(r.last_verified_at)}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function RightsArticle() {
  const { slug = '' } = useParams();
  const { data, loading, error, reload } = useAsync(() => (notConfigured ? Promise.resolve(null) : getLegalResource(slug)), [slug]);

  if (notConfigured) return <div className="page py-10"><ConfigNotice /></div>;
  if (loading) return <div className="page py-10"><Loading /></div>;
  if (error) return <div className="page py-10"><ErrorState error={error} onRetry={reload} /></div>;
  if (!data) {
    return (
      <div className="page py-10">
        <EmptyState title="No encontramos esta guía" action={<Link to="/derechos" className="btn-primary">Ver todas las guías</Link>}>
          Puede que se haya archivado mientras se actualiza su contenido.
        </EmptyState>
      </div>
    );
  }

  return (
    <article className="page py-10">
      <p className="text-sm text-slate"><Link to="/derechos" className="hover:underline">Tus derechos</Link></p>
      <h1 className="mt-2 max-w-3xl text-3xl sm:text-4xl">{data.title}</h1>
      <p className="mt-3 max-w-prose text-lg text-slate">{data.summary}</p>
      <p className="mt-4 text-sm text-slate">
        {data.last_verified_at ? `Verificada contra la fuente oficial el ${formatDate(data.last_verified_at)}` : 'Pendiente de verificación'}. Última
        actualización: {formatDate(data.updated_at)}.
      </p>
      <div className="testimony mt-8">{data.content}</div>
      <section className="mt-10 max-w-prose border-t border-line pt-6" aria-labelledby="fuentes">
        <h2 id="fuentes" className="font-sans text-base font-semibold">Fuentes oficiales</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {data.legal_resource_sources?.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn-link">{s.label}</a>
              <span className="block text-slate">{s.publisher}. Consultada el {formatDate(s.accessed_at)}</span>
            </li>
          ))}
        </ul>
      </section>
      <p className="mt-8 max-w-prose rounded border-l-4 border-navy/30 bg-mist px-4 py-3 text-sm">{data.disclaimer}</p>
    </article>
  );
}
