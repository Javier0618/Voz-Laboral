import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listCategories, listExperiences, listLegalResources } from '../lib/api';
import { readingMinutes } from '../lib/guide';
import { GuideCover } from '../components/GuideCover';
import { ExperienceItem } from '../components/ExperienceItem';
import { PromoVideoButton, PromoVideoTeaser, PromoVideoThumb } from '../components/PromoVideo';
import { ConfigNotice, ErrorState, Loading, notConfigured, useAsync } from '../components/ui';

export default function Home() {
  const recent = useAsync(() => (notConfigured ? Promise.resolve([]) : listExperiences({ pageSize: 3 })), []);
  // Mientras no haya experiencias publicadas, la portada invita a ser de los
  // primeros y sube las guías, que ya tienen contenido.
  const empty = !recent.loading && !recent.error && recent.data?.length === 0;
  return (
    <>
      <Hero />
      {notConfigured && (
        <div className="page mt-10"><ConfigNotice /></div>
      )}
      {empty ? (
        <>
          <FirstExperiences />
          <Rights />
          <HowItWorks />
          <Categories />
          <Identity />
        </>
      ) : (
        <>
          <RecentExperiences {...recent} />
          <Categories />
          <HowItWorks />
          <Identity />
          <Rights />
        </>
      )}
    </>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  return (
    <section className="bg-ink text-white">
      <div className="page grid items-center gap-14 pb-20 pt-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:pb-24 lg:pt-12">
        <div className="min-w-0">
          <h1 className="text-[2.5rem] font-medium leading-[2.875rem] tracking-[-0.01em] text-white sm:text-5xl lg:text-[4.25rem] lg:leading-[4.5rem]">
            Cómo es trabajar ahí, contado por quienes trabajan ahí.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-8 text-white/80">
            Experiencias buenas, malas y mixtas en empresas de Colombia. Se publican con un alias: tu nombre y tu correo no aparecen.
          </p>
          <form
            role="search"
            className="mt-8 max-w-[36rem]"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/empresas${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
            }}
          >
            <label htmlFor="buscar-empresa" className="mb-2 block text-sm font-semibold text-white">Busca una empresa</label>
            <div className="flex flex-col gap-2 rounded-md bg-white p-1.5 sm:flex-row">
              <input
                id="buscar-empresa"
                type="search"
                className="block min-h-[52px] w-full rounded border-0 bg-transparent px-3 text-lg text-ink placeholder:text-slate/70 focus:outline-none focus:ring-2 focus:ring-teal/40"
                placeholder="Nombre, sigla o NIT"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="btn-primary min-h-[52px] px-7 text-base">Buscar</button>
            </div>
          </form>
          <p className="mt-6 text-white/75">
            ¿Trabajas o trabajaste en una empresa?{' '}
            <Link to="/compartir" className="font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">
              Cuenta cómo te fue
            </Link>
            . No necesitas cuenta.
          </p>
          <PromoVideoTeaser className="mt-6 lg:hidden" />
        </div>
        <RedactionSpecimen />
      </div>
    </section>
  );
}

/** Ejemplo ilustrativo: un folio con los datos privados tapados. */
function RedactionSpecimen() {
  const bar = (w: string, delay: number) => (
    <span className="redacted vl-redact" style={{ width: w, animationDelay: `${delay}ms` }} aria-hidden="true" />
  );
  return (
    <figure className="relative isolate min-w-0 lg:ml-6">
      <PromoVideoTeaser className="mb-8 hidden lg:flex" />
      <div className="folio folio-stack p-6 sm:p-8">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-4 text-sm text-slate">
          <span>Experiencia de ejemplo</span>
          <span className="font-serif text-base italic text-ink">Folio 1</span>
        </div>
        <div className="folio-margin mt-5">
          <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 text-[0.9375rem] sm:grid-cols-[8rem_minmax(0,1fr)]">
            <dt className="text-slate">Alias público</dt>
            <dd className="font-semibold">turno_de_noche</dd>
            <dt className="text-slate">Correo</dt>
            <dd>{bar('11rem', 250)}<span className="sr-only">oculto</span></dd>
            <dt className="text-slate">Nombre real</dt>
            <dd>{bar('8rem', 380)}<span className="sr-only">no se pide</span></dd>
            <dt className="text-slate">Cuenta interna</dt>
            <dd>{bar('12rem', 510)}<span className="sr-only">oculta</span></dd>
            <dt className="text-slate">Empresa</dt>
            <dd>Empresa de ejemplo</dd>
            <dt className="text-slate">Periodo</dt>
            <dd>marzo de 2025</dd>
            <dt className="text-slate">Tipo</dt>
            <dd>Experiencia mixta</dd>
          </dl>
          <p className="testimony mt-6 border-t border-dashed border-line pt-5">
            Los pagos llegaban a tiempo y la capacitación fue buena. Lo difícil era que mi supervisor, {bar('5.5rem', 640)}
            <span className="sr-only">nombre omitido</span>, cambiaba los turnos sin avisar.
          </p>
        </div>
      </div>
      <figcaption className="mt-5 max-w-[30rem] text-sm text-white/70">
        Ejemplo ilustrativo. Se ve el alias, la empresa, el periodo y el relato; tu correo y tu cuenta, nunca.
      </figcaption>
    </figure>
  );
}

