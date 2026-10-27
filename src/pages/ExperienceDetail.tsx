import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { brand } from '../config/brand';
import { getPublicExperience, listCompanyResponses, listExperiences } from '../lib/api';
import { formatDate } from '../lib/format';
import { setPageMeta } from '../lib/meta';
import { ExperienceItem, ShareButton } from '../components/ExperienceItem';
import { ConfigNotice, EmptyState, ErrorState, Loading, notConfigured, useAsync } from '../components/ui';

/** Página propia de una experiencia: se puede enlazar y compartir. */
export default function ExperienceDetail() {
  const { id = '' } = useParams();
  const valid = /^[0-9a-f-]{36}$/i.test(id);
  const exp = useAsync(() => (notConfigured || !valid ? Promise.resolve(null) : getPublicExperience(id)), [id]);
  const data = exp.data;
  const responses = useAsync(
    () => (data ? listCompanyResponses(data.company_id) : Promise.resolve([])),
    [data?.company_id],
  );
  const more = useAsync(
    () => (data ? listExperiences({ companyId: data.company_id, pageSize: 4 }) : Promise.resolve([])),
    [data?.company_id],
  );

  useEffect(() => {
    if (!data) return;
    const summary = data.body.replace(/\s+/g, ' ').slice(0, 155).trimEnd();
    setPageMeta({
      title: `${data.title || data.category_name} · ${data.company_name} · ${brand.name}`,
      description: `${summary}${data.body.length > 155 ? '…' : ''}`,
    });
    return () => setPageMeta(null);
  }, [data]);

  if (notConfigured) return <div className="page py-10"><ConfigNotice /></div>;
  if (exp.loading) return <div className="page py-10"><Loading /></div>;
  if (exp.error) return <div className="page py-10"><ErrorState error={exp.error} onRetry={exp.reload} /></div>;
  if (!data) {
    return (
      <div className="page py-10">
        <EmptyState title="Esta experiencia no está disponible" action={<Link to="/experiencias" className="btn-primary">Ver otras experiencias</Link>}>
          Puede que su autor la haya retirado, que esté en revisión o que el enlace esté incompleto.
        </EmptyState>
      </div>
    );
  }

  const response = (responses.data ?? []).find((r) => r.experience_id === data.id);
  const others = (more.data ?? []).filter((e) => e.id !== data.id).slice(0, 3);

  return (
    <div className="page py-10">
      <nav aria-label="Ruta de navegación" className="text-sm text-slate">
        <Link to="/experiencias" className="hover:text-ink hover:underline">Experiencias</Link>
        <span aria-hidden="true" className="mx-2">/</span>
        <Link to={`/empresas/${data.company_slug}`} className="hover:text-ink hover:underline">{data.company_name}</Link>
      </nav>

      <div className="mt-4 grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          <ExperienceItem exp={data} full />
          {response && (
            <section className="mt-2 max-w-prose rounded-lg border-l-4 border-navy bg-mist px-5 py-4" aria-labelledby="respuesta-empresa">
              <h2 id="respuesta-empresa" className="font-sans text-base font-semibold">Respuesta de la empresa</h2>
              <p className="mt-1 text-sm text-slate">{response.representative_label} · {formatDate(response.created_at)}</p>
              <p className="mt-3 whitespace-pre-line">{response.body}</p>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start" aria-label="Más sobre esta empresa">
          <div className="rounded-lg border border-line p-6">
            <p className="text-sm text-slate">Empresa</p>
            <p className="mt-1 font-serif text-2xl leading-tight">{data.company_name}</p>
            <Link to={`/empresas/${data.company_slug}`} className="btn-secondary mt-4 w-full">Ver todas sus experiencias</Link>
            <Link to={`/compartir?empresa=${data.company_id}`} className="btn-primary mt-3 w-full">Contar mi experiencia aquí</Link>
          </div>
          <div className="rounded-lg bg-mist p-6">
            <p className="font-semibold">¿Le sirve a alguien que conoces?</p>
            <p className="mt-1 text-sm leading-6 text-slate">Compártela con quien esté pensando en trabajar en esta empresa.</p>
            <div className="mt-4"><ShareButton exp={data} variant="button" /></div>
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="mt-16 border-t border-ink/80 pt-10" aria-labelledby="mas-experiencias">
          <h2 id="mas-experiencias" className="text-2xl">Otras experiencias en {data.company_name}</h2>
          <div className="mt-4 max-w-3xl">
            {others.map((e) => <ExperienceItem key={e.id} exp={e} showCompany={false} />)}
          </div>
        </section>
      )}
    </div>
  );
}
