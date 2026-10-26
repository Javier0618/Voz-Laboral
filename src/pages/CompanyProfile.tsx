import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCompanyProfile, listCompanyResponses, listExperiences, PAGE_SIZE } from '../lib/api';
import { formatDate, plural } from '../lib/format';
import { ExperienceItem } from '../components/ExperienceItem';
import { ConfigNotice, EmptyState, ErrorState, Loading, notConfigured, Pagination, useAsync } from '../components/ui';

export default function CompanyProfile() {
  const { slug = '' } = useParams();
  const profile = useAsync(() => (notConfigured ? Promise.resolve(null) : getCompanyProfile(slug)), [slug]);

  if (notConfigured) return <div className="page py-10"><ConfigNotice /></div>;
  if (profile.loading) return <div className="page py-10"><Loading label="Cargando la empresa…" /></div>;
  if (profile.error) return <div className="page py-10"><ErrorState error={profile.error} onRetry={profile.reload} /></div>;
  if (!profile.data) {
    return (
      <div className="page py-10">
        <EmptyState title="No encontramos esta empresa" action={<Link to="/empresas" className="btn-primary">Buscar empresas</Link>}>
          Puede que el enlace esté mal escrito o que el perfil se haya fusionado con otro.
        </EmptyState>
      </div>
    );
  }

  const p = profile.data;
  const c = p.company;
  const period = p.period_from_year
    ? p.period_from_year === p.period_to_year ? `${p.period_from_year}` : `${p.period_from_year} a ${p.period_to_year}`
    : null;
  const max = Math.max(1, ...p.categories.map((x) => x.count));

  return (
    <div className="page py-10">
      <header className="border-b border-line pb-8">
        <p className="text-sm text-slate"><Link to="/empresas" className="hover:underline">Empresas</Link></p>
        <h1 className="mt-2 text-3xl sm:text-4xl">{c.trade_name}</h1>
        <p className="mt-2 text-lg text-slate">
          {c.legal_name && c.legal_name !== c.trade_name && <>{c.legal_name}. </>}
          {c.sector}. {c.city}, {c.department}
        </p>
        {c.aliases.length > 0 && <p className="mt-1 text-sm text-slate">También conocida como {c.aliases.join(', ')}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/compartir?empresa=${c.id}`} className="btn-primary">Compartir una experiencia sobre esta empresa</Link>
          {c.website && <a href={c.website} className="btn-secondary" target="_blank" rel="noopener noreferrer nofollow">Sitio web oficial</a>}
        </div>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="exp-empresa" className="min-w-0">
          <h2 id="exp-empresa" className="text-2xl">Experiencias</h2>
          <CompanyExperiences companyId={c.id} />
          <CompanyResponses companyId={c.id} />
        </section>

        <aside className="space-y-8 lg:border-l lg:border-line lg:pl-8">
          <section aria-labelledby="resumen">
            <h2 id="resumen" className="font-sans text-base font-semibold">Lo que ha recibido la plataforma</h2>
            <p className="mt-3 font-serif text-4xl text-ink">{p.visible_experiences}</p>
            <p className="text-sm text-slate">{p.visible_experiences === 1 ? 'experiencia publicada' : 'experiencias publicadas'}{period && `, de ${period}`}</p>
            {p.breakdown_hidden ? (
              p.visible_experiences > 0 && (
                <p className="mt-4 text-sm text-slate">
                  Con menos de 3 experiencias no mostramos el desglose por categoría, para que nadie pueda identificar a quien escribió.
                </p>
              )
            ) : (
              <ul className="mt-5 space-y-3">
                {p.categories.map((cat) => (
                  <li key={cat.slug}>
                    <div className="flex justify-between gap-3 text-sm">
                      <span>{cat.name}</span>
                      <span className="font-semibold tabular-nums">{cat.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-mist" aria-hidden="true">
                      <div className="h-1.5 rounded-full bg-navy" style={{ width: `${(cat.count / max) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-5 text-xs text-slate">
              Estas cifras reflejan solo las experiencias enviadas a esta plataforma. No describen el conjunto de las condiciones laborales de
              la empresa ni la frecuencia real de ninguna conducta.
            </p>
          </section>

          {p.open_claims > 0 && (
            <section className="rounded border border-amber/40 bg-amber-tint p-4 text-sm">
              <h2 className="font-sans text-sm font-semibold">Reclamaciones en estudio</h2>
              <p className="mt-1">La empresa tiene {plural(p.open_claims, 'solicitud de corrección', 'solicitudes de corrección')} en revisión.</p>
            </section>
          )}

          <section aria-labelledby="correcciones">
            <h2 id="correcciones" className="font-sans text-base font-semibold">¿Representas a esta empresa?</h2>
            <p className="mt-2 text-sm text-slate">
              Puedes pedir que corrijamos un dato verificable, que retiremos información privada o publicar una respuesta. Las reclamaciones
              no revelan quién escribió una experiencia ni permiten retirar críticas legítimas.
            </p>
            <Link to={`/empresas/${c.slug}/reclamacion`} className="btn-secondary mt-4 w-full">Solicitar una corrección</Link>
          </section>
          <p className="text-xs text-slate">Perfil actualizado el {formatDate(c.updated_at)}</p>
        </aside>
      </div>
    </div>
  );
}

function CompanyExperiences({ companyId }: { companyId: string }) {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => listExperiences({ companyId, page }), [companyId, page]);
  if (loading) return <Loading />;
  if (error) return <div className="mt-4"><ErrorState error={error} onRetry={reload} /></div>;
  if (!data?.length) {
    return (
      <div className="mt-4">
        <EmptyState title="Aún no hay experiencias publicadas sobre esta empresa">
          Si trabajas o trabajaste allí, puedes ser la primera persona en contar cómo fue.
        </EmptyState>
      </div>
    );
  }
  return (
    <>
      <div className="mt-2">{data.map((exp) => <ExperienceItem key={exp.id} exp={exp} showCompany={false} />)}</div>
      <Pagination page={page} total={data[0].total_count} pageSize={PAGE_SIZE} onPage={setPage} />
    </>
  );
}

function CompanyResponses({ companyId }: { companyId: string }) {
  const { data, error } = useAsync(() => listCompanyResponses(companyId), [companyId]);
  if (error || !data?.length) return null;
  return (
    <section aria-labelledby="respuestas" className="mt-12">
      <h2 id="respuestas" className="text-2xl">Respuestas de la empresa</h2>
      <p className="mt-1 text-sm text-slate">Publicadas por representantes cuya identidad verificó el equipo. Son la versión de la empresa, no conclusiones de la plataforma.</p>
      <ul className="mt-4 space-y-4">
        {data.map((r) => (
          <li key={r.id} className="rounded border border-navy/25 bg-mist p-5">
            <p className="text-sm font-semibold text-navy">{r.representative_label}</p>
            <p className="mt-2 whitespace-pre-line">{r.body}</p>
            <p className="mt-3 text-xs text-slate">Publicada el {formatDate(r.created_at)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
