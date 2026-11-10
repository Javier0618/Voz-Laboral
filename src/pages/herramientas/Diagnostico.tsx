import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { brand } from '../../config/brand';
import { setPageMeta } from '../../lib/meta';
import { DIAGNOSTICO, resultadoDiagnostico, type PreguntaDiagnostico, type Respuesta } from '../../lib/diagnostico';
import { PageHeader } from '../../components/ui';
import { CanalWhatsApp } from '../../components/CanalWhatsApp';
import { publicPath } from '../../lib/publicPath.mjs';

const OPCIONES: { v: Respuesta; label: string }[] = [
  { v: 'si', label: 'Sí' },
  { v: 'no', label: 'No' },
  { v: 'nose', label: 'No sé' },
  { v: 'na', label: 'No aplica' },
];

function Punto({ p, tono }: { p: PreguntaDiagnostico; tono: 'revisar' | 'dudas' }) {
  return (
    <li className={`rounded-md border-l-4 p-4 ${tono === 'revisar' ? 'border-danger/60 bg-danger-tint' : 'border-amber/60 bg-amber-tint'}`}>
      <p className="font-semibold">{p.pregunta}</p>
      <p className="mt-1">{p.siNo}</p>
      {tono === 'dudas' && p.ayuda && <p className="mt-1 text-sm text-slate">{p.ayuda}</p>}
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {p.enlaces.map((e) => <li key={e.to + e.label}><Link to={publicPath(e.to)} className="btn-link">{e.label}</Link></li>)}
      </ul>
    </li>
  );
}

export default function DiagnosticoPage() {
  const [respuestas, setRespuestas] = useState<Record<string, Respuesta | undefined>>({});
  const [verResultado, setVerResultado] = useState(false);
  const resultadoRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setPageMeta({
      title: `¿Me están pagando bien? Revisa tus derechos en 2 minutos · ${brand.name}`,
      description: 'Diez preguntas de sí o no para revisar tu salario, prima, cesantías, recargos, vacaciones y seguridad social en Colombia, con lo que puedes hacer en cada caso.',
      path: '/herramientas/diagnostico',
    });
    return () => setPageMeta(null);
  }, []);

  useEffect(() => {
    if (verResultado) resultadoRef.current?.focus();
  }, [verResultado]);

  const respondidas = DIAGNOSTICO.filter((p) => respuestas[p.id]).length;
  const r = resultadoDiagnostico(respuestas);

  return (
    <div className="page py-10">
      <p className="text-sm"><Link to="/herramientas/" className="btn-link">Herramientas</Link></p>
      <PageHeader title="¿Me están pagando bien?">
        Responde diez preguntas de sí o no sobre tu trabajo. Al final verás qué está bien, qué conviene revisar y qué puedes hacer. No guardamos tus
        respuestas.
      </PageHeader>

      <form className="mt-8 max-w-2xl space-y-6" onSubmit={(e) => { e.preventDefault(); setVerResultado(true); }} aria-label="Preguntas del diagnóstico">
        {DIAGNOSTICO.map((p, n) => (
          <fieldset key={p.id} className="border-b border-line pb-6">
            <legend className="font-semibold"><span className="text-slate">{n + 1}. </span>{p.pregunta}</legend>
            {p.ayuda && <p className="mt-1 text-sm text-slate">{p.ayuda}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {OPCIONES.filter((o) => o.v !== 'na' || p.puedeNoAplicar).map((o) => (
                <label key={o.v} className={`cursor-pointer rounded-full border-2 px-4 py-1.5 text-sm font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal ${respuestas[p.id] === o.v ? 'border-teal bg-teal-tint' : 'border-line hover:border-teal'}`}>
                  <input type="radio" name={p.id} value={o.v} className="sr-only" checked={respuestas[p.id] === o.v}
                    onChange={() => { setRespuestas((a) => ({ ...a, [p.id]: o.v })); setVerResultado(false); }} />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="btn-primary" disabled={respondidas === 0}>Ver mi resultado</button>
          <span className="text-sm text-slate">{respondidas} de {DIAGNOSTICO.length} respondidas</span>
        </div>
      </form>

      {verResultado && (
        <section aria-labelledby="resultado-diagnostico" className="mt-12 max-w-2xl">
          <h2 id="resultado-diagnostico" ref={resultadoRef} tabIndex={-1} className="font-serif text-3xl focus:outline-none">Tu resultado</h2>
          <p className="mt-3 text-lg">
            {r.revisar.length === 0 && r.dudas.length === 0
              ? 'Todo lo que respondiste está en orden. Guarda tus desprendibles y revisa de nuevo cada semestre.'
              : `${r.ok.length} ${r.ok.length === 1 ? 'punto está' : 'puntos están'} bien, ${r.revisar.length} para revisar y ${r.dudas.length} con dudas.`}
          </p>
          {r.revisar.length > 0 && (
            <>
              <h3 className="mt-8 font-sans text-lg font-semibold">Para revisar</h3>
              <ul className="mt-3 space-y-3">{r.revisar.map((p) => <Punto key={p.id} p={p} tono="revisar" />)}</ul>
            </>
          )}
          {r.dudas.length > 0 && (
            <>
              <h3 className="mt-8 font-sans text-lg font-semibold">Para averiguar</h3>
              <ul className="mt-3 space-y-3">{r.dudas.map((p) => <Punto key={p.id} p={p} tono="dudas" />)}</ul>
            </>
          )}
          {r.ok.length > 0 && (
            <>
              <h3 className="mt-8 font-sans text-lg font-semibold">En orden</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 marker:text-teal">{r.ok.map((p) => <li key={p.id}>{p.pregunta}</li>)}</ul>
            </>
          )}
          {r.revisar.length > 0 && (
            <div className="mt-8 rounded-md bg-mist p-5">
              <p className="font-semibold">El primer paso: pedirlo por escrito</p>
              <p className="mt-1">Un reclamo por escrito deja constancia y te protege. Arma tu carta en minutos.</p>
              <Link to="/herramientas/cartas/derecho-de-peticion/" className="btn-primary mt-4 inline-flex">Hacer un derecho de petición</Link>
            </div>
          )}
          <p className="mt-6 text-sm text-slate">Este diagnóstico es orientativo. No reemplaza la revisión de tu caso por el Ministerio del Trabajo o un abogado.</p>
        </section>
      )}
      <CanalWhatsApp className="mt-12 max-w-2xl" />
    </div>
  );
}
