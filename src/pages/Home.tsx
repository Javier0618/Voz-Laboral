import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listCategories, listExperiences } from '../lib/api';
import { ExperienceItem } from '../components/ExperienceItem';
import { ConfigNotice, EmptyState, ErrorState, Loading, notConfigured, useAsync } from '../components/ui';

export default function Home() {
  return (
    <>
      <Hero />
      {notConfigured && (
        <div className="page mt-10"><ConfigNotice /></div>
      )}
      <RecentExperiences />
      <Categories />
      <HowItWorks />
      <Identity />
      <Rights />
    </>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  return (
    <section className="border-b border-line bg-mist/60">
      <div className="page grid items-center gap-12 py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:py-20">
        <div className="min-w-0">
          <h1 className="text-[2.4375rem] leading-[2.875rem] sm:text-[3.0625rem] sm:leading-[3.5rem]">
            Cuenta lo que pasó en tu trabajo. Tu nombre se queda contigo.
          </h1>
          <p className="mt-5 max-w-[34rem] text-lg text-slate">
            Trabajadores en Colombia comparten experiencias sobre salarios, contratos, jornadas y trato en empresas reales. Publicas con
            un alias, y cada relato pasa por moderación antes de aparecer.
          </p>
          <form
            role="search"
            className="mt-8 max-w-[34rem]"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/empresas${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
            }}
          >
            <label htmlFor="buscar-empresa" className="label">Busca una empresa</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="buscar-empresa"
                type="search"
                className="input min-h-[52px] text-lg"
                placeholder="Nombre de la empresa o sigla"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="btn-primary min-h-[52px] px-6">Buscar</button>
            </div>
          </form>
          <p className="mt-5 text-sm text-slate">
            ¿Viviste algo que otros deberían saber? <Link to="/compartir" className="btn-link">Comparte tu experiencia</Link>
          </p>
        </div>
        <RedactionSpecimen />
      </div>
    </section>
  );
}

/** Ejemplo ilustrativo con barras de censura: muestra qué se publica y qué no. */
function RedactionSpecimen() {
  const bar = (w: string, delay: number) => (
    <span className="redacted vl-redact" style={{ width: w, animationDelay: `${delay}ms` }} aria-hidden="true" />
  );
  return (
    <figure className="relative min-w-0">
      <div className="rounded-lg border border-line bg-paper p-5 sm:p-8">
        <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm sm:grid-cols-[8.5rem_minmax(0,1fr)]">
          <dt className="text-slate">Alias público</dt>
          <dd className="font-semibold text-ink">turno_de_noche</dd>
          <dt className="text-slate">Correo</dt>
          <dd>{bar('11rem', 200)}<span className="sr-only">oculto</span></dd>
          <dt className="text-slate">Nombre real</dt>
          <dd>{bar('8rem', 320)}<span className="sr-only">no se pide</span></dd>
          <dt className="text-slate">Cuenta interna</dt>
          <dd>{bar('12.5rem', 440)}<span className="sr-only">oculta</span></dd>
          <dt className="text-slate">Empresa</dt>
          <dd className="text-ink">Empresa de ejemplo</dd>
          <dt className="text-slate">Periodo</dt>
          <dd className="text-ink">marzo de 2025</dd>
        </dl>
        <p className="testimony mt-6 border-t border-line pt-5 text-base">
          Durante tres meses el pago de la quincena llegó con más de una semana de retraso. Mi supervisor, {bar('5.5rem', 560)}
          <span className="sr-only">nombre omitido</span>, nos decía que esperáramos sin dar fechas.
        </p>
      </div>
      <figcaption className="mt-3 text-sm text-slate">
        Ejemplo ilustrativo, no es una experiencia real. Otras personas ven el alias, la empresa, el periodo aproximado y el relato. Tu
        correo y tu cuenta nunca se publican, y te pedimos no nombrar a personas concretas.
      </figcaption>
    </figure>
  );
}

