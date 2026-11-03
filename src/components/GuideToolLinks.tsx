import { Link } from 'react-router-dom';
import { cartaPorSlug } from '../lib/cartas';
import { CanalWhatsApp } from './CanalWhatsApp';

/** Carta más útil para cada guía. Si no está aquí, se ofrece el derecho de petición. */
const CARTA_POR_GUIA: Record<string, string[]> = {
  'renuncia-y-preaviso': ['carta-de-renuncia', 'renuncia-por-justa-causa'],
  vacaciones: ['solicitud-de-vacaciones'],
  'pension-de-vejez-requisitos': ['correccion-historia-laboral'],
  'reforma-pensional-que-cambia': ['correccion-historia-laboral'],
  'seguridad-social-eps-pension-arl-y-caja': ['correccion-historia-laboral', 'derecho-de-peticion'],
};

/** Al final de una guía: la carta para reclamar, el diagnóstico y el calendario. */
export function GuideToolLinks({ slug }: { slug: string }) {
  const cartas = (CARTA_POR_GUIA[slug] ?? ['derecho-de-peticion']).map(cartaPorSlug).filter(Boolean);
  return (
    <section aria-labelledby="pasalo-a-la-accion" className="mt-12 max-w-prose print:hidden">
      <h2 id="pasalo-a-la-accion" className="text-2xl">Pásalo a la acción</h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {cartas.map((c) => (
          <li key={c!.slug}>
            <Link to={`/herramientas/cartas/${c!.slug}`} className="group flex h-full flex-col rounded-lg border border-line bg-paper p-5 hover:border-slate">
              <span className="font-semibold group-hover:underline group-hover:underline-offset-4">{c!.title}</span>
              <span className="mt-1 text-sm text-slate">Llena el formulario y obtén tu carta lista para imprimir, con la norma citada.</span>
            </Link>
          </li>
        ))}
        <li>
          <Link to="/herramientas/diagnostico" className="group flex h-full flex-col rounded-lg border border-line bg-paper p-5 hover:border-slate">
            <span className="font-semibold group-hover:underline group-hover:underline-offset-4">¿Me están pagando bien?</span>
            <span className="mt-1 text-sm text-slate">Diez preguntas de sí o no para revisar tu caso en 2 minutos.</span>
          </Link>
        </li>
        <li>
          <Link to="/herramientas/calendario" className="group flex h-full flex-col rounded-lg border border-line bg-paper p-5 hover:border-slate">
            <span className="font-semibold group-hover:underline group-hover:underline-offset-4">Calendario laboral</span>
            <span className="mt-1 text-sm text-slate">Las fechas de pago del año, para que tu celular te avise.</span>
          </Link>
        </li>
      </ul>
      <CanalWhatsApp className="mt-6" />
    </section>
  );
}
