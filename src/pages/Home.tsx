import { Link } from 'react-router-dom';
import { CompanySearchForm } from '../components/CompanySearchForm';
import { ConfigNotice } from '../components/ConfigNotice';
import { CheckIcon, ReplyIcon, ScaleIcon, ShieldIcon } from '../components/Icons';
import { usePageTitle } from '../components/PageHeader';
import { PrivacyDiagram } from '../components/PrivacyDiagram';
import { LoadingState } from '../components/States';
import { getGlobalStats } from '../lib/api';
import { formatPeriod } from '../lib/format';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAsync } from '../lib/useAsync';
import { baseCategories } from '../shared/domain';

function GlobalStats() {
  const stats = useAsync(getGlobalStats, []);
  if (stats.status === 'loading') return <LoadingState label="Cargando cifras" />;
  if (stats.status === 'error') return <p className="text-muted">No pudimos cargar las cifras en este momento.</p>;
  const s = stats.data;
  if (s.visible_count === 0) {
    return <p className="text-lg text-muted">Todavía no hay experiencias publicadas. La primera puede ser la tuya.</p>;
  }
  return (
    <dl className="grid gap-6 sm:grid-cols-2">
      <div className="border-l-2 border-action pl-4">
        <dt className="text-muted">Experiencias publicadas</dt>
        <dd className="font-serif text-4xl font-semibold text-ink">{s.visible_count.toLocaleString('es-CO')}</dd>
      </div>
      <div className="border-l-2 border-line pl-4">
        <dt className="text-muted">Periodo cubierto</dt>
        <dd className="font-serif text-2xl text-ink">{formatPeriod(s.period_from, s.period_to)}</dd>
      </div>
    </dl>
  );
}

const steps = [
  { title: 'Creas una cuenta con un alias', text: 'Tu correo sirve para entrar y nunca se muestra.' },
  { title: 'Cuentas lo que viviste', text: 'Separas lo que viste directamente de lo que te contaron.' },
  { title: 'La moderación lo revisa', text: 'Se retiran datos personales y ataques antes de publicar.' },
  { title: 'Se publica con tu alias', text: 'Siempre ves el motivo de cada decisión y puedes apelar.' },
];

const principles = [
  { icon: ShieldIcon, title: 'Moderación previa', text: 'Nada se publica sin revisión. Cada decisión queda registrada con su motivo.' },
  { icon: ScaleIcon, title: 'Sin puntuaciones ni rankings', text: 'Mostramos relatos y su distribución por categoría, no notas que resuman a una empresa.' },
  { icon: ReplyIcon, title: 'Derecho a responder', text: 'Las empresas verificadas pueden responder y pedir correcciones, sin conocer la identidad de nadie.' },
];

export default function Home() {
  usePageTitle('');
  return (
    <>
      <section className="border-b border-line">
        <div className="container-page grid gap-12 py-12 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16">
          <div>
            <p className="font-medium text-action">Transparencia laboral en Colombia</p>
            <h1 className="mt-3 text-[2.6rem] leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.25rem]">
              Lo que se vive en el trabajo, contado por quienes lo viven
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-muted sm:text-xl">
              Personas que trabajan o trabajaron en empresas reales comparten su experiencia con un alias. Tu
              identidad queda protegida.
            </p>
            <div className="mt-8 max-w-xl">
              <CompanySearchForm />
            </div>
            <ul className="mt-8 flex flex-col gap-2 text-ink sm:flex-row sm:flex-wrap sm:gap-x-6">
              {['Revisión antes de publicar', 'Tu correo nunca se muestra', 'Puedes apelar cada decisión'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckIcon className="text-action" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <PrivacyDiagram />
        </div>
      </section>

      <section aria-labelledby="como-funciona" className="container-page py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="como-funciona" className="text-3xl sm:text-4xl">Cómo funciona</h2>
          <Link to="/reglas">Leer las reglas de publicación</Link>
        </div>
        <ol className="mt-8 grid gap-8 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title}>
              <span aria-hidden="true" className="font-serif text-4xl font-semibold text-action">{i + 1}</span>
              <p className="mt-2 font-semibold text-ink">{s.title}</p>
              <p className="mt-1 text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="categorias" className="border-y border-line bg-mist">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 id="categorias" className="text-3xl sm:text-4xl">Explora por tema</h2>
            <p className="mt-3 max-w-sm text-muted">
              Cada experiencia se clasifica en una de estas categorías. Elige una para leer los relatos publicados.
            </p>
          </div>
          <ul className="grid border-t border-line sm:grid-cols-2 sm:gap-x-8">
            {baseCategories.map((c) => (
              <li key={c.id} className="border-b border-line">
                <Link
                  to={`/experiencias?categoria=${c.id}`}
                  className="flex min-h-14 items-center py-3 font-medium text-ink no-underline hover:text-action hover:underline"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="principios" className="container-page py-16">
        <h2 id="principios" className="text-3xl sm:text-4xl">Cómo cuidamos la información</h2>
        <ul className="mt-8 grid gap-10 md:grid-cols-3">
          {principles.map(({ icon: I, title, text }) => (
            <li key={title}>
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-action-tint text-action">
                <I width={22} height={22} />
              </span>
              <p className="mt-4 text-lg font-semibold text-ink">{title}</p>
              <p className="mt-1 text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="cifras" className="container-page">
        <div className="grid gap-8 rounded-xl border border-line p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <h2 id="cifras" className="text-3xl">Lo que hay hasta ahora</h2>
            <p className="mt-3 max-w-prose text-muted">
              Las cifras solo reflejan lo que la plataforma ha recibido y no describen a toda una empresa.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/experiencias" className="btn-secondary">Leer experiencias</Link>
              <Link to="/compartir" className="btn-primary">Compartir experiencia</Link>
            </div>
          </div>
          <div>{isSupabaseConfigured ? <GlobalStats /> : <ConfigNotice />}</div>
        </div>
      </section>
    </>
  );
}
