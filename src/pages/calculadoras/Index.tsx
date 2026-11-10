import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { VALORES_2026 } from '../../lib/liquidacion';
import { setPageMeta } from '../../lib/meta';
import { brand } from '../../config/brand';
import { CALCULADORAS } from '../../lib/calculadoras';
import { PageHeader } from '../../components/ui';
import { pesos } from '../../components/nomina';
import { useAuth } from '../../auth/AuthProvider';
import { publicPath } from '../../lib/publicPath.mjs';

/** Invitación a guardar la nómina: el plus de tener cuenta. */
function PayrollInvite() {
  const { session } = useAuth();
  return (
    <section aria-labelledby="lleva-tu-nomina" className="mt-8 rounded-lg border border-teal/40 bg-teal/5 p-5 sm:p-6">
      <h2 id="lleva-tu-nomina" className="font-sans text-lg font-semibold">Lleva la cuenta de tu pago, día a día</h2>
      <p className="mt-2 max-w-prose text-slate">
        {session
          ? 'Con tu sesión iniciada, las calculadoras de nómina guardan solas lo que anotes. Cada día que trabajes, marca tu turno y mira cuánto te debería llegar al cierre del mes.'
          : 'Con una cuenta gratis, las calculadoras de nómina guardan solas lo que anotes. Marca cada día que trabajes y, al cierre del mes, sabes cuánto te deben pagar antes de que llegue el desprendible. Solo tú lo ves.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {session ? (
          <Link to="/cuenta#mis-nominas" className="btn-primary">Ver mis nóminas</Link>
        ) : (
          <Link to="/cuenta?modo=registro&siguiente=/calculadoras" className="btn-primary">Crear cuenta gratis</Link>
        )}
        <Link to="/calculadoras/operativos/" className="btn-secondary">Anotar mis turnos</Link>
      </div>
    </section>
  );
}

export default function CalculadorasIndex() {
  useEffect(() => {
    setPageMeta({
      title: `Calculadoras laborales · ${brand.name}`,
      description:
        'Estima tu nómina y tu liquidación en Colombia: horas extra, recargos, cesantías y más. Con tu cuenta, guarda tus turnos día a día.',
      path: '/calculadoras',
      type: 'website',
    });
    return () => setPageMeta(null);
  }, []);

  return (
    <div className="page py-10">
      <PageHeader title="Calculadoras laborales">
        Elige una calculadora según lo que necesitas comprobar: turnos y recargos, prestaciones, liquidación o salario neto. Los resultados son estimaciones y pueden variar según las condiciones del contrato. Sin cuenta, tus datos no
        salen de este navegador.
      </PageHeader>
      <PayrollInvite />
      <ul className="mt-2">
        {CALCULADORAS.map((c) => (
          <li key={c.path} className="border-b border-line">
            <Link to={publicPath(c.path)} className="group grid gap-1 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
              <span>
                <span className="block font-serif text-2xl text-ink group-hover:text-teal-strong group-hover:underline group-hover:underline-offset-4">{c.title}</span>
                <span className="mt-1 block text-slate">{c.description}</span>
              </span>
              <span className="btn-secondary justify-self-start">Abrir</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-10 max-w-prose text-slate">
        Para entender la norma detrás de cada cifra, consulta las{' '}
        <Link to="/derechos/" className="btn-link">guías laborales</Link>.
      </p>
      <section className="mt-12 max-w-prose rounded-md bg-mist p-6" aria-labelledby="valores">
        <h2 id="valores" className="font-sans text-base font-semibold">Valores de 2026 que usan</h2>
        <ul className="mt-3 space-y-1 text-slate">
          <li>Salario mínimo: {pesos(VALORES_2026.salarioMinimo)} (Decreto 1469 de 2025).</li>
          <li>Auxilio de transporte: {pesos(VALORES_2026.auxilioTransporte)} (Decreto 1470 de 2025).</li>
          <li>Jornada máxima: 42 horas semanales (CST, art. 161).</li>
          <li>Recargo dominical y festivo: 90 % desde el 1 de julio de 2026 (CST, art. 179).</li>
        </ul>
        <p className="mt-3 text-sm text-slate">Son estimaciones informativas. No reemplazan el desprendible ni la liquidación oficial de tu empresa.</p>
      </section>
    </div>
  );
}
