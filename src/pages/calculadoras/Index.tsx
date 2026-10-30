import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { VALORES_2026 } from '../../lib/liquidacion';
import { setPageMeta } from '../../lib/meta';
import { brand } from '../../config/brand';
import { PageHeader } from '../../components/ui';
import { pesos } from '../../components/nomina';

const calculadoras = [
  { to: '/calculadoras/administrativos', titulo: 'Nómina para cargos administrativos', texto: 'Salario fijo mensual o quincenal. Escribes tus horas extra, recargos y novedades.' },
  { to: '/calculadoras/operativos', titulo: 'Nómina para cargos operativos', texto: 'Turnos 5×2, 6×1, mixtos o de noche. Armas tu calendario y la calculadora clasifica cada hora.' },
  { to: '/calculadoras/vigilantes', titulo: 'Nómina para vigilantes', texto: 'Rotaciones de 12 horas 2×2, 3×3 y 4×2, con recargos nocturnos, dominicales y festivos.' },
  { to: '/calculadoras/por-dias', titulo: 'Nómina por días', texto: 'Para quien trabaja algunos días del mes o cobra por jornada, con cotización ordinaria o por semanas.' },
  { to: '/liquidacion', titulo: 'Liquidación al terminar el contrato', texto: 'Cesantías, intereses, prima, vacaciones e indemnización por despido sin justa causa.' },
];

export default function CalculadorasIndex() {
  useEffect(() => {
    setPageMeta({
      title: `Calculadoras laborales · ${brand.name}`,
      description:
        'Estima tu nómina y tu liquidación en Colombia. Horas extra, recargos, cesantías y más. Tus datos no salen del navegador.',
      path: '/calculadoras',
      type: 'website',
    });
    return () => setPageMeta(null);
  }, []);

  return (
    <div className="page py-10">
      <PageHeader title="Calculadoras laborales">
        Estima tu pago y compáralo con tu desprendible. Cada resultado muestra la cuenta y la norma que la respalda. Tus datos no salen de
        este navegador.
      </PageHeader>
      <ul className="mt-2">
        {calculadoras.map((c) => (
          <li key={c.to} className="border-b border-line">
            <Link to={c.to} className="group grid gap-1 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
              <span>
                <span className="block font-serif text-2xl text-ink group-hover:text-teal-strong group-hover:underline group-hover:underline-offset-4">{c.titulo}</span>
                <span className="mt-1 block text-slate">{c.texto}</span>
              </span>
              <span className="btn-secondary justify-self-start">Abrir</span>
            </Link>
          </li>
        ))}
      </ul>
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
