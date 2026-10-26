import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { getLegalResource, listCategories, listLegalResources, registerGuideView, type Category, type LegalResource } from '../lib/api';
import { formatDate, todayLocal } from '../lib/format';
import { guideOutline, plainText, readingMinutes } from '../lib/guide';
import { GuideBody } from '../components/GuideBody';
import { ConfigNotice, EmptyState, ErrorState, Loading, notConfigured, PageHeader, useAsync } from '../components/ui';

const disclaimer =
  'Información general. No es asesoría jurídica ni una decisión sobre un caso particular. Para tu situación concreta, consulta al Ministerio del Trabajo, a un inspector de trabajo o a un profesional del derecho.';

// La guía de «a dónde acudir» se destaca como ayuda inmediata si está publicada.
const HELP_SLUG_PREFIX = 'a-donde-acudir';

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function categoryName(categories: Category[] | null | undefined, slug: string | null) {
  return categories?.find((c) => c.slug === slug)?.name ?? 'Temas generales';
}

function GuideMeta({ guide, className = '' }: { guide: LegalResource; className?: string }) {
  return (
    <p className={`flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate ${className}`}>
      <span>Lectura de {readingMinutes(guide.content)} min</span>
      {guide.last_verified_at && (
        <>
          <span aria-hidden="true">·</span>
          <span>Verificada el {formatDate(guide.last_verified_at)}</span>
        </>
      )}
    </p>
  );
}

function HelpAside({ guides }: { guides: LegalResource[] }) {
  const help = guides.find((g) => g.slug.startsWith(HELP_SLUG_PREFIX));
  return (
    <aside className="space-y-6 lg:sticky lg:top-6" aria-label="Ayuda">
      <div className="rounded-lg bg-ink p-6 text-white">
        <h2 className="font-serif text-xl text-white">¿Necesitas ayuda ahora?</h2>
        <p className="mt-2 text-sm leading-6 text-white/80">
          Estas guías explican tus derechos en general. Para actuar en un caso concreto, acude a las autoridades del trabajo.
        </p>
        {help && (
          <Link to={`/derechos/${help.slug}`} className="btn mt-4 w-full bg-white text-ink hover:bg-teal-tint">
            Ver a dónde acudir
          </Link>
        )}
      </div>
      <div className="rounded-lg border border-line p-6">
        <h2 className="font-sans text-base font-semibold">¿Te pasó algo así?</h2>
        <p className="mt-2 text-sm leading-6 text-slate">Cuéntalo con un alias. Tu experiencia ayuda a otras personas a saber qué esperar.</p>
        <Link to="/compartir" className="btn-primary mt-4 w-full">Compartir una experiencia</Link>
      </div>
      <p className="text-sm leading-6 text-slate">{disclaimer}</p>
    </aside>
  );
}