function SectionHeading({ id, title, children, action }: { id: string; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
      <div>
        <h2 id={id} className="text-3xl sm:text-4xl">{title}</h2>
        {children && <p className="mt-3 max-w-prose text-slate">{children}</p>}
      </div>
      {action}
    </div>
  );
}

function RecentExperiences({ data, loading, error, reload }: ReturnType<typeof useAsync<Awaited<ReturnType<typeof listExperiences>>>>) {
  return (
    <section className="page mt-20" aria-labelledby="recientes">
      <SectionHeading id="recientes" title="Experiencias recientes" action={<Link to="/experiencias" className="btn-link">Ver todas las experiencias</Link>}>
        Buenas, malas y mixtas. La moderación revisa que cumplan las reglas, no que los hechos sean ciertos.
      </SectionHeading>
      <div className="mt-8">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <div className="max-w-3xl">{data?.map((exp) => <ExperienceItem key={exp.id} exp={exp} />)}</div>
        )}
      </div>
    </section>
  );
}

/** Portada sin experiencias publicadas todavía: invita a contar la primera. */
function FirstExperiences() {
  const card = 'group flex h-full flex-col rounded-lg border p-6 text-left transition-colors sm:p-7';
  return (
    <section className="page mt-20" aria-labelledby="primeras">
      <SectionHeading id="primeras" title="Sé de las primeras personas en contar">
        VozLaboral está empezando. Cada experiencia ayuda a quien está pensando en trabajar en esa empresa, y lo bueno también cuenta.
      </SectionHeading>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        <li>
          <Link to="/compartir" className={`${card} border-ink bg-ink text-white hover:bg-navy`}>
            <span className="font-serif text-2xl leading-snug">Cuenta cómo te fue</span>
            <span className="mt-2 text-white/80">En unos minutos, con un alias o sin crear cuenta. La moderación la revisa antes de publicarla.</span>
            <span className="mt-auto pt-6 font-semibold text-[#5FD3C5]">Compartir mi experiencia →</span>
          </Link>
        </li>
        <li>
          <PromoVideoButton className={`${card} w-full border-line bg-paper hover:border-slate`}>
            <span className="flex items-start gap-4">
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-2xl leading-snug text-ink">Mira cómo funciona</span>
                <span className="mt-2 block text-slate">Un video de 1 minuto: qué es, cómo se comparte y qué pueden hacer los demás.</span>
              </span>
              <PromoVideoThumb className="w-14" />
            </span>
            <span className="mt-auto pt-6 font-semibold text-teal-strong">Ver el video →</span>
          </PromoVideoButton>
        </li>
        <li>
          <Link to="/empresas" className={`${card} border-line bg-paper hover:border-slate`}>
            <span className="font-serif text-2xl leading-snug text-ink">Busca tu empresa</span>
            <span className="mt-2 text-slate">Si no aparece, pide que la agreguen y vuelve a contar tu experiencia cuando esté en la lista.</span>
            <span className="mt-auto pt-6 font-semibold text-teal-strong">Ver empresas →</span>
          </Link>
        </li>
      </ul>
      <InviteRow />
    </section>
  );
}

/** Invitar a otras personas: las primeras experiencias llegan por recomendación. */
function InviteRow() {
  const [copied, setCopied] = useState(false);
  const url = typeof window === 'undefined' ? '' : window.location.origin;
  const message = `Te invito a VozLaboral: cuenta cómo es trabajar en tu empresa, sin dar tu nombre. ${url}`;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg bg-mist px-6 py-4">
      <p className="font-semibold">¿Conoces a alguien que trabaje en una empresa? Envíale la invitación.</p>
      <div className="flex flex-wrap gap-3">
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
          Enviar por WhatsApp<span className="sr-only"> (se abre en otra pestaña)</span>
        </a>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => setCopied(false))}
        >
          {copied ? 'Enlace copiado' : 'Copiar enlace'}
        </button>
      </div>
      <span className="sr-only" aria-live="polite">{copied ? 'Enlace copiado' : ''}</span>
    </div>
  );
}

