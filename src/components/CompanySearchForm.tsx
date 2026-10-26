import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function CompanySearchForm({ size = 'large', initial = '' }: { size?: 'large' | 'normal'; initial?: string }) {
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
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="buscar-empresa"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre o sigla de la empresa"
          autoComplete="off"
          className={`input ${size === 'large' ? 'min-h-14 text-lg' : ''}`}
        />
        <button type="submit" className={`btn-primary ${size === 'large' ? 'min-h-14 px-6 text-lg' : ''}`}>
          Buscar
        </button>
      </div>
    </form>
  );
}
