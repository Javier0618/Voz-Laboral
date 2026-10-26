import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PAGE_SIZE, searchCompanies } from '../lib/api';
import { formatDate, plural } from '../lib/format';
import { Alert, ConfigNotice, EmptyState, ErrorState, Loading, notConfigured, PageHeader, Pagination, useAsync } from '../components/ui';
import { SuggestCompanyDialog } from '../components/SuggestCompanyDialog';

export default function Companies() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const city = params.get('ciudad') ?? '';
  const sector = params.get('sector') ?? '';
  const order = (params.get('orden') as 'relevancia' | 'actividad') || 'relevancia';
  const page = Math.max(1, Number(params.get('pagina') ?? 1) || 1);

  const [draft, setDraft] = useState({ q, city, sector });
  const [suggesting, setSuggesting] = useState(false);

  const { data, loading, error, reload } = useAsync(
    () => (notConfigured ? Promise.resolve([]) : searchCompanies({ query: q, city, sector, order, page })),
    [q, city, sector, order, page],
  );
  const total = data?.[0]?.total_count ?? 0;
  const onlySuggestions = Boolean(data?.[0]?.is_suggestion);

  function apply(next: Record<string, string>) {
    const merged = { q, ciudad: city, sector, orden: order, pagina: '1', ...next };
    const clean = Object.fromEntries(Object.entries(merged).filter(([k, v]) => v && !(k === 'orden' && v === 'relevancia') && !(k === 'pagina' && v === '1')));
    setParams(clean);
  }

  return (
    <div className="page py-10">
      <PageHeader title="Empresas">
        Busca por nombre comercial, razón social, sigla o NIT completo. El NIT solo se usa para encontrar la empresa: no se muestra. Si la empresa no aparece, puedes sugerirla para que el equipo la revise antes de
        incluirla.
      </PageHeader>

      <form
        role="search"
        className="mt-8 grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q: draft.q.trim(), ciudad: draft.city.trim(), sector: draft.sector.trim() });
        }}
      >
        <div>
          <label htmlFor="f-q" className="label">Nombre o NIT</label>
          <input id="f-q" type="search" className="input" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} placeholder="Ej.: nombre, sigla o 899999068" />
        </div>
        <div>
          <label htmlFor="f-city" className="label">Ciudad</label>
          <input id="f-city" className="input" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
        </div>
        <div>
          <label htmlFor="f-sector" className="label">Sector</label>
          <input id="f-sector" className="input" value={draft.sector} onChange={(e) => setDraft({ ...draft, sector: e.target.value })} />
        </div>
        <button type="submit" className="btn-primary">Buscar</button>
      </form>

      {notConfigured ? (
        <div className="mt-8"><ConfigNotice /></div>
      ) : (
        <section className="mt-8" aria-live="polite" aria-busy={loading}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <p className="text-sm text-slate">{loading ? 'Buscando…' : onlySuggestions ? plural(total, 'nombre parecido', 'nombres parecidos') : plural(total, 'empresa encontrada', 'empresas encontradas')}</p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate">Ordenar por</span>
              <select className="input min-h-[40px] w-auto py-1" value={order} onChange={(e) => apply({ orden: e.target.value })}>
                <option value="relevancia">Relevancia</option>
                <option value="actividad">Actividad reciente</option>
              </select>
            </label>
          </div>

          {loading ? (
            <Loading label="Buscando empresas…" />
          ) : error ? (
            <div className="mt-6"><ErrorState error={error} onRetry={reload} /></div>
          ) : data && data.length > 0 ? (
            <>
            {onlySuggestions && (
              <div className="mt-6">
                <Alert tone="warning" title={`No encontramos «${q}» en el catálogo`}>
                  Estas empresas tienen nombres parecidos, pero pueden ser otras. Comprueba la ciudad y el sector antes de abrir una, o sugiere la
                  empresa que buscas.
                </Alert>
              </div>
            )}
            <ul>
              {data.map((c) => (
                <li key={c.id} className="border-b border-line">
                  <Link to={`/empresas/${c.slug}`} className="group grid gap-1 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
                    <span>
                      <span className="block font-serif text-xl text-ink group-hover:text-teal-strong group-hover:underline">{c.trade_name}</span>
                      <span className="mt-1 block text-sm text-slate">
                        {c.legal_name && c.legal_name !== c.trade_name ? `${c.legal_name}. ` : ''}
                        {c.sector}. {c.city}, {c.department}
                      </span>
                    </span>
                    <span className="text-sm text-slate sm:text-right">
                      <span className="block font-semibold text-ink">{plural(c.visible_experiences, 'experiencia', 'experiencias')}</span>
                      {c.last_activity && <span>Última el {formatDate(c.last_activity)}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            </>
          ) : (
            <div className="mt-6">
              <EmptyState
                title={q ? `No encontramos empresas para «${q}»` : 'Aún no hay empresas en el catálogo'}
                action={<button type="button" className="btn-secondary" onClick={() => setSuggesting(true)}>Sugerir una empresa</button>}
              >
                Revisa la ortografía o prueba con la sigla. Si la empresa no está, sugiérela: el equipo comprobará sus datos antes de crear el
                perfil.
              </EmptyState>
            </div>
          )}
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPage={(p) => apply({ pagina: String(p) })} />
          {data && data.length > 0 && (
            <p className="mt-6 text-sm text-slate">
              ¿No es la empresa que buscabas? <button type="button" className="btn-link" onClick={() => setSuggesting(true)}>Sugiere una empresa</button>
            </p>
          )}
        </section>
      )}
      <SuggestCompanyDialog open={suggesting} onClose={() => setSuggesting(false)} initialName={q} />
    </div>
  );
}
