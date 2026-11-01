import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { brand } from '../config/brand';
import type { ExperienceStatus } from '../lib/api';
import { setPageMeta } from '../lib/meta';
import { PageHeader, StatusChip, statusHint } from '../components/ui';
import { PromoVideoInline } from '../components/PromoVideo';

const pillars = [
  {
    title: 'Guías laborales',
    text: 'Nuestro centro. Explicamos tus derechos, las reformas y los cambios en el trabajo en lenguaje claro, con la norma citada, su fuente oficial y la fecha de revisión.',
    to: '/derechos',
    cta: 'Ver las guías',
  },
  {
    title: 'Experiencias',
    text: 'Lo que cuentan quienes trabajan en cada empresa, con un alias. Complementan las guías con lo que pasa en la práctica.',
    to: '/experiencias',
    cta: 'Leer experiencias',
  },
  {
    title: 'Calculadoras',
    text: 'Herramientas para revisar tu nómina, tu prima, tus cesantías o tu liquidación. Cada una explica cómo se calcula y enlaza a su guía.',
    to: '/calculadoras',
    cta: 'Usar una calculadora',
  },
];

const editorial = [
  { title: 'Fuente oficial en cada guía', text: 'Cada afirmación se apoya en la ley, un decreto o una sentencia, y la guía enlaza al texto oficial.' },
  { title: 'Fecha de verificación visible', text: 'Cada guía muestra cuándo se revisó por última vez contra la norma. Las revisamos cuando cambia la ley.' },
  { title: 'Misma estructura siempre', text: 'Qué dice la ley, cómo se aplica en la práctica, errores comunes, qué puedes hacer y lecturas relacionadas.' },
  { title: 'Orientación, no asesoría', text: 'Las guías son información general. Para tu caso concreto, acude al Ministerio del Trabajo o a un profesional del derecho.' },
];

const principles = [
  { title: 'Información clara y verificable', text: 'Escribimos para quien trabaja, no para abogados, y citamos siempre de dónde sale cada dato. Si una norma cambia, la guía cambia.' },
  { title: 'Lo bueno y lo malo', text: 'Una empresa no es solo sus problemas. Publicamos experiencias buenas, malas y mixtas para que se vea el cuadro completo.' },
  { title: 'Sin puntuaciones ni rankings', text: 'No calificamos empresas con estrellas ni las ordenamos. Mostramos relatos y, cuando hay suficientes, cuántos hay por tema.' },
  { title: 'Tu identidad, protegida', text: 'Se publica con un alias o como «Persona sin cuenta». Nadie, tampoco las empresas, recibe tu correo ni tus datos de cuenta.' },
  { title: 'Independencia', text: 'Las empresas no pueden pagar para retirar o cambiar una experiencia. Pueden pedir que corrijamos un dato verificable o responder en público.' },
];

const states: ExperienceStatus[] = ['en_revision', 'publicada', 'requiere_ajustes', 'en_disputa', 'restringida', 'retirada'];

const faqs = [
  {
    q: '¿Quién escribe las guías?',
    a: 'El equipo de VozLaboral, a partir del texto oficial de las normas. Cada guía cita sus fuentes y muestra la fecha de verificación. No son asesoría jurídica: para tu caso concreto, consulta al Ministerio del Trabajo o a un abogado.',
  },
  {
    q: '¿Qué hago si una guía tiene un error o está desactualizada?',
    a: 'Escríbenos al correo de contacto que aparece al pie de la página, indicando la guía y la norma que cambió. La revisamos contra la fuente oficial y, si corresponde, la corregimos y actualizamos su fecha de verificación.',
  },
  {
    q: '¿Necesito una cuenta para compartir una experiencia?',
    a: 'No. Puedes compartir sin cuenta y recibirás un enlace privado para seguir tu experiencia. Con una cuenta, además, la ves en Mi cuenta, puedes editarla o apelar, y puedes reaccionar y comentar en otras experiencias.',
  },
  {
    q: '¿Alguien puede saber quién soy?',
    a: 'Nadie ve tu correo ni tus datos de cuenta, y el equipo de moderación tampoco ve tu correo. Pero si cuentas detalles que solo tú conoces, alguien cercano podría reconocerte: por eso te avisamos cuando el texto parece incluir datos personales.',
  },
  {
    q: '¿Qué pasa si una empresa no está de acuerdo?',
    a: 'Puede pedir que corrijamos un dato verificable o publicar una respuesta identificada como suya. Mientras lo estudiamos, la experiencia puede aparecer «En disputa». Una reclamación nunca revela quién la escribió.',
  },
  {
    q: '¿Puedo borrar lo que publiqué?',
    a: 'Sí. Desde Mi cuenta puedes retirar tus experiencias, borrar tus comentarios y pedir la eliminación de tu cuenta. Si compartiste sin cuenta, vincúlala primero desde tu enlace de seguimiento.',
  },
  {
    q: '¿Comprueban que lo que se cuenta sea cierto?',
    a: 'No. Revisamos que se cumplan las reglas: sin datos personales, sin amenazas, sin documentos confidenciales. Cada experiencia refleja la vivencia de quien la escribe.',
  },
];

