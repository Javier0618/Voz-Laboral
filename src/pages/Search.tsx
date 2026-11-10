/**
 * Buscador del sitio (/buscar): guías, calculadoras, temas y empresas.
 *
 * Rendimiento: la página se carga aparte (lazy) y solo consulta la base de
 * datos después de una pausa al escribir. Las calculadoras y los temas se
 * buscan en el navegador, sin red. Cada búsqueda terminada se registra de
 * forma anónima una sola vez (término y número de resultados, sin datos de
 * la persona) para saber qué guías faltan.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { logSearch, searchCompanies, searchGuides, type CompanySummary, type GuideHit } from '../lib/api';
import { normalizeQuery, searchCalculators, searchTopics } from '../lib/search';
import { CALCULADORAS } from '../lib/calculadoras';
import { TEMAS_GUIAS } from '../lib/temasGuias';
import { setPageMeta } from '../lib/meta';
import { plural } from '../lib/format';
import { brand } from '../config/brand';
import { ConfigNotice, Loading, notConfigured } from '../components/ui';
import { publicPath } from '../lib/publicPath.mjs';

const DEBOUNCE_MS = 300;
const LOG_AFTER_MS = 1500;
const logged = new Set<string>();

type Results = { term: string; guides: GuideHit[]; companies: CompanySummary[] };

export default function Search() {
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') ?? '';
  const [text, setText] = useState(initial);
  const [term, setTerm] = useState(normalizeQuery(initial));
  const [results, setResults] = useState<Results | null>(null);
  const [failed, setFailed] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPageMeta({
      title: `Buscar · ${brand.name}`,
      description: 'Busca guías laborales, calculadoras y empresas en TuVozLaboral.',
      path: '/buscar',
      type: 'website',
      // Google no indexa páginas de resultados de búsqueda internas.
      robots: 'noindex, follow',
    });
    input.current?.focus();
    return () => setPageMeta(null);
  }, []);

  // Pausa al escribir antes de consultar; la dirección se actualiza sin crear historial.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setTerm(normalizeQuery(text));
      setParams(text.trim() ? { q: text.trim() } : {}, { replace: true });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [text, setParams]);

  useEffect(() => {
    if (term.length < 2 || notConfigured) {
      setResults(null);
      return;
    }
    let active = true;
    setFailed(false);
    Promise.all([
      searchGuides(term),
      searchCompanies({ query: term, pageSize: 5 }).then((c) => c.filter((x) => !x.is_suggestion)),
    ])
      .then(([guides, companies]) => active && setResults({ term, guides, companies }))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [term]);

  const calculators = useMemo(() => searchCalculators(term), [term]);
  const topics = useMemo(() => searchTopics(term), [term]);
  const ready = results?.term === term;
  const total = ready ? results.guides.length + results.companies.length + calculators.length + topics.length : 0;

  // Registro anónimo: una vez por término, cuando la persona deja de escribir.
  useEffect(() => {
    if (!ready || term.length < 3 || logged.has(term)) return;
    const id = window.setTimeout(() => {
      logged.add(term);
      logSearch(term, total).catch(() => undefined);
    }, LOG_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [ready, term, total]);

  return (
    <div className="page py-10 sm:py-14">
      <h1 className="text-4xl font-bold tracking-[-0.01em] sm:text-5xl">Buscar</h1>
      <form role="search" className="mt-6 max-w-2xl" onSubmit={(e) => { e.preventDefault(); setTerm(normalizeQuery(text)); }}>
        <label htmlFor="buscar-sitio" className="sr-only">Qué quieres buscar</label>
        <div className="flex gap-2">
          <input
            ref={input}
            id="buscar-sitio"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Prima, vacaciones, despido, una empresa…"
            autoComplete="off"
            maxLength={80}
            className="input flex-1 text-lg"
          />
          <button type="submit" className="btn btn-primary">Buscar</button>
        </div>
      </form>

      {notConfigured && <div className="mt-8"><ConfigNotice /></div>}

      <div className="mt-10" aria-live="polite">
        {term.length < 2 ? (
          <Suggestions />
        ) : failed ? (
          <p className="text-slate">No pudimos buscar en este momento. Intenta de nuevo en unos segundos.</p>
        ) : !ready ? (
          <Loading label="Buscando…" />
        ) : total === 0 ? (
          <NoResults text={text.trim()} />
        ) : (
          <div className="space-y-12">
            <p className="text-sm text-slate">{plural(total, 'resultado', 'resultados')} para «{text.trim()}»</p>
            {results.guides.length > 0 && (
              <Group title="Guías">
                {results.guides.map((g) => (
                  <li key={g.slug}>
                    <Link to={`/derechos/${g.slug}/`} className="group block py-4">
                      <span className="text-lg font-semibold group-hover:underline">{g.title}</span>
                      <span className="mt-1 block max-w-prose text-slate">{g.summary}</span>
                    </Link>
                  </li>
                ))}
              </Group>
            )}
            {calculators.length > 0 && (
              <Group title="Calculadoras">
                {calculators.map((c) => (
                  <li key={c.path}>
                    <Link to={publicPath(c.path)} className="group block py-4">
                      <span className="text-lg font-semibold group-hover:underline">{c.title}</span>
                      <span className="mt-1 block max-w-prose text-slate">{c.description}</span>
                    </Link>
                  </li>
                ))}
              </Group>
            )}
            {topics.length > 0 && (
              <Group title="Temas de guías">
                {topics.map((t) => (
                  <li key={t.slug}>
                    <Link to={`/derechos/?tema=${t.slug}`} className="group block py-4">
                      <span className="text-lg font-semibold group-hover:underline">{t.name}</span>
                      <span className="mt-1 block max-w-prose text-slate">{t.description}</span>
                    </Link>
                  </li>
                ))}
              </Group>
            )}
            {results.companies.length > 0 && (
              <Group title="Empresas">
                {results.companies.map((c) => (
                  <li key={c.id}>
                    <Link to={`/empresas/${c.slug}`} className="group block py-4">
                      <span className="text-lg font-semibold group-hover:underline">{c.trade_name}</span>
                      <span className="mt-1 block text-slate">
                        {[c.sector, c.city].filter(Boolean).join(' · ')} · {plural(Number(c.visible_experiences), 'experiencia', 'experiencias')}
                      </span>
                    </Link>
                  </li>
                ))}
                <li className="py-4">
                  <Link to={`/empresas/?q=${encodeURIComponent(text.trim())}`} className="font-semibold underline">Ver todas las empresas que coinciden</Link>
                </li>
              </Group>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate">{title}</h2>
      <ul className="mt-2 divide-y divide-line border-y border-line">{children}</ul>
    </section>
  );
}

function Suggestions() {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate">Temas de las guías</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {TEMAS_GUIAS.map((t) => (
          <li key={t.slug}>
            <Link to={`/derechos/?tema=${t.slug}`} className="inline-block rounded-full border border-line px-4 py-1.5 text-sm font-semibold hover:border-ink">{t.name}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NoResults({ text }: { text: string }) {
  return (
    <div className="space-y-10">
      <div className="max-w-prose">
        <h2 className="text-2xl font-bold">No encontramos «{text}»</h2>
        <p className="mt-3 text-slate">
          Prueba con otra palabra, por ejemplo «prima» en vez de «pago de junio». Los temas que se buscan y todavía no tienen guía nos ayudan a
          decidir qué escribir: se cuentan de forma anónima, sin guardar quién buscó.
        </p>
        <p className="mt-3 text-slate">
          ¿Buscabas una empresa que no está? <Link to="/empresas/" className="font-semibold text-ink underline">Pide que la agreguen desde Empresas</Link>.
        </p>
      </div>
      <Group title="Calculadoras">
        {CALCULADORAS.slice(0, 5).map((c) => (
          <li key={c.path}><Link to={publicPath(c.path)} className="block py-3 font-semibold hover:underline">{c.title}</Link></li>
        ))}
      </Group>
      <Suggestions />
    </div>
  );
}
