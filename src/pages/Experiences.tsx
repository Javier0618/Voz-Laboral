import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listCategories, listExperiences, PAGE_SIZE } from '../lib/api';
import { plural } from '../lib/format';
import { ExperienceItem } from '../components/ExperienceItem';
import { CompanyPicker } from '../components/CompanyPicker';
import { ConfigNotice, EmptyState, ErrorState, Loading, notConfigured, PageHeader, Pagination, useAsync } from '../components/ui';

const thisYear = new Date().getFullYear();
const years = Array.from({ length: thisYear - 1989 }, (_, i) => String(thisYear - i));

export default function Experiences() {
  const [params, setParams] = useSearchParams();
  const category = params.get('categoria') ?? '';
  const tone = params.get('tono') ?? '';
  const companyId = params.get('empresa') ?? '';
  const fromYear = params.get('desde') ?? '';
  const toYear = params.get('hasta') ?? '';
  const page = Math.max(1, Number(params.get('pagina') ?? 1) || 1);
  const [companyName, setCompanyName] = useState('');

  const categories = useAsync(() => (notConfigured ? Promise.resolve([]) : listCategories()), []);
  const list = useAsync(
    () => (notConfigured ? Promise.resolve([]) : listExperiences({ category, tone, companyId, fromYear, toYear, page })),
    [category, tone, companyId, fromYear, toYear, page],
  );
  const total = list.data?.[0]?.total_count ?? 0;

  function set(next: Record<string, string>) {
    const merged: Record<string, string> = { categoria: category, tono: tone, empresa: companyId, desde: fromYear, hasta: toYear, pagina: '', ...next };
    setParams(Object.fromEntries(Object.entries(merged).filter(([, v]) => v)));
  }

  return (
    <div className="page py-10">
      <PageHeader title="Experiencias">
        Experiencias buenas, malas y mixtas, publicadas tras la moderación. Cada una refleja la vivencia de quien la escribe: la plataforma
        no verifica los hechos.
      </PageHeader>

      {notConfigured ? (
        <div className="mt-8"><ConfigNotice /></div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[17rem_1fr]">
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Filtros">
            <fieldset>
              <legend className="label">Tipo de experiencia</legend>
              <div className="mt-1 flex flex-wrap gap-2">
                {[['', 'Todas'], ['positiva', 'Buenas'], ['mixta', 'Mixtas'], ['negativa', 'Malas']].map(([v, l]) => (
                  <button
                    key={v || 'todas'}
                    type="button"
                    aria-pressed={tone === v}
                    onClick={() => set({ tono: v })}
                    className={`min-h-[40px] rounded-full border px-3.5 text-sm font-semibold transition-colors ${
                      tone === v ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-ink hover:border-slate'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="f-cat" className="label">Categoría</label>
              <select id="f-cat" className="input" value={category} onChange={(e) => set({ categoria: e.target.value })}>
                <option value="">Todas</option>
                {categories.data?.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <CompanyPicker
              label="Empresa"
              optional
              value={companyId ? { id: companyId, name: companyName || 'Empresa seleccionada' } : null}
              onChange={(c) => {
                setCompanyName(c?.name ?? '');
                set({ empresa: c?.id ?? '' });
              }}
            />
            <fieldset>
              <legend className="label">Periodo aproximado</legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="f-desde" className="text-sm text-slate">Desde</label>
                  <select id="f-desde" className="input" value={fromYear} onChange={(e) => set({ desde: e.target.value })}>
                    <option value="">Cualquiera</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="f-hasta" className="text-sm text-slate">Hasta</label>
                  <select id="f-hasta" className="input" value={toYear} onChange={(e) => set({ hasta: e.target.value })}>
                    <option value="">Cualquiera</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>
            {(category || companyId || fromYear || toYear) && (
              <button type="button" className="btn-link" onClick={() => setParams({})}>Quitar filtros</button>
            )}
          </form>

          <section aria-live="polite" aria-busy={list.loading} className="min-w-0">
            <p className="border-b border-line pb-3 text-sm text-slate">
              {list.loading ? 'Cargando…' : plural(total, 'experiencia', 'experiencias')}
            </p>
            {list.loading ? (
              <Loading />
            ) : list.error ? (
              <div className="mt-6"><ErrorState error={list.error} onRetry={list.reload} /></div>
            ) : list.data && list.data.length > 0 ? (
              <div className="max-w-3xl">{list.data.map((exp) => <ExperienceItem key={exp.id} exp={exp} />)}</div>
            ) : (
              <div className="mt-6">
                {category || companyId || fromYear || toYear ? (
                  <EmptyState title="No hay experiencias con estos filtros" action={<button type="button" className="btn-secondary" onClick={() => setParams({})}>Quitar filtros</button>}>
                    Prueba con otra categoría o amplía el periodo.
                  </EmptyState>
                ) : (
                  <EmptyState title="Todavía no hay experiencias publicadas" action={<Link to="/compartir" className="btn-primary">Compartir una experiencia</Link>}>
                    Cuando una experiencia supere la revisión, aparecerá aquí.
                  </EmptyState>
                )}
              </div>
            )}
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPage={(p) => set({ pagina: String(p) })} />
          </section>
        </div>
      )}
    </div>
  );
}