function RecentExperiences() {
  const { data, loading, error, reload } = useAsync(() => (notConfigured ? Promise.resolve([]) : listExperiences({ pageSize: 3 })), []);
  return (
    <section className="page mt-16" aria-labelledby="recientes">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="recientes" className="text-2xl sm:text-3xl">Experiencias recientes</h2>
        <Link to="/experiencias" className="btn-link">Ver todas las experiencias</Link>
      </div>
      <p className="mt-2 max-w-prose text-slate">
        Relatos de usuarios que cumplieron las reglas de publicación. La moderación no certifica que los hechos sean ciertos.
      </p>
      <div className="mt-6">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : data && data.length > 0 ? (
          <div className="max-w-3xl">{data.map((exp) => <ExperienceItem key={exp.id} exp={exp} />)}</div>
        ) : (
          <EmptyState title="Todavía no hay experiencias publicadas" action={<Link to="/compartir" className="btn-primary">Compartir la primera</Link>}>
            Cuando una experiencia supere la revisión aparecerá aquí.
          </EmptyState>
        )}
      </div>
    </section>
  );
}

function Categories() {
  const { data, loading, error, reload } = useAsync(() => (notConfigured ? Promise.resolve([]) : listCategories()), []);
  if (notConfigured) return null;
  return (
    <section className="page mt-20" aria-labelledby="categorias">
      <h2 id="categorias" className="text-2xl sm:text-3xl">Qué puedes contar</h2>
      <div className="mt-6">
        {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : (
          <ul className="grid gap-x-10 sm:grid-cols-2">
            {data?.map((c) => (
              <li key={c.slug} className="border-t border-line">
                <Link to={`/experiencias?categoria=${c.slug}`} className="group block py-4">
                  <span className="font-semibold text-ink group-hover:text-teal-strong group-hover:underline">{c.name}</span>
                  <span className="mt-1 block text-sm text-slate">{c.description}</span>
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
    { title: 'Escribes tu experiencia', text: 'Eliges la empresa, la categoría y un periodo aproximado. Puedes revisar el texto antes de enviarlo.' },
    { title: 'Moderación la revisa', text: 'Comprobamos que cumpla las reglas: sin datos personales de terceros, sin amenazas, sin documentos confidenciales. No juzgamos si los hechos son ciertos.' },
    { title: 'Se publica o te pedimos ajustes', text: 'Ves el estado y el motivo de cada decisión en tu cuenta. Si no estás de acuerdo, puedes apelar.' },
  ];
  return (
    <section className="mt-20 border-y border-line bg-mist/60" aria-labelledby="como-funciona">
      <div className="page py-14">
        <h2 id="como-funciona" className="text-2xl sm:text-3xl">Cómo funciona la publicación</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="border-l-2 border-teal pl-5">
              <span className="font-serif text-lg text-teal-strong">Paso {i + 1}</span>
              <h3 className="mt-1 font-sans text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-slate">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Identity() {
  return (
    <section className="page mt-20 grid gap-10 lg:grid-cols-[1fr_1.2fr]" aria-labelledby="identidad">
      <h2 id="identidad" className="text-2xl sm:text-3xl">Cómo protegemos tu identidad, y hasta dónde llega</h2>
      <div className="space-y-4 text-slate">
        <p>
          Tu cuenta usa un correo que nunca se muestra. Publicas con un alias que eliges y que no puede parecerse a tu correo. Las empresas
          no tienen acceso a los datos de las cuentas, y una reclamación empresarial no revela quién escribió el relato.
        </p>
        <p>
          No podemos prometer anonimato absoluto. Si tu relato incluye detalles que solo tú conoces, alguien de tu entorno podría
          reconocerte. Por eso te avisamos cuando el texto parece incluir datos personales y ocultamos el desglose por categorías cuando
          una empresa tiene muy pocas experiencias.
        </p>
        <Link to="/politicas/privacidad" className="btn-link">Lee qué datos tratamos y por cuánto tiempo</Link>
      </div>
    </section>
  );
}

function Rights() {
  return (
    <section className="page mt-20" aria-labelledby="derechos-inicio">
      <div className="rounded-lg bg-ink px-6 py-10 text-white sm:px-10">
        <h2 id="derechos-inicio" className="text-2xl text-white sm:text-3xl">Conoce tus derechos laborales</h2>
        <p className="mt-3 max-w-prose text-white/80">
          Guías de información general con su fuente oficial y la fecha de su última revisión. No sustituyen la orientación del Ministerio
          del Trabajo, de un inspector laboral ni de un abogado.
        </p>
        <Link to="/derechos" className="btn mt-6 bg-white text-ink hover:bg-teal-tint">Ver las guías</Link>
      </div>
    </section>
  );
}
