import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { brand } from '../../config/brand';
import { setPageMeta } from '../../lib/meta';
import { HERRAMIENTAS } from '../../lib/herramientas';
import { PageHeader } from '../../components/ui';
import { CanalWhatsApp } from '../../components/CanalWhatsApp';

export default function HerramientasIndex() {
  useEffect(() => {
    setPageMeta({
      title: `Herramientas para trabajadores: cartas, calendario y más · ${brand.name}`,
      description: 'Arma tu derecho de petición o tu carta de renuncia, revisa si te pagan bien, juega «¿Mito o realidad?» y agrega las fechas de pago a tu celular.',
      path: '/herramientas',
    });
    return () => setPageMeta(null);
  }, []);

  return (
    <div className="page py-10">
      <PageHeader title="Herramientas">
        Para pasar de leer a hacer: arma tu carta, revisa tu caso, aprende jugando y no dejes pasar una fecha. Todo es gratis y no necesitas cuenta.
      </PageHeader>
      <ul className="mt-2">
        {HERRAMIENTAS.map((h) => (
          <li key={h.path} className="border-b border-line">
            <Link to={h.path} className="group grid gap-1 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
              <span>
                <span className="block font-serif text-2xl text-ink group-hover:text-teal-strong group-hover:underline group-hover:underline-offset-4">{h.title}</span>
                <span className="mt-1 block text-slate">{h.description}</span>
              </span>
              <span className="btn-secondary justify-self-start">Abrir</span>
            </Link>
          </li>
        ))}
        <li className="border-b border-line">
          <Link to="/calculadoras" className="group grid gap-1 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
            <span>
              <span className="block font-serif text-2xl text-ink group-hover:text-teal-strong group-hover:underline group-hover:underline-offset-4">Calculadoras</span>
              <span className="mt-1 block text-slate">Nómina, prima, cesantías, salario neto y liquidación, con las cifras de {new Date().getFullYear()}.</span>
            </span>
            <span className="btn-secondary justify-self-start">Abrir</span>
          </Link>
        </li>
      </ul>
      <CanalWhatsApp className="mt-10" />
    </div>
  );
}
