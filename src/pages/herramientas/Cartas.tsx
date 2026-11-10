import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { brand } from '../../config/brand';
import { setPageMeta } from '../../lib/meta';
import { CARTAS, cartaComoTexto, cartaPorSlug, generarCarta, type Carta, type DatosCarta } from '../../lib/cartas';
import { Alert, Field, PageHeader } from '../../components/ui';
import { PrintButton } from '../../components/PrintButton';
import { NotFound } from '../Policies';

const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Índice: las cartas disponibles. */
export function CartasIndex() {
  useEffect(() => {
    setPageMeta({
      title: `Cartas laborales gratis: derecho de petición, renuncia y más · ${brand.name}`,
      description: 'Modelos de carta para trabajadores en Colombia: derecho de petición al empleador, carta de renuncia, renuncia por justa causa, vacaciones e historia laboral. Con la norma citada.',
      path: '/herramientas/cartas',
    });
    return () => setPageMeta(null);
  }, []);
  return (
    <div className="page py-10">
      <p className="text-sm"><Link to="/herramientas/" className="btn-link">Herramientas</Link></p>
      <PageHeader title="Cartas y documentos laborales">
        Completa los datos, revisa el texto antes de firmar y descarga o imprime la carta. El modelo incluye referencias legales para orientarte. Lo que escribes no sale de tu
        navegador: no lo guardamos.
      </PageHeader>
      <ul className="mt-2">
        {CARTAS.map((c) => (
          <li key={c.slug} className="border-b border-line">
            <Link to={`/herramientas/cartas/${c.slug}/`} className="group grid gap-1 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
              <span>
                <span className="block font-serif text-2xl text-ink group-hover:text-teal-strong group-hover:underline group-hover:underline-offset-4">{c.title}</span>
                <span className="mt-1 block text-slate">{c.description}</span>
              </span>
              <span className="btn-secondary justify-self-start">Hacer la carta</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Campo({ carta, campo, valor, onChange }: { carta: Carta; campo: Carta['campos'][number]; valor: string; onChange: (v: string) => void }) {
  return (
    <Field label={campo.label} hint={campo.hint} optional={campo.optional}>
      {(p) =>
        campo.type === 'textarea' ? (
          <textarea {...p} rows={5} className="input min-h-[8rem]" placeholder={campo.placeholder} value={valor} onChange={(e) => onChange(e.target.value)} />
        ) : campo.type === 'select' ? (
          <select {...p} className="input" value={valor} onChange={(e) => onChange(e.target.value)}>
            {campo.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input
            {...p}
            type={campo.type}
            className="input"
            placeholder={campo.placeholder}
            autoComplete={campo.name === 'nombre' ? 'name' : campo.name === 'correo' ? 'email' : campo.name === 'telefono' ? 'tel' : 'off'}
            name={`${carta.slug}-${campo.name}`}
            value={valor}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      }
    </Field>
  );
}

function datosIniciales(carta: Carta | undefined): DatosCarta {
  const inicial: DatosCarta = { fecha: hoy() };
  for (const c of carta?.campos ?? []) if (c.type === 'select' && c.options) inicial[c.name] = c.options[0].value;
  return inicial;
}

/** Formulario y vista previa de una carta. */
export function CartaPage() {
  const { slug } = useParams();
  const carta = cartaPorSlug(slug);
  const [datos, setDatos] = useState<DatosCarta>(() => datosIniciales(carta));
  const [copiado, setCopiado] = useState(false);

  // React reutiliza este componente entre rutas de cartas diferentes.
  // No arrastrar campos, motivos ni datos personales de una carta a otra.
  useEffect(() => {
    setDatos(datosIniciales(carta));
    setCopiado(false);
  }, [carta?.slug]);

  useEffect(() => {
    if (!carta) return;
    setPageMeta({
      title: `${carta.title}: modelo gratis para llenar · ${brand.name}`,
      description: carta.description,
      path: `/herramientas/cartas/${carta.slug}`,
    });
    return () => setPageMeta(null);
  }, [carta]);

  const texto = useMemo(() => (carta ? generarCarta(carta.slug, datos) : null), [carta, datos]);
  if (!carta || !texto) return <NotFound />;

  const set = (k: string) => (v: string) => {
    setDatos((d) => ({ ...d, [k]: v }));
    setCopiado(false);
  };

  async function copiar() {
    try {
      await navigator.clipboard.writeText(cartaComoTexto(texto!));
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="page py-10">
      <p className="text-sm print:hidden"><Link to="/herramientas/cartas/" className="btn-link">Cartas y documentos</Link></p>
      <div className="print:hidden">
        <PageHeader title={carta.title}>{carta.description}</PageHeader>
      </div>

      <div className="mt-8 grid min-w-0 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="min-w-0 print:hidden">
          <p className="mb-5 text-sm text-slate">Los cambios se reflejan al instante en la vista previa. Antes de entregarla, comprueba fechas, destinatario y hechos.</p>
          <form noValidate className="space-y-5" aria-label={`Datos para la carta: ${carta.title}`} onSubmit={(e) => e.preventDefault()}>
            {carta.campos.map((c) => (
              <Campo key={c.name} carta={carta} campo={c} valor={datos[c.name] ?? ''} onChange={set(c.name)} />
            ))}
          </form>
          <section aria-labelledby="consejos" className="mt-8 rounded-md bg-mist p-5">
            <h2 id="consejos" className="font-sans text-base font-semibold">Antes de entregarla</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate marker:text-teal">
              {carta.consejos.map((c) => <li key={c}>{c}</li>)}
            </ul>
            <p className="mt-4 text-sm">
              Lee la guía: <Link to={`/derechos/${carta.guia.slug}/`} className="btn-link">{carta.guia.label}</Link>
            </p>
          </section>
        </div>

        <div className="min-w-0">
          <div className="lg:sticky lg:top-4">
            <div className="mb-3 flex flex-wrap items-center gap-3 print:hidden">
              <PrintButton label="Imprimir o guardar en PDF" />
              <button type="button" className="btn-secondary text-xs" onClick={copiar}>{copiado ? 'Copiada' : 'Copiar el texto'}</button>
              <span role="status" className="sr-only">{copiado ? 'Texto de la carta copiado.' : ''}</span>
            </div>
            <article aria-label="Vista previa de la carta" className="folio carta-impresa min-w-0 break-words rounded border border-line bg-white p-6 font-sans text-[0.95rem] leading-7 text-black shadow-sm sm:p-10">
              {texto.encabezado.map((l) => <p key={l} className="text-right">{l}</p>)}
              <div className="mt-6">{texto.destinatario.map((l, i) => <p key={i}>{l}</p>)}</div>
              <p className="mt-6"><strong>Asunto: {texto.asunto}</strong></p>
              <div className="mt-4 space-y-3">
                {texto.cuerpo.map((p, i) =>
                  p === 'Hechos' || p === 'Petición' || p === 'Anexos:'
                    ? <p key={i} className="pt-2 font-semibold">{p}</p>
                    : <p key={i} className="whitespace-pre-line">{p}</p>,
                )}
              </div>
              <div className="mt-8">{texto.firma.map((l, i) => <p key={i} className="min-h-[1.75rem]">{l}</p>)}</div>
            </article>
            <div className="mt-4 print:hidden">
              <Alert tone="info">
                Los espacios con «___» son datos que faltan: complétalos en el formulario o a mano. Comprueba que lo escrito sea cierto, guarda una copia y pide constancia de recibido. Esta carta es un modelo orientativo; si tu caso es
                complejo, pide asesoría al Ministerio del Trabajo, a un consultorio jurídico o a un abogado.
              </Alert>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