export default function Rights() {
  const resources = useAsync(() => (notConfigured ? Promise.resolve([]) : listLegalResources()), []);
  const categories = useAsync(() => (notConfigured ? Promise.resolve([]) : listCategories()), []);
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const topic = params.get('tema') ?? '';

  const setFilter = (next: { q?: string; tema?: string }) => {
    const merged = { q: query, tema: topic, ...next };
    const out = new URLSearchParams();
    if (merged.q) out.set('q', merged.q);
    if (merged.tema) out.set('tema', merged.tema);
    setParams(out, { replace: true });
  };

  const guides = resources.data ?? [];
  // Temas que tienen al menos una guía publicada, en el orden de las categorías.
  const topics = useMemo(() => {
    const used = new Set(guides.map((g) => g.category_slug ?? ''));
    const list = (categories.data ?? []).filter((c) => used.has(c.slug)).map((c) => ({ slug: c.slug, name: c.name }));
    if (used.has('')) list.push({ slug: 'generales', name: 'Temas generales' });
    return list;
  }, [guides, categories.data]);

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return guides.filter((g) => {
      const slug = g.category_slug ?? 'generales';
      if (topic && slug !== topic) return false;
      if (!q) return true;
      return normalize(`${g.title} ${g.summary} ${plainText(g.content)}`).includes(q);
    });
  }, [guides, query, topic]);

  return (
    <div className="page py-10">
      <PageHeader title="Tus derechos laborales">
        Guías claras sobre los temas que más aparecen en las experiencias: salario, jornada, contrato, acoso y a dónde acudir. Cada una cita
        su fuente oficial y la fecha en que se verificó.
      </PageHeader>

      {notConfigured ? (
        <div className="mt-10"><ConfigNotice /></div>
      ) : resources.loading ? (
        <Loading />
      ) : resources.error ? (
        <div className="mt-10"><ErrorState error={resources.error} onRetry={resources.reload} /></div>
      ) : !guides.length ? (
        <div className="mt-10">
          <EmptyState title="Las guías están en revisión jurídica">
            Publicaremos cada guía cuando un abogado confirme su contenido contra la norma vigente.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div>
            <form role="search" onSubmit={(e) => e.preventDefault()} className="space-y-5">
              <div>
                <label htmlFor="buscar-guias" className="label">Buscar en las guías</label>
                <input
                  id="buscar-guias"
                  type="search"
                  className="input"
                  placeholder="Por ejemplo: horas extra, vacaciones, despido"
                  value={query}
                  onChange={(e) => setFilter({ q: e.target.value })}
                />
              </div>
              {topics.length > 1 && (
                <div role="group" aria-label="Filtrar por tema" className="flex flex-wrap gap-2">
                  {[{ slug: '', name: 'Todos los temas' }, ...topics].map((t) => {
                    const active = topic === t.slug;
                    return (
                      <button
                        key={t.slug || 'todos'}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFilter({ tema: t.slug })}
                        className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold transition-colors ${
                          active ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-ink hover:border-slate'
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </form>

            <p className="mt-8 text-sm text-slate" aria-live="polite">
              {visible.length === guides.length
                ? `${guides.length} ${guides.length === 1 ? 'guía publicada' : 'guías publicadas'}`
                : `${visible.length} de ${guides.length} guías`}
            </p>

            {visible.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="Ninguna guía coincide"
                  action={<button type="button" className="btn-secondary" onClick={() => setFilter({ q: '', tema: '' })}>Ver todas las guías</button>}
                >
                  Prueba con otra palabra o quita el filtro de tema.
                </EmptyState>
              </div>
            ) : (
              <ol className="mt-3 border-t border-ink/80">
                {visible.map((g) => (
                  <li key={g.id} className="border-b border-line">
                    <Link to={`/derechos/${g.slug}`} className="group grid gap-x-6 py-6 sm:grid-cols-[3.5rem_minmax(0,1fr)]">
                      <span aria-hidden="true" className="hidden font-serif text-3xl leading-none text-teal/70 sm:block">
                        {String(guides.indexOf(g) + 1).padStart(2, '0')}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-teal-strong">{categoryName(categories.data, g.category_slug)}</span>
                        <span className="mt-1 block font-serif text-2xl leading-tight text-ink group-hover:underline group-hover:decoration-teal/60 group-hover:underline-offset-4">
                          {g.title}
                        </span>
                        <span className="mt-2 block max-w-prose text-slate">{g.summary}</span>
                        <GuideMeta guide={g} className="mt-3" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <HelpAside guides={guides} />
        </div>
      )}
    </div>
  );
}

export function RightsArticle() {
  const { slug = '' } = useParams();
  const { data, loading, error, reload } = useAsync(() => (notConfigured ? Promise.resolve(null) : getLegalResource(slug)), [slug]);
  const all = useAsync(() => (notConfigured ? Promise.resolve([]) : listLegalResources()), []);
  const categories = useAsync(() => (notConfigured ? Promise.resolve([]) : listCategories()), []);
  useEffect(() => {
    if (data) countViewOncePerDay(slug);
  }, [data, slug]);
  useEffect(() => {
    if (data) document.title = `${data.title} · VozLaboral`;
  }, [data]);

  if (notConfigured) return <div className="page py-10"><ConfigNotice /></div>;
  if (loading) return <div className="page py-10"><Loading /></div>;
  if (error) return <div className="page py-10"><ErrorState error={error} onRetry={reload} /></div>;
  if (!data) {
    return (
      <div className="page py-10">
        <EmptyState title="No encontramos esta guía" action={<Link to="/derechos" className="btn-primary">Ver todas las guías</Link>}>
          Puede que se haya archivado mientras se actualiza su contenido.
        </EmptyState>
      </div>
    );
  }

  const outline = guideOutline(data.content);
  const topicName = categoryName(categories.data, data.category_slug);
  const others = (all.data ?? []).filter((g) => g.id !== data.id);
  const related = [...others.filter((g) => g.category_slug === data.category_slug), ...others.filter((g) => g.category_slug !== data.category_slug)].slice(0, 3);
  const sources = data.legal_resource_sources ?? [];

  return (
    <article>
      <header className="border-b border-line bg-mist">
        <div className="page py-10 sm:py-14">
          <nav aria-label="Ruta de navegación" className="text-sm text-slate print:hidden">
            <Link to="/derechos" className="hover:text-ink hover:underline">Tus derechos</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <Link to={`/derechos?tema=${data.category_slug ?? 'generales'}`} className="hover:text-ink hover:underline">{topicName}</Link>
          </nav>
          <h1 className="mt-4 max-w-3xl text-4xl font-medium leading-[1.1] tracking-[-0.01em] sm:text-5xl">{data.title}</h1>
          <p className="mt-5 max-w-prose text-lg leading-8 text-slate">{data.summary}</p>
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-ink/15 pt-5 text-sm">
            <div>
              <dt className="text-slate">Tema</dt>
              <dd className="mt-0.5 font-semibold">{topicName}</dd>
            </div>
            <div>
              <dt className="text-slate">Lectura</dt>
              <dd className="mt-0.5 font-semibold">{readingMinutes(data.content)} min</dd>
            </div>
            <div>
              <dt className="text-slate">Verificada contra la fuente oficial</dt>
              <dd className="mt-0.5 font-semibold">{data.last_verified_at ? formatDate(data.last_verified_at) : 'Pendiente'}</dd>
            </div>
            <div>
              <dt className="text-slate">Última actualización</dt>
              <dd className="mt-0.5 font-semibold">{formatDate(data.updated_at)}</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="page grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0">
          <GuideBody content={data.content} />

          {sources.length > 0 && (
            <section className="mt-14 max-w-prose border-t border-ink/80 pt-8" aria-labelledby="fuentes">
              <h2 id="fuentes" className="scroll-mt-6 text-2xl">Fuentes oficiales</h2>
              <ol className="mt-5 space-y-4">
                {sources.map((s, i) => (
                  <li key={s.id} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2">
                    <span aria-hidden="true" className="font-serif text-lg text-teal-strong">{i + 1}.</span>
                    <span>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn-link">
                        {s.label}
                        <span className="sr-only"> (se abre en otra pestaña)</span>
                      </a>
                      <span className="mt-0.5 block text-sm text-slate">{s.publisher}. Consultada el {formatDate(s.accessed_at)}.</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <p className="mt-10 max-w-prose rounded border-l-4 border-navy/30 bg-mist px-4 py-3 text-sm leading-6">{data.disclaimer}</p>

          <section className="mt-12 max-w-prose rounded-lg bg-ink p-6 text-white sm:p-8 print:hidden" aria-labelledby="cta-guia">
            <h2 id="cta-guia" className="font-serif text-2xl text-white">¿Viviste algo así en tu trabajo?</h2>
            <p className="mt-2 text-white/80">Lee lo que han contado otras personas sobre este tema o comparte tu experiencia con un alias.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {data.category_slug && (
                <Link to={`/experiencias?categoria=${data.category_slug}`} className="btn bg-white text-ink hover:bg-teal-tint">
                  Ver experiencias sobre {topicName.toLowerCase()}
                </Link>
              )}
              <Link to="/compartir" className="btn border border-white/40 text-white hover:border-white">Compartir mi experiencia</Link>
            </div>
          </section>
        </div>

        <aside className="order-first space-y-8 lg:order-none print:hidden" aria-label="Navegación de la guía">
          <div className="lg:sticky lg:top-6">
            {outline.length > 1 && (
              <nav aria-labelledby="indice-guia" className="rounded-lg border border-line p-5">
                <h2 id="indice-guia" className="font-sans text-sm font-semibold text-ink">En esta guía</h2>
                <ol className="mt-3 space-y-1 text-sm">
                  {outline.map((h) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`} className="block border-l-2 border-line py-1 pl-3 text-slate hover:border-teal hover:text-ink">{h.text}</a>
                    </li>
                  ))}
                  {sources.length > 0 && (
                    <li>
                      <a href="#fuentes" className="block border-l-2 border-line py-1 pl-3 text-slate hover:border-teal hover:text-ink">Fuentes oficiales</a>
                    </li>
                  )}
                </ol>
              </nav>
            )}
            <button type="button" onClick={() => window.print()} className="btn-secondary mt-4 hidden w-full lg:inline-flex">
              Imprimir o guardar en PDF
            </button>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="border-t border-line bg-mist print:hidden" aria-labelledby="relacionadas">
          <div className="page py-12">
            <h2 id="relacionadas" className="text-2xl">Otras guías que te pueden servir</h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map((g) => (
                <li key={g.id}>
                  <Link to={`/derechos/${g.slug}`} className="group flex h-full flex-col rounded-lg border border-line bg-paper p-5 hover:border-slate">
                    <span className="text-sm font-semibold text-teal-strong">{categoryName(categories.data, g.category_slug)}</span>
                    <span className="mt-1 font-serif text-xl leading-snug group-hover:underline group-hover:decoration-teal/60 group-hover:underline-offset-4">{g.title}</span>
                    <span className="mt-2 line-clamp-3 text-sm leading-6 text-slate">{g.summary}</span>
                    <span className="mt-auto pt-4 text-sm text-slate">Lectura de {readingMinutes(g.content)} min</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}

// shortcut: un navegador cuenta una visita por guía y día; no evita que alguien infle el contador a propósito.
function countViewOncePerDay(slug: string) {
  const key = `vozlaboral:visita:${slug}:${todayLocal()}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
  } catch {
    /* sin almacenamiento: se cuenta igualmente */
  }
  registerGuideView(slug).catch(() => undefined);
}