function Categories() {
  const { data, loading, error, reload } = useAsync(() => (notConfigured ? Promise.resolve([]) : listCategories()), []);
  if (notConfigured) return null;
  return (
    <section className="page mt-24" aria-labelledby="categorias">
      <SectionHeading id="categorias" title="Qué puedes contar">
        Lo bueno y lo malo de trabajar en una empresa. Cada tema lleva a sus experiencias publicadas.
      </SectionHeading>
      <div className="mt-8">
        {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : (
          <ul className="grid border-t border-ink/80 sm:grid-cols-2 sm:gap-x-12">
            {data?.map((c) => (
              <li key={c.slug} className="border-b border-line">
                <Link to={`/experiencias?categoria=${c.slug}`} className="group block py-5">
                  <span className="font-serif text-xl text-ink group-hover:text-teal-strong group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                    {c.name}
                  </span>
                  <span className="mt-1 block text-[0.9375rem] text-slate">{c.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { title: 'Cuentas tu experiencia', text: 'Con o sin cuenta. Eliges la empresa, el tema y si fue buena, mala o mixta.' },
    { title: 'La moderación la revisa', text: 'Que no tenga datos personales, amenazas ni documentos confidenciales. No juzga si los hechos son ciertos.' },
    { title: 'Otras personas participan', text: 'Reaccionan y comentan. Con cuenta lo ves todo en Mi cuenta y puedes apelar cada decisión.' },
  ];
  return (
    <section className="mt-24 bg-mist" aria-labelledby="como-funciona">
      <div className="page py-16 sm:py-20">
        <SectionHeading id="como-funciona" title="Cómo funciona" action={<Link to="/como-funciona" className="btn-link">Cómo moderamos</Link>} />
        <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {/* Línea de tiempo: une los tres pasos en escritorio. */}
          <span aria-hidden="true" className="absolute left-5 right-5 top-5 hidden h-px bg-ink/25 md:block" />
          {steps.map((s, i) => (
            <li key={s.title} className="relative flex gap-5 md:block">
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-serif text-lg text-white">
                {i + 1}
              </span>
              <div className="md:mt-6">
                <h3 className="font-sans text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-slate">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Identity() {
  const visible = ['Tu alias (o «Persona sin cuenta»)', 'La empresa, el tema y el periodo (mes y año)', 'Tu relato, tal como se aprobó', 'Tus comentarios, con tu alias'];
  const hidden = ['Tu correo y tu contraseña', 'Quién reaccionó a cada experiencia', 'Los datos técnicos de acceso', 'Quién eres, incluso ante una reclamación de la empresa'];
  return (
    <section className="page mt-24" aria-labelledby="identidad">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <h2 id="identidad" className="text-3xl sm:text-4xl">Te decimos qué se ve y qué no.</h2>
          <p className="mt-5 max-w-prose text-slate">
            No prometemos anonimato absoluto: si cuentas detalles que solo tú conoces, alguien cercano podría reconocerte. Por eso te
            avisamos cuando el texto parece incluir datos personales.
          </p>
          <Link to="/politicas/privacidad" className="btn-link mt-5 inline-block">Qué datos tratamos y por cuánto tiempo</Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="border-b border-ink/80 pb-3 font-sans text-base font-semibold">Lo que ven otras personas</h3>
            <ul className="mt-2">
              {visible.map((v) => <li key={v} className="border-b border-line py-3">{v}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="border-b border-ink/80 pb-3 font-sans text-base font-semibold">Lo que nunca se publica</h3>
            <ul className="mt-2">
              {hidden.map((v) => (
                <li key={v} className="flex items-center gap-3 border-b border-line py-3">
                  <span aria-hidden="true" className="h-2.5 w-6 shrink-0 rounded-[2px] bg-ink" />
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Rights() {
  const guides = useAsync(() => (notConfigured ? Promise.resolve([]) : listLegalResources()), []);
  const featured = (guides.data ?? []).slice(0, 3);
  return (
    <section className="page mt-20" aria-labelledby="derechos-inicio">
      <div className="grid gap-6 border-t border-ink/80 pt-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
        <div>
          <h2 id="derechos-inicio" className="text-3xl">Conoce tus derechos laborales</h2>
          <p className="mt-3 max-w-prose text-slate">
            Guías de información general con su fuente oficial y la fecha de su última revisión. No sustituyen la orientación del Ministerio
            del Trabajo, de un inspector de trabajo ni de un abogado.
          </p>
        </div>
        <Link to="/derechos" className="btn-primary justify-self-start px-6">Ver todas las guías</Link>
      </div>
      {featured.length > 0 && (
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {featured.map((g) => (
            <li key={g.id}>
              <Link to={`/derechos/${g.slug}`} className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-paper transition-colors hover:border-slate">
                <GuideCover guide={g} />
                <span className="flex flex-1 flex-col p-6">
                  <span className="font-serif text-xl leading-snug text-ink group-hover:underline group-hover:decoration-teal/60 group-hover:underline-offset-4">{g.title}</span>
                  <span className="mt-2 line-clamp-3 text-sm leading-6 text-slate">{g.summary}</span>
                  <span className="mt-auto pt-5 text-sm font-semibold text-teal-strong">Leer guía · {readingMinutes(g.content)} min</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
