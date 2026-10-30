import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { VALORES_2026 } from '../../lib/liquidacion';
import { setPageMeta } from '../../lib/meta';
import { brand } from '../../config/brand';
import { CALCULADORAS } from '../../lib/calculadoras';
import { PageHeader } from '../../components/ui';
import { pesos } from '../../components/nomina';

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
        {CALCULADORAS.map((c) => (
          <li key={c.path} className="border-b border-line">
            <Link to={c.path} className="group grid gap-1 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
              <span>
                <span className="block font-serif text-2xl text-ink group-hover:text-teal-strong group-hover:underline group-hover:underline-offset-4">{c.title}</span>
                <span className="mt-1 block text-slate">{c.description}</span>
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
