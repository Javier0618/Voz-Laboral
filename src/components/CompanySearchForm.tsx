import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from './Icons';

export function CompanySearchForm({ initial = '' }: { initial?: string }) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/empresas?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <label htmlFor="buscar-empresa" className="field-label text-lg">
        Busca una empresa
      </label>
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-paper p-2 focus-within:border-action sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" width={22} height={22} />
          <input
            id="buscar-empresa"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre o sigla de la empresa"
            autoComplete="off"
            className="block min-h-14 w-full rounded-lg border-0 bg-transparent pl-11 pr-3 text-lg text-ink placeholder:text-muted/80"
          />
        </div>
        <button type="submit" className="btn-primary min-h-14 px-7 text-lg">
          Buscar
        </button>
      </div>
      <p className="mt-2 text-sm text-muted">También puedes buscar por ciudad o sector en la página de empresas.</p>
    </form>
  );
}