export default function About() {
  useEffect(() => {
    setPageMeta({
      title: `Quiénes somos y cómo trabajamos · ${brand.name}`,
      description: `${brand.name} publica guías laborales claras para trabajadores en ${brand.country}, con fuentes oficiales, y reúne experiencias y calculadoras. Cómo hacemos las guías y cómo moderamos.`,
      path: '/como-funciona',
      type: 'website',
    });
    return () => setPageMeta(null);
  }, []);

  return (
    <div className="page py-10">
      <PageHeader title="Quiénes somos y cómo trabajamos">
        {brand.name} publica guías laborales claras para quienes trabajan en {brand.country}: tus derechos, las reformas y los cambios en el
        mundo del trabajo, explicados con la norma en la mano. Las experiencias de otros trabajadores y las calculadoras completan las guías
        con lo que pasa en la práctica.
      </PageHeader>

      <section className="mt-12" aria-labelledby="que-hacemos">
        <h2 id="que-hacemos" className="text-3xl">Qué encontrarás aquí</h2>
        <ol className="mt-6 grid gap-6 border-t border-ink/80 pt-8 md:grid-cols-3">
          {pillars.map((p, i) => (
            <li key={p.title} className="flex flex-col">
              <span className="text-sm font-semibold text-teal-strong">{i === 0 ? 'Lo principal' : 'Complemento'}</span>
              <h3 className="mt-1 font-serif text-2xl">{p.title}</h3>
              <p className="mt-2 max-w-prose text-slate">{p.text}</p>
              <Link to={p.to} className={`mt-4 self-start ${i === 0 ? 'btn-primary' : 'btn-link'}`}>{p.cta}</Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 rounded-lg bg-mist p-6 sm:p-10" aria-labelledby="como-guias">
        <h2 id="como-guias" className="text-3xl">Cómo hacemos las guías</h2>
        <ul className="mt-6 grid gap-x-12 gap-y-8 md:grid-cols-2">
          {editorial.map((p) => (
            <li key={p.title}>
              <h3 className="font-sans text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 max-w-prose text-slate">{p.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 grid items-center gap-10 rounded-lg border border-line p-6 sm:p-10 md:grid-cols-[minmax(0,1fr)_18rem]" aria-labelledby="video">
        <div>
          <h2 id="video" className="text-3xl">{brand.name} en un minuto</h2>
          <p className="mt-3 max-w-prose text-slate">
            Qué es, qué encontrarás en las guías, cómo te ayudan las calculadoras y cómo se comparte una experiencia. El video tiene subtítulos.
          </p>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-slate marker:text-teal">
            <li>Aprende sobre tus derechos y los cambios en la ley.</li>
            <li>Busca una empresa y lee lo que cuentan quienes trabajan ahí.</li>
            <li>Cuenta cómo te fue con un alias, o sin cuenta.</li>
          </ul>
          <Link to="/derechos" className="btn-primary mt-7">Ver las guías</Link>
        </div>
        <PromoVideoInline />
      </section>

      <section className="mt-14" aria-labelledby="principios">
        <h2 id="principios" className="text-3xl">En qué creemos</h2>
        <ul className="mt-6 grid gap-x-12 gap-y-8 border-t border-ink/80 pt-8 md:grid-cols-2">
          {principles.map((p) => (
            <li key={p.title}>
              <h3 className="font-sans text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 max-w-prose text-slate">{p.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20 rounded-lg bg-mist p-6 sm:p-10" aria-labelledby="moderacion">
        <h2 id="moderacion" className="text-3xl">Cómo moderamos las experiencias</h2>
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="font-sans text-lg font-semibold">Experiencias: revisión antes de publicar</h3>
            <p className="mt-2 max-w-prose text-slate">
              Una persona del equipo lee cada experiencia antes de que aparezca. Comprobamos que no tenga nombres ni datos de contacto,
              amenazas, insultos ni documentos confidenciales. No juzgamos si los hechos son ciertos ni si la experiencia es buena o mala.
            </p>
            <h3 className="mt-8 font-sans text-lg font-semibold">Comentarios: al instante, con filtros</h3>
            <p className="mt-2 max-w-prose text-slate">
              Los comentarios se publican en cuanto se envían. Si parecen incluir un correo, un teléfono o un número de documento, quedan
              retenidos hasta revisarlos. Cualquiera con cuenta puede reportar un comentario, y quien escribió la experiencia puede
              desactivarlos.
            </p>
            <h3 className="mt-8 font-sans text-lg font-semibold">Cada decisión tiene un motivo</h3>
            <p className="mt-2 max-w-prose text-slate">
              Quien escribió ve el motivo de cada decisión y puede apelar. Todas las decisiones quedan en un historial que nadie puede
              modificar.
            </p>
          </div>
          <div>
            <h3 className="font-sans text-lg font-semibold">Los estados de una experiencia</h3>
            <ul className="mt-4 space-y-4">
              {states.map((st) => (
                <li key={st} className="grid gap-1 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-baseline">
                  <span><StatusChip status={st} /></span>
                  <span className="text-sm text-slate">{statusHint(st)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-20" aria-labelledby="preguntas">
        <h2 id="preguntas" className="text-3xl">Preguntas frecuentes</h2>
        <div className="mt-6 max-w-3xl border-t border-ink/80">
          {faqs.map((f) => (
            <details key={f.q} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold">
                {f.q}
                <span aria-hidden="true" className="text-xl text-teal transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-prose pb-5 text-slate">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-20 grid gap-6 rounded-lg bg-brand p-8 text-white md:grid-cols-[minmax(0,1fr)_auto] md:items-center sm:p-10" aria-labelledby="participa">
        <div>
          <h2 id="participa" className="font-serif text-3xl text-white">Conoce tus derechos laborales</h2>
          <p className="mt-2 max-w-prose text-white/80">
            Empieza por las guías. Y si quieres, cuenta cómo te fue en tu trabajo: tu experiencia ayuda a otras personas.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/derechos" className="btn bg-white text-onwhite-ink hover:bg-onwhite-tint">Ver las guías</Link>
          <Link to="/compartir" className="btn border border-white/40 text-white hover:border-white">Compartir una experiencia</Link>
        </div>
      </section>
    </div>
  );
}
