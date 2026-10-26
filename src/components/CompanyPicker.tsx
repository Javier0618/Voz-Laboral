import { useEffect, useId, useRef, useState } from 'react';
import { searchCompanies, type CompanySummary } from '../lib/api';

export interface PickedCompany { id: string; name: string; detail?: string }

/**
 * Selector de empresa con búsqueda (patrón combobox de WAI-ARIA).
 * Muestra ciudad y sector para distinguir empresas con nombres parecidos.
 */
export function CompanyPicker({
  label, value, onChange, error, optional, hint,
}: { label: string; value: PickedCompany | null; onChange: (c: PickedCompany | null) => void; error?: string; optional?: boolean; hint?: string }) {
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompanySummary[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<number>();

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = window.setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      try {
        setResults(await searchCompanies({ query, pageSize: 8 }));
        setOpen(true);
        setActive(-1);
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer.current);
  }, [query]);

  function pick(c: CompanySummary) {
    onChange({ id: c.id, name: c.trade_name, detail: `${c.sector}. ${c.city}, ${c.department}` });
    setQuery('');
    setOpen(false);
  }

  if (value) {
    return (
      <div>
        <p className="label">{label}</p>
        <div className="flex items-start justify-between gap-3 rounded border border-teal/40 bg-teal-tint px-3 py-2">
          <span>
            <span className="block font-semibold">{value.name}</span>
            {value.detail && <span className="block text-sm text-slate">{value.detail}</span>}
          </span>
          <button type="button" className="btn-link shrink-0 text-sm" onClick={() => onChange(null)}>Cambiar</button>
        </div>
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="label">
        {label}
        {optional && <span className="ml-1 font-normal text-slate">(opcional)</span>}
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className="input"
        placeholder="Nombre, sigla o NIT"
        value={query}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === 'Enter' && active >= 0 && results[active]) { e.preventDefault(); pick(results[active]); }
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {hint && !error && <p id={`${id}-hint`} className="hint">{hint}</p>}
      {error && <p id={`${id}-err`} className="field-error">{error}</p>}
      <p className="sr-only" aria-live="polite">
        {loading ? 'Buscando' : open && query.length >= 2 ? results[0]?.is_suggestion ? `Sin coincidencia exacta, ${results.length} nombres parecidos` : `${results.length} resultados` : ''}
      </p>
      {failed && <p className="field-error">No se pudo buscar. Revisa tu conexión.</p>}
      {open && query.trim().length >= 2 && !loading && (
        <ul id={listId} role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded border border-line bg-paper py-1 shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate">Sin coincidencias en el catálogo.</li>
          ) : (
            <>
            {results[0].is_suggestion && (
              <li role="presentation" className="border-b border-line px-3 py-2 text-xs font-semibold text-amber">
                No está en el catálogo con ese nombre. Estas empresas solo se parecen:
              </li>
            )}
            {results.map((c, i) => (
              <li
                key={c.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={`cursor-pointer px-3 py-2 ${i === active ? 'bg-teal-tint' : 'hover:bg-mist'}`}
                onMouseDown={(e) => { e.preventDefault(); pick(c); }}
              >
                <span className="block font-semibold">{c.trade_name}</span>
                <span className="block text-sm text-slate">{c.sector}. {c.city}, {c.department}</span>
              </li>
            ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
