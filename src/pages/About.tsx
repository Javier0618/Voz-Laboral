import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { brand } from '../config/brand';
import type { ExperienceStatus } from '../lib/api';
import { PageHeader, StatusChip, statusHint } from '../components/ui';
import { PromoVideoInline } from '../components/PromoVideo';

const principles = [
  { title: 'Lo bueno y lo malo', text: 'Una empresa no es solo sus problemas. Publicamos experiencias buenas, malas y mixtas para que se vea el cuadro completo.' },
  { title: 'Sin puntuaciones ni rankings', text: 'No calificamos empresas con estrellas ni las ordenamos. Mostramos relatos y, cuando hay suficientes, cuántos hay por tema.' },
  { title: 'Tu identidad, protegida', text: 'Se publica con un alias o como «Persona sin cuenta». Nadie, tampoco las empresas, recibe tu correo ni tus datos de cuenta.' },
  { title: 'Independencia', text: 'Las empresas no pueden pagar para retirar o cambiar una experiencia. Pueden pedir que corrijamos un dato verificable o responder en público.' },
];

const states: ExperienceStatus[] = ['en_revision', 'publicada', 'requiere_ajustes', 'en_disputa', 'restringida', 'retirada'];

const faqs = [
  {
    q: '¿Necesito una cuenta para compartir?',
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
    document.title = `Quiénes somos y cómo moderamos · ${brand.name}`;
  }, []);

  return (
    <div className="page py-10">
      <PageHeader title="Quiénes somos y cómo moderamos">
        {brand.name} reúne experiencias de trabajo en empresas de {brand.country}, contadas por quienes las vivieron. Sirve para saber qué
        esperar de un empleo, reconocer lo que una empresa hace bien y señalar lo que debe mejorar.
      </PageHeader>

      <section className="mt-12 grid items-center gap-10 rounded-lg bg-mist p-6 sm:p-10 md:grid-cols-[minmax(0,1fr)_18rem]" aria-labelledby="video">
        <div>
          <h2 id="video" className="text-3xl">{brand.name} en un minuto</h2>
          <p className="mt-3 max-w-prose text-slate">
            Qué es, cómo se comparte una experiencia, qué pueden hacer los demás y dónde están las guías de tus derechos. El video tiene sonido y
            subtítulos.
          </p>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-slate marker:text-teal">
            <li>Busca la empresa o pide que la agreguen.</li>
            <li>Cuenta cómo te fue con un alias, o sin cuenta.</li>
            <li>Reacciona, comenta y aprende sobre tus derechos.</li>
          </ul>
          <Link to="/compartir" className="btn-primary mt-7">Compartir una experiencia</Link>
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
        <h2 id="moderacion" className="text-3xl">Cómo moderamos</h2>
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

      <section className="mt-20 grid gap-6 rounded-lg bg-ink p-8 text-white md:grid-cols-[minmax(0,1fr)_auto] md:items-center sm:p-10" aria-labelledby="participa">
        <div>
          <h2 id="participa" className="font-serif text-3xl text-white">¿Cómo te fue en tu trabajo?</h2>
          <p className="mt-2 max-w-prose text-white/80">Cuéntalo con un alias o sin cuenta. Tu experiencia ayuda a quien está pensando en trabajar ahí.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/compartir" className="btn bg-white text-ink hover:bg-teal-tint">Compartir una experiencia</Link>
          <Link to="/politicas/reglas" className="btn border border-white/40 text-white hover:border-white">Leer las reglas</Link>
        </div>
      </section>
    </div>
  );
}
