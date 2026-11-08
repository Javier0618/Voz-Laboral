import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { getLegalResource, listCategories, listLegalResources, registerGuideView, type Category, type LegalResource } from '../lib/api';
import { formatDate, todayLocal } from '../lib/format';
import { guideOutline, plainText, readingMinutes } from '../lib/guide';
import { setPageMeta } from '../lib/meta';
import { brand } from '../config/brand';
import { GuideBody } from '../components/GuideBody';
import { GuideCover } from '../components/GuideCover';
import { GuideCalculatorLinks } from '../components/GuideCalculatorLinks';
import { RelatedExperiences } from '../components/RelatedExperiences';
import { GuideToolLinks } from '../components/GuideToolLinks';
import { GUIAS_PRIORITARIAS } from '../lib/guiasPrioritarias';
import { ordenTema, resolverTema, temaDeGuia } from '../lib/temasGuias';
import { ConfigNotice, EmptyState, ErrorState, Loading, notConfigured, PageHeader, useAsync } from '../components/ui';

const disclaimer =
  'Información general. No es asesoría jurídica ni una decisión sobre un caso particular. Para tu situación concreta, consulta al Ministerio del Trabajo, a un inspector de trabajo o a un profesional del derecho.';

const HELP_SLUG_PREFIX = 'a-donde-acudir';

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

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
      <div className="rounded-lg bg-brand p-6 text-white">
        <h2 className="font-serif text-xl text-white">¿Necesitas ayuda ahora?</h2>
        <p className="mt-2 text-sm leading-6 text-white/80">
          Estas guías explican derechos y deberes laborales en general. Para actuar en un caso concreto, acude a las autoridades del trabajo.
        </p>
        {help && (
          <Link to={`/derechos/${help.slug}/`} className="btn mt-4 w-full bg-white text-onwhite-ink hover:bg-onwhite-tint">
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
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const topic = resolverTema(params.get('tema') ?? '')?.slug ?? '';

  useEffect(() => {
    setPageMeta({
      title: `Guías laborales · ${brand.name}`,
      description:
        'Guías sobre el trabajo en Colombia: reformas laborales, contratos y nuevas formas de trabajar, jornada, salud, acoso, sindicatos, salario y a dónde acudir. Cada una cita su fuente oficial.',
      path: '/derechos',
      type: 'website',
    });
    return () => setPageMeta(null);
  }, []);

  const setFilter = (next: { q?: string; tema?: string }) => {
    const merged = { q: query, tema: topic, ...next };
    const out = new URLSearchParams();
    if (merged.q) out.set('q', merged.q);
    if (merged.tema) out.set('tema', merged.tema);
    setParams(out, { replace: true });
  };

  const guides = resources.data ?? [];
  const topics = useMemo(() => {
    const used = new Map(guides.map((g) => { const t = temaDeGuia(g); return [t.slug, t] as const; }));
    return [...used.values()].sort((a, b) => ordenTema(a.slug) - ordenTema(b.slug));
  }, [guides]);

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return guides.filter((g) => {
      if (topic && temaDeGuia(g).slug !== topic) return false;
      if (!q) return true;
      return normalize(`${g.title} ${g.summary} ${plainText(g.content)}`).includes(q);
    });
  }, [guides, query, topic]);

  return (
    <div className="page py-10">
      <PageHeader title="Guías laborales">
        Todo lo que cambia en el trabajo en Colombia, explicado con claridad: reformas laborales, contratos y nuevas formas de trabajar,
        jornada, salud, acoso, sindicatos, salario y a dónde acudir. Cada guía cita su fuente oficial y la fecha en que se verificó. Son
        orientativas: no sustituyen al Ministerio del Trabajo ni a un abogado.
      </PageHeader>

      {notConfigured ? (
        <div className="mt-10"><ConfigNotice /></div>
      ) : resources.loading ? (
        <Loading />
      ) : resources.error ? (
        <div className="mt-10"><ErrorState error={resources.error} onRetry={resources.reload} /></div>
      ) : !guides.length ? (
        <div className="mt-10">
          <EmptyState title="Pronto encontrarás aquí las guías">
            Estamos preparando guías laborales claras sobre derechos y deberes según la ley colombiana, cada una con su fuente oficial.
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
                  placeholder="Por ejemplo: reforma laboral, teletrabajo, sindicato, despido"
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
                          active ? 'border-brand bg-brand text-white' : 'border-line bg-paper text-ink hover:border-slate'
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </form>

            {!query && !topic && <FeaturedGuides guides={guides} />}

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
            ) : topic || query ? (
              <GuideList guides={visible} all={guides} />
            ) : (
              <GuidesByTopic guides={visible} />
            )}
          </div>
          <HelpAside guides={guides} />
        </div>
      )}
    </div>
  );
}

