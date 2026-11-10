import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { brand } from '../../config/brand';
import { setPageMeta } from '../../lib/meta';
import { calendarioLaboral, enlaceGoogleCalendar, generarIcs, type FechaLaboral, type TipoFecha } from '../../lib/calendarioLaboral';
import { PageHeader } from '../../components/ui';
import { CanalWhatsApp } from '../../components/CanalWhatsApp';
import { publicPath } from '../../lib/publicPath.mjs';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const ETIQUETA: Record<TipoFecha, { texto: string; clase: string }> = {
  pago: { texto: 'Pago', clase: 'bg-teal-tint text-teal-strong' },
  festivo: { texto: 'Festivo', clase: 'bg-mist text-slate' },
  cambio: { texto: 'Cambio en la ley', clase: 'bg-amber-tint text-ink' },
};

const hoyIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function descargarIcs(fechas: FechaLaboral[], nombre: string) {
  const blob = new Blob([generarIcs(fechas, brand.siteUrl)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function CalendarioPage() {
  const actual = new Date().getFullYear();
  const [anio, setAnio] = useState(actual);
  const [soloPagos, setSoloPagos] = useState(false);
  const hoy = hoyIso();

  useEffect(() => {
    setPageMeta({
      title: `Calendario laboral ${anio}: fechas de pago de prima, cesantías y festivos · ${brand.name}`,
      description: `Las fechas laborales de ${anio} en Colombia: prima, intereses de cesantías, cesantías, dotación, festivos y cambios de la ley. Agrégalas a tu calendario.`,
      path: '/herramientas/calendario',
    });
    return () => setPageMeta(null);
  }, [anio]);

  const fechas = useMemo(() => calendarioLaboral(anio).filter((f) => !soloPagos || f.tipo !== 'festivo'), [anio, soloPagos]);
  const proxima = fechas.find((f) => f.fecha >= hoy && f.tipo !== 'festivo');
  const porMes = MESES.map((_, m) => fechas.filter((f) => Number(f.fecha.slice(5, 7)) === m + 1));

  return (
    <div className="page py-10">
      <p className="text-sm"><Link to="/herramientas/" className="btn-link">Herramientas</Link></p>
      <PageHeader title={`Calendario laboral ${anio}`}>
        Las fechas en que te deben pagar, los festivos y los cambios de la ley. Agrégalas a tu celular y te avisará el día anterior a las 9 a. m.
      </PageHeader>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Año" className="inline-flex overflow-hidden rounded border border-line">
          {[actual, actual + 1].map((a) => (
            <button key={a} type="button" aria-pressed={anio === a} onClick={() => setAnio(a)}
              className={`px-4 py-2 text-sm font-semibold ${anio === a ? 'bg-teal text-white' : 'hover:bg-mist'}`}>{a}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-teal" checked={soloPagos} onChange={(e) => setSoloPagos(e.target.checked)} />
          Ocultar festivos
        </label>
        <button type="button" className="btn-primary" onClick={() => descargarIcs(fechas, `calendario-laboral-${anio}.ics`)}>
          Agregar todas a mi calendario
        </button>
      </div>
      <p className="mt-2 text-sm text-slate">
        Descarga un archivo que abre tu aplicación de calendario (Google, iPhone u Outlook). No necesitas cuenta en {brand.name}.
      </p>

      {proxima && anio === actual && (
        <div className="mt-8 rounded-lg border border-teal/40 bg-teal/5 p-5">
          <p className="text-sm font-semibold text-teal-strong">Lo próximo</p>
          <p className="mt-1 font-serif text-2xl">{proxima.titulo}</p>
          <p className="mt-1 text-slate">{fechaLegible(proxima.fecha)}. {proxima.detalle}</p>
        </div>
      )}

      <div className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2">
        {porMes.map((lista, m) => lista.length > 0 && (
          <section key={m} aria-labelledby={`mes-${m}`}>
            <h2 id={`mes-${m}`} className="border-b border-ink/80 pb-2 font-sans text-lg font-semibold">{MESES[m]}</h2>
            <ul>
              {lista.map((f) => (
                <li key={f.fecha + f.titulo} className={`grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 border-b border-line py-4 ${f.fecha < hoy ? 'opacity-60' : ''}`}>
                  <div className="text-center">
                    <span className="block font-serif text-3xl leading-none">{Number(f.fecha.slice(8))}</span>
                    <span className="mt-1 block text-xs text-slate">{DIAS[new Date(`${f.fecha}T12:00:00`).getDay()]}</span>
                  </div>
                  <div>
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${ETIQUETA[f.tipo].clase}`}>{ETIQUETA[f.tipo].texto}</span>
                    <p className="mt-1 font-semibold">{f.titulo}</p>
                    {f.tipo !== 'festivo' && <p className="mt-1 text-sm text-slate">{f.detalle}{f.norma ? ` (${f.norma}).` : ''}</p>}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {f.enlace && <Link to={publicPath(f.enlace.to)} className="btn-link">{f.enlace.label}</Link>}
                      {f.tipo !== 'festivo' && f.fecha >= hoy && (
                        <>
                          <a href={enlaceGoogleCalendar(f, brand.siteUrl)} target="_blank" rel="noopener noreferrer" className="btn-link">
                            Google Calendar<span className="sr-only"> (se abre en otra pestaña)</span>
                          </a>
                          <button type="button" className="btn-link" onClick={() => descargarIcs([f], `${f.fecha}.ics`)}>Otro calendario</button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-10 max-w-prose text-sm text-slate">
        Las fechas de pago son las que fija la ley como plazo máximo: tu empresa puede pagar antes. Los cambios de la ley se agregan cuando una norma o
        una sentencia fija una fecha cierta.
      </p>
      <CanalWhatsApp className="mt-10" />
    </div>
  );
}

function fechaLegible(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return `${DIAS[d.getDay()][0].toUpperCase()}${DIAS[d.getDay()].slice(1)} ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`;
}
