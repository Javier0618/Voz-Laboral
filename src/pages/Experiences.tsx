import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExperienceItem } from '../components/ExperienceItem';
import { SelectField, TextField } from '../components/Field';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { SupabaseGate } from '../components/SupabaseGate';
import { listCategories, listPublicExperiences, searchCompanies } from '../lib/api';
import { monthToDate, pluralize } from '../lib/format';
import { useAsync } from '../lib/useAsync';

const PAGE_SIZE = 10;

function List() {
  const [params, setParams] = useSearchParams();
  const categoryId = Number(params.get('categoria') ?? '') || undefined;
  const companyQuery = params.get('empresa') ?? '';
  const from = params.get('desde') ?? '';
  const to = params.get('hasta') ?? '';
  const page = Math.max(1, Number(params.get('pagina') ?? '1') || 1);
  const [form, setForm] = useState({ categoria: categoryId ? String(categoryId) : '', empresa: companyQuery, desde: from, hasta: to });

  const categories = useAsync(listCategories, []);
  const data = useAsync(async () => {
    let companyId: string | undefined;
    if (companyQuery) {
      const match = await searchCompanies({ query: companyQuery, page: 1, pageSize: 1 });
      if (!match.rows[0]) return { rows: [], total: 0, companyName: null as string | null };
      companyId = match.rows[0].id;
    }
    const list = await listPublicExperiences({
      categoryId,
      companyId,
      from: from ? monthToDate(from) : undefined,
      to: to ? monthToDate(to) : undefined,
      page,
      pageSize: PAGE_SIZE,
    });
    return { ...list, companyName: companyId ? list.rows[0]?.company_name ?? null : null };
  }, [categoryId, companyQuery, from, to, page]);

  function apply(next: Record<string, string>) {
    const p = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => v && p.set(k, v));
    setParams(p);
  }

  return (
    <>
      <form
        className="-mt-8 mb-6 grid gap-4 rounded-xl border border-line bg-paper p-5 sm:grid-cols-2 lg:grid-cols-[1.5fr_1.5fr_1fr_1fr_auto] lg:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          apply({ ...form, empresa: form.empresa.trim() });
        }}
        aria-label="Filtrar experiencias"
      >
        <SelectField label="Categoría" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
          <option value="">Todas</option>
          {categories.status === 'success' &&
            categories.data.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </SelectField>
        <TextField label="Empresa" type="search" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} />
        <TextField label="Desde" type="month" value={form.desde} onChange={(e) => setForm({ ...form, desde: e.target.value })} />
        <TextField label="Hasta" type="month" value={form.hasta} onChange={(e) => setForm({ ...form, hasta: e.target.value })} />
        <button type="submit" className="btn-primary">Filtrar</button>
      </form>

      {data.status === 'loading' && <LoadingState label="Cargando experiencias" />}
      {data.status === 'error' && <ErrorState message={data.error} onRetry={data.reload} />}
      {data.status === 'success' &&
        (data.data.rows.length === 0 ? (
          <EmptyState title="No hay experiencias publicadas con estos filtros">Prueba con otros filtros.</EmptyState>
        ) : (
          <>
            <p className="text-muted" aria-live="polite">
              {pluralize(data.data.total, 'experiencia', 'experiencias')}
              {data.data.companyName ? ` en ${data.data.companyName}` : ''}
            </p>
            <div className="border-t border-line">
              {data.data.rows.map((e) => (
                <ExperienceItem key={e.id} experience={e} />
              ))}
            </div>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={data.data.total}
              onChange={(p) => apply({ categoria: form.categoria, empresa: companyQuery, desde: from, hasta: to, pagina: String(p) })}
            />
          </>
        ))}
    </>
  );
}

export default function Experiences() {
  return (
    <>
      <PageHeader title="Experiencias" crumbs={[{ to: '/experiencias', label: 'Experiencias' }]}>
        Relatos revisados por la moderación antes de publicarse. Filtra por categoría, empresa o periodo.
      </PageHeader>
      <div className="container-page">
        <SupabaseGate>
          <List />
        </SupabaseGate>
      </div>
    </>
  );
}