function FeaturedGuides({ guides }: { guides: LegalResource[] }) {
  const bySlug = new Map(guides.map((g) => [g.slug, g]));
  const featured = GUIAS_PRIORITARIAS.map((s) => bySlug.get(s)).filter(Boolean) as LegalResource[];
  if (!featured.length) return null;
  return (
    <section className="mt-10" aria-labelledby="destacadas">
      <h2 id="destacadas" className="font-sans text-base font-semibold text-ink">Empieza por estas</h2>
      <p className="mt-1 text-sm text-slate">Reformas recientes, tus derechos en el día a día y qué hacer si hay un problema.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {featured.slice(0, 6).map((g) => (
          <li key={g.id}>
            <Link to={`/derechos/${g.slug}/`} className="group flex h-full flex-col rounded-lg border border-line bg-paper p-4 transition-colors hover:border-slate">
              <span className="font-serif text-lg leading-snug text-ink group-hover:underline group-hover:decoration-teal/60">{g.title}</span>
              <span className="mt-1 line-clamp-2 text-sm text-slate">{g.summary}</span>
              {g.last_verified_at && (
                <span className="mt-auto pt-3 text-xs font-medium text-slate">Verificada el {formatDate(g.last_verified_at)}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function GuideList({ guides, all }: { guides: LegalResource[]; all: LegalResource[] }) {
  return (
    <ol className="mt-3 border-t border-ink/80">
      {guides.map((g) => (
        <li key={g.id} className="border-b border-line">
          <Link to={`/derechos/${g.slug}/`}
            className={`group grid gap-x-6 py-6 sm:grid-cols-[3.5rem_minmax(0,1fr)] ${g.cover_url ? 'md:grid-cols-[3.5rem_minmax(0,1fr)_11rem]' : ''}`}>
            <span aria-hidden="true" className="hidden font-serif text-3xl leading-none text-teal/70 sm:block">
              {String(all.indexOf(g) + 1).padStart(2, '0')}
            </span>
            <GuideCover guide={g} className="mb-4 rounded sm:col-start-2 md:order-last md:col-start-3 md:mb-0 md:self-start" />
            <span className="sm:col-start-2 md:row-start-1">
              <span className="block text-sm font-semibold text-teal-strong">{temaDeGuia(g).name}</span>
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
  );
}

function GuidesByTopic({ guides }: { guides: LegalResource[] }) {
  const groups = new Map<string, { tema: ReturnType<typeof temaDeGuia>; items: LegalResource[] }>();
  for (const g of guides) {
    const tema = temaDeGuia(g);
    if (!groups.has(tema.slug)) groups.set(tema.slug, { tema, items: [] });
    groups.get(tema.slug)!.items.push(g);
  }
  const keys = [...groups.keys()].sort((x, y) => ordenTema(x) - ordenTema(y));
  return (
    <div className="mt-3 space-y-12">
      {keys.map((slug) => {
        const { tema, items } = groups.get(slug)!;
        return (
          <section key={slug} aria-labelledby={`tema-${slug}`}>
            <div className="border-b border-ink/80 pb-3">
              <h2 id={`tema-${slug}`} className="font-sans text-lg font-semibold text-ink">{tema.name}</h2>
              {tema.description && <p className="mt-1 text-sm text-slate">{tema.description}</p>}
            </div>
            <ul className="divide-y divide-line">
              {items.map((g) => (
                <li key={g.id}>
                  <Link to={`/derechos/${g.slug}/`} className="group grid gap-x-6 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                    <span>
                      <span className="block font-serif text-xl leading-snug text-ink group-hover:underline group-hover:decoration-teal/60">
                        {g.title}
                      </span>
                      <span className="mt-1 block max-w-prose text-sm text-slate">{g.summary}</span>
                      <GuideMeta guide={g} className="mt-2" />
                    </span>
                    {g.cover_url && (
                      <GuideCover guide={g} className="mt-3 w-full max-w-[11rem] rounded sm:mt-0" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
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
    if (!data) return;
    const path = `/derechos/${data.slug}/`;
    const origin = brand.siteUrl;
    const pageUrl = origin ? `${origin}${path}` : path;
    const tema = temaDeGuia(data);
    const topicLabel = tema.name;
    const temaPath = `/derechos?tema=${tema.slug}`;
    setPageMeta({
      title: `${data.title} · ${brand.name}`,
      description: data.summary,
      image: data.cover_url,
      path,
      type: 'article',
      jsonLd: [
        {
          '@type': 'Article',
          headline: data.title,
          description: data.summary,
          dateModified: data.updated_at,
          // last_verified_at es la revisión jurídica, no la publicación.
          inLanguage: 'es-CO',
          mainEntityOfPage: pageUrl,
          image: data.cover_url ? [data.cover_url] : undefined,
          author: { '@type': 'Organization', name: brand.name },
          publisher: { '@type': 'Organization', name: brand.name },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Guías', item: origin ? `${origin}/derechos` : '/derechos' },
            { '@type': 'ListItem', position: 2, name: topicLabel, item: origin ? `${origin}${temaPath}` : temaPath },
            { '@type': 'ListItem', position: 3, name: data.title, item: pageUrl },
          ],
        },
      ],
    });
    return () => setPageMeta(null);
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
  const tema = temaDeGuia(data);
  const others = (all.data ?? []).filter((g) => g.id !== data.id);
  const sameTema = others.filter((g) => temaDeGuia(g).slug === tema.slug);
  const related = [
    ...sameTema,
    ...others.filter((g) => g.category_slug === data.category_slug && !sameTema.includes(g)),
    ...others.filter((g) => g.category_slug !== data.category_slug && !sameTema.includes(g)),
  ].slice(0, 3);
  const sources = data.legal_resource_sources ?? [];

  return (
    <article>
      <header className="border-b border-line bg-mist">
        <div className="page py-10 sm:py-14">
          <nav aria-label="Ruta de navegación" className="text-sm text-slate print:hidden">
            <Link to="/derechos" className="hover:text-ink hover:underline">Guías</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <Link to={`/derechos?tema=${tema.slug}`} className="hover:text-ink hover:underline">{tema.name}</Link>
          </nav>
          <div className={data.cover_url ? 'mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]' : 'mt-4'}>
            <div>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-[-0.01em] sm:text-5xl">{data.title}</h1>
              <p className="mt-5 max-w-prose text-lg leading-8 text-slate">{data.summary}</p>
            </div>
            {data.cover_url && (
              <div className="overflow-hidden rounded-lg border border-line shadow-sm">
                {/* Se muestra completa, en proporción 1200×628, sin recortar el texto de la imagen. */}
                <GuideCover guide={data} />
              </div>
            )}
          </div>
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-ink/15 pt-5 text-sm">
            <div>
              <dt className="text-slate">Tema</dt>
              <dd className="mt-0.5 font-semibold">{tema.name}</dd>
            </div>
            <div>
              <dt className="text-slate">Lectura</dt>
              <dd className="mt-0.5 font-semibold">{readingMinutes(data.content)} min</dd>
            </div>
            {data.last_verified_at && (
              <div>
                <dt className="text-slate">Verificada contra la fuente oficial</dt>
                <dd className="mt-0.5 font-semibold">{formatDate(data.last_verified_at)}</dd>
              </div>
            )}
            <div>
              <dt className="text-slate">Última actualización</dt>
              <dd className="mt-0.5 font-semibold">{formatDate(data.updated_at)}</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="page grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0">
          <GuideBody content={data.content} slug={data.slug} />
          <GuideCalculatorLinks slug={data.slug} title={data.title} summary={data.summary} topicName={topicName} />
          <GuideToolLinks slug={data.slug} />

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

          <RelatedExperiences category={data.category_slug} topicName={topicName} />

          <section className="mt-12 max-w-prose rounded-lg bg-brand p-6 text-white sm:p-8 print:hidden" aria-labelledby="cta-guia">
            <h2 id="cta-guia" className="font-serif text-2xl text-white">¿Viviste algo así en tu trabajo?</h2>
            <p className="mt-2 text-white/80">Lee lo que han contado otras personas sobre este tema o comparte tu experiencia con un alias.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {data.category_slug && (
                <Link to={`/experiencias?categoria=${data.category_slug}`} className="btn bg-white text-onwhite-ink hover:bg-onwhite-tint">
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
                  <Link to={`/derechos/${g.slug}/`} className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-paper transition-colors hover:border-slate">
                    <GuideCover guide={g} />
                    <span className="flex flex-1 flex-col p-5">
                      <span className="font-serif text-lg leading-snug text-ink group-hover:underline">{g.title}</span>
                      <span className="mt-2 line-clamp-2 text-sm text-slate">{g.summary}</span>
                    </span>
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

function countViewOncePerDay(slug: string) {
  try {
    const key = `vl-guide-view:${slug}:${todayLocal()}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    void registerGuideView(slug);
  } catch {
    void registerGuideView(slug);
  }
}
