import { Link } from 'react-router-dom';
import { brand } from '../config/brand';
import { CompanySearchForm } from '../components/CompanySearchForm';
import { usePageTitle } from '../components/PageHeader';
import { PrivacyDiagram } from '../components/PrivacyDiagram';
import { LoadingState } from '../components/States';
import { getGlobalStats } from '../lib/api';
import { formatPeriod, pluralize } from '../lib/format';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAsync } from '../lib/useAsync';
import { ConfigNotice } from '../components/ConfigNotice';

function GlobalStats() {
  const stats = useAsync(getGlobalStats, []);
  if (stats.status === 'loading') return <LoadingState label="Cargando cifras" />;
  if (stats.status === 'error') return <p className="text-muted">No pudimos cargar las cifras en este momento.</p>;
  const s = stats.data;
  if (s.visible_count === 0) {
    return <p className="text-muted">Todavía no hay experiencias publicadas. La primera puede ser la tuya.</p>;
  }
  return (
    <p className="text-lg text-ink">
      {pluralize(s.visible_count, 'experiencia publicada', 'experiencias publicadas')}, sobre situaciones de{' '}
      {formatPeriod(s.period_from, s.period_to)}.
    </p>
  );
}

export default function Home() {
  usePageTitle('');
  return (
    <>
      <section className="border-b border-line">
        <div className="container-page grid gap-10 py-10 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <h1 className="text-4xl leading-tight sm:text-5xl lg:text-6xl">
              Lo que se vive en el trabajo, contado por quienes lo viven
            </h1>
            <p className="mt-4 max-w-prose text-lg text-muted">{brand.description}</p>
            <div className="mt-8 max-w-xl">
              <CompanySearchForm />
            </div>
            <p className="mt-4 text-muted">
              ¿Quieres contar lo que viviste? <Link to="/compartir">Comparte tu experiencia</Link>
            </p>
          </div>
          <PrivacyDiagram />
        </div>
      </section>

      <section className="container-page grid gap-10 py-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl">Cómo funciona</h2>
          <ol className="mt-4 space-y-4">
            <li className="border-l-2 border-action pl-4">
              <p className="font-semibold">Creas una cuenta con un alias</p>
              <p className="text-muted">Tu correo sirve para entrar y nunca se muestra.</p>
            </li>
            <li className="border-l-2 border-action pl-4">
              <p className="font-semibold">Cuentas lo que viviste</p>
              <p className="text-muted">Separas lo que viste directamente de lo que te contaron.</p>
            </li>
            <li className="border-l-2 border-action pl-4">
              <p className="font-semibold">La moderación lo revisa antes de publicarlo</p>
              <p className="text-muted">Se retiran datos personales y ataques. Puedes apelar cada decisión.</p>
            </li>
          </ol>
        </div>
        <div>
          <h2 className="text-3xl">Lo que hay hasta ahora</h2>
          <div className="mt-4">{isSupabaseConfigured ? <GlobalStats /> : <ConfigNotice />}</div>
          <p className="mt-4 max-w-prose text-muted">
            No publicamos puntuaciones ni rankings. Las cifras solo reflejan lo que la plataforma ha recibido y no
            describen a toda la empresa.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-5">
            <li><Link className="inline-flex min-h-11 items-center" to="/experiencias">Leer experiencias</Link></li>
            <li><Link className="inline-flex min-h-11 items-center" to="/derechos">Conocer tus derechos</Link></li>
            <li><Link className="inline-flex min-h-11 items-center" to="/reglas">Ver las reglas</Link></li>
          </ul>
        </div>
      </section>
    </>
  );
}
