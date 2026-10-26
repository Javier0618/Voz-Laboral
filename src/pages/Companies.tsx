import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { SupabaseGate } from '../components/SupabaseGate';
import { TextField } from '../components/Field';
import { searchCompanies } from '../lib/api';
import { pluralize } from '../lib/format';
import { useAsync } from '../lib/useAsync';

const PAGE_SIZE = 20;

function Results() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const city = params.get('ciudad') ?? '';
  const sector = params.get('sector') ?? '';
  const page = Math.max(1, Number(params.get('pagina') ?? '1') || 1);
  const [form, setForm] = useState({ q, city, sector });

  const result = useAsync(
    () => searchCompanies({ query: q, city, sector, page, pageSize: PAGE_SIZE }),
    [q, city, sector, page],
  );

  function apply(next: Record<string, string>) {
    const p = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => v && p.set(k, v));
    setParams(p);
  }

  return (
    <>
      <form
        role="search"
        className="grid gap-4 py-6 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q: form.q.trim(), ciudad: form.city.trim(), sector: form.sector.trim() });
        }}
      >
        <TextField label="Nombre o alias" type="search" value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} />
        <TextField label="Ciudad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <TextField label="Sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
        <button type="submit" className="btn-primary">Buscar</button>
      </form>

      {result.status === 'loading' && <LoadingState label="Buscando empresas" />}
      {result.status === 'error' && <ErrorState message={result.error} onRetry={result.reload} />}
      {result.status === 'success' &&
        (result.data.rows.length === 0 ? (
          <EmptyState title="No encontramos empresas con esos criterios">
            Prueba con otro nombre o sin filtros. Si la empresa no existe, puedes proponerla al{' '}
            <Link to="/compartir">compartir tu experiencia</Link>.
          </EmptyState>
        ) : (
          <>
            <p className="text-muted" aria-live="polite">
              {pluralize(result.data.total, 'empresa encontrada', 'empresas encontradas')}
            </p>
            <ul className="mt-2 border-t border-line">
              {result.data.rows.map((c) => (
                <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-4">
                  <div>
                    <Link to={`/empresas/${c.slug}`} className="font-serif text-xl font-semibold">
                      {c.name}
                    </Link>
                    <p className="text-muted">{[c.city, c.sector].filter(Boolean).join(' · ') || 'Sin ciudad ni sector'}</p>
                  </div>
                  <span className="text-muted">{pluralize(Number(c.experience_count), 'experiencia', 'experiencias')}</span>
                </li>
              ))}
            </ul>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={result.data.total}
              onChange={(p) => apply({ q, ciudad: city, sector, pagina: String(p) })}
            />
          </>
        ))}
    </>
  );
}

export default function Companies() {
  return (
    <div className="container-page">
      <PageHeader title="Empresas">Busca por nombre, sigla, ciudad o sector.</PageHeader>
      <SupabaseGate>
        <Results />
      </SupabaseGate>
    </div>
  );
}
