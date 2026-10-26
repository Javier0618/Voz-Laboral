import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ClaimButton } from '../components/ClaimDialog';
import { ExperienceItem } from '../components/ExperienceItem';
import { Breadcrumbs, usePageTitle } from '../components/PageHeader';
import { Monogram } from '../components/Monogram';
import { Pagination } from '../components/Pagination';
import { EmptyState, ErrorState, LoadingState, Notice } from '../components/States';
import { SupabaseGate } from '../components/SupabaseGate';
import { getCompanyBySlug, getCompanyStats, listCompanyResponses, listPublicExperiences } from '../lib/api';
import { formatPeriod, pluralize } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import type { Company } from '../shared/domain';

const PAGE_SIZE = 10;

function Distribution({ companyId }: { companyId: string }) {
  const stats = useAsync(() => getCompanyStats(companyId), [companyId]);
  if (stats.status === 'loading') return <LoadingState label="Cargando cifras" />;
  if (stats.status === 'error') return <ErrorState message={stats.error} onRetry={stats.reload} />;
  const s = stats.data;
  const max = Math.max(1, ...s.categories.map((c) => c.count));
  return (
    <section aria-labelledby="distribucion" className="py-8">
      <h2 id="distribucion" className="text-2xl">Lo que ha recibido la plataforma</h2>
      <dl className="my-5 grid grid-cols-2 gap-4 lg:grid-cols-1">
        <div className="border-l-2 border-action pl-4">
          <dt className="text-muted">Experiencias visibles</dt>
          <dd className="font-serif text-3xl font-semibold">{s.visible_count.toLocaleString('es-CO')}</dd>
        </div>
        <div className="border-l-2 border-line pl-4">
          <dt className="text-muted">Periodo cubierto</dt>
          <dd className="font-serif text-2xl">{s.period_from ? formatPeriod(s.period_from, s.period_to) : 'Sin datos'}</dd>
        </div>
      </dl>
      <Notice tone="info">
        Esta distribución solo refleja las experiencias que ha recibido la plataforma. No es una calificación de la
        empresa ni representa a todas las personas que trabajan ahí.
      </Notice>
      {s.categories.length > 0 ? (
        <ul className="mt-5 space-y-4" aria-label="Distribución por categoría">
          {s.categories.map((c) => (
            <li key={c.category_id}>
              <div className="flex justify-between gap-4">
                <span>{c.name}</span>
                <span className="font-medium">{c.count}</span>
              </div>
              <div aria-hidden="true" className="mt-1 h-2 rounded-full bg-mist">
                <div className="h-2 rounded-full bg-navy" style={{ width: `${(c.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        s.visible_count > 0 && (
          <p className="mt-4 text-muted">Aún no hay suficientes experiencias por categoría para mostrar la distribución.</p>
        )
      )}
      {s.hidden_categories > 0 && (
        <p className="mt-3 text-sm text-muted">
          {pluralize(s.hidden_categories, 'categoría tiene', 'categorías tienen')} menos de 3 experiencias y no se
          muestra por separado, para proteger a quienes publicaron.
        </p>
      )}
    </section>
  );
}

function Experiences({ company }: { company: Company }) {
  const [page, setPage] = useState(1);
  const data = useAsync(async () => {
    const [list, responses] = await Promise.all([
      listPublicExperiences({ companyId: company.id, page, pageSize: PAGE_SIZE }),
      listCompanyResponses(company.id),
    ]);
    return { ...list, responses };
  }, [company.id, page]);

  return (
    <section aria-labelledby="recientes" className="py-8">
      <h2 id="recientes" className="text-2xl">Experiencias recientes</h2>
      {data.status === 'loading' && <LoadingState label="Cargando experiencias" />}
      {data.status === 'error' && <ErrorState message={data.error} onRetry={data.reload} />}
      {data.status === 'success' &&
        (data.data.rows.length === 0 ? (
          <EmptyState title="Todavía no hay experiencias publicadas sobre esta empresa">
            <Link to={`/compartir?empresa=${company.id}`}>Comparte la tuya</Link>
          </EmptyState>
        ) : (
          <>
            {data.data.rows.map((e) => (
              <ExperienceItem
                key={e.id}
                experience={e}
                showCompany={false}
                response={data.data.responses.find((r) => r.experience_id === e.id)}
              />
            ))}
            <Pagination page={page} pageSize={PAGE_SIZE} total={data.data.total} onChange={setPage} />
          </>
        ))}
    </section>
  );
}

function Profile({ slug }: { slug: string }) {
  const company = useAsync(() => getCompanyBySlug(slug), [slug]);
  usePageTitle(company.status === 'success' && company.data ? company.data.name : 'Empresa');
  if (company.status === 'loading') return <div className="container-page"><LoadingState label="Cargando empresa" /></div>;
  if (company.status === 'error') return <div className="container-page py-8"><ErrorState message={company.error} onRetry={company.reload} /></div>;
  if (!company.data) {
    return (
      <div className="container-page py-10">
        <h1 className="text-4xl">No encontramos esta empresa</h1>
        <p className="mt-2 text-muted">Puede que no exista o que aún esté en revisión.</p>
        <Link className="btn-secondary mt-4" to="/empresas">Volver a empresas</Link>
      </div>
    );
  }
  const c = company.data;
  return (
    <>
      <div className="border-b border-line bg-mist">
        <div className="container-page py-10 sm:py-14">
          <Breadcrumbs items={[{ to: '/empresas', label: 'Empresas' }, { to: `/empresas/${c.slug}`, label: c.name }]} />
          <div className="mt-5 flex flex-wrap items-start gap-5">
            <Monogram text={c.name} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="text-4xl leading-tight sm:text-5xl">{c.name}</h1>
              <p className="mt-2 text-lg text-muted">{[c.city, c.sector].filter(Boolean).join(' · ') || 'Sin ciudad ni sector registrados'}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn-primary" to={`/compartir?empresa=${c.id}`}>Compartir experiencia</Link>
            <ClaimButton companyId={c.id} companyName={c.name} />
          </div>
        </div>
      </div>
      <div className="container-page grid gap-x-16 lg:grid-cols-[1fr_20rem]">
        <div className="order-2 lg:order-1">
          <Experiences company={c} />
        </div>
        <aside className="order-1 lg:order-2 lg:sticky lg:top-20 lg:self-start" aria-label="Resumen">
          <Distribution companyId={c.id} />
        </aside>
      </div>
    </>
  );
}

export default function CompanyProfile() {
  const { slug = '' } = useParams();
  return (
    <SupabaseGate>
      <Profile slug={slug} />
    </SupabaseGate>
  );
}
