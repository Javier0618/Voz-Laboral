import { useEffect, useId, useState } from 'react';
import { TextField } from '../../components/Field';
import { Notice } from '../../components/States';
import { friendlyError } from '../../lib/errors';
import { companyProposalSchema, fieldErrors } from '../../shared/schemas';
import type { Company } from '../../shared/domain';

export interface PickedCompany {
  id: string;
  name: string;
  proposed?: boolean;
}

export function CompanyPicker({
  value,
  onChange,
  error,
  search,
  propose,
}: {
  value: PickedCompany | null;
  onChange: (c: PickedCompany | null) => void;
  error?: string;
  search: (q: string) => Promise<Company[]>;
  propose: (name: string, city: string, sector: string) => Promise<string>;
}) {
  const groupId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Company[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [proposing, setProposing] = useState(false);
  const [proposal, setProposal] = useState({ name: '', city: '', sector: '' });
  const [proposalErrors, setProposalErrors] = useState<Record<string, string>>({});
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults(null);
      return;
    }
    let active = true;
    setSearching(true);
    const t = setTimeout(() => {
      search(term).then(
        (r) => {
          if (!active) return;
          setResults(r);
          setSearchError(null);
          setSearching(false);
        },
        (err) => {
          if (!active) return;
          setSearchError(friendlyError(err));
          setSearching(false);
        },
      );
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query, search]);

  async function submitProposal() {
    const parsed = companyProposalSchema.safeParse(proposal);
    if (!parsed.success) {
      setProposalErrors(fieldErrors(parsed.error));
      return;
    }
    setProposalErrors({});
    setBusy(true);
    setProposalError(null);
    try {
      const id = await propose(parsed.data.name, parsed.data.city, parsed.data.sector);
      onChange({ id, name: parsed.data.name, proposed: true });
      setProposing(false);
    } catch (err) {
      setProposalError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (value) {
    return (
      <fieldset>
        <legend className="field-label">Empresa</legend>
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-line p-3">
          <span className="font-medium">{value.name}</span>
          {value.proposed && <span className="text-sm text-muted">Propuesta: la moderación la revisará</span>}
          <button type="button" className="btn-link" onClick={() => onChange(null)}>
            Cambiar empresa
          </button>
        </div>
      </fieldset>
    );
  }

  return (
    <fieldset aria-describedby={error ? `${groupId}-error` : undefined}>
      <legend className="field-label">Empresa</legend>
      <TextField
        label="Busca la empresa por nombre o sigla"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      <div aria-live="polite" className="mt-2">
        {searching && <p className="text-muted">Buscando…</p>}
        {searchError && <p className="field-error">{searchError}</p>}
        {!searching && results && results.length === 0 && <p className="text-muted">No encontramos esa empresa.</p>}
      </div>
      {results && results.length > 0 && (
        <ul className="mt-2 divide-y divide-line rounded-md border border-line">
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex min-h-11 w-full flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-left hover:bg-mist"
                onClick={() => onChange({ id: c.id, name: c.name })}
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-sm text-muted">{[c.city, c.sector].filter(Boolean).join(' · ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p id={`${groupId}-error`} className="field-error">{error}</p>}
      {!proposing ? (
        <button type="button" className="btn-link mt-2" onClick={() => setProposing(true)}>
          La empresa no está en la lista
        </button>
      ) : (
        <div className="mt-3 space-y-3 rounded-md border border-line bg-mist p-4">
          <p className="font-medium">Propón la empresa</p>
          <p className="text-sm text-muted">No escribas el NIT ni datos de personas. La moderación la revisa antes de mostrarla.</p>
          <TextField label="Nombre de la empresa" value={proposal.name} error={proposalErrors.name}
            onChange={(e) => setProposal({ ...proposal, name: e.target.value })} />
          <TextField label="Ciudad" optional value={proposal.city} error={proposalErrors.city}
            onChange={(e) => setProposal({ ...proposal, city: e.target.value })} />
          <TextField label="Sector" optional value={proposal.sector} error={proposalErrors.sector}
            onChange={(e) => setProposal({ ...proposal, sector: e.target.value })} />
          {proposalError && <Notice tone="danger" role="alert">{proposalError}</Notice>}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={submitProposal} disabled={busy} aria-busy={busy}>
              {busy ? 'Enviando…' : 'Proponer empresa'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setProposing(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </fieldset>
  );
}
