import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { brand } from '../../config/brand';
import { setPageMeta } from '../../lib/meta';
import { mensajeResultado, QUIZ } from '../../lib/quiz';
import { PageHeader } from '../../components/ui';
import { CanalWhatsApp } from '../../components/CanalWhatsApp';

type Estado = { indice: number; respuestas: (boolean | null)[] };

export default function QuizPage() {
  const [estado, setEstado] = useState<Estado>({ indice: 0, respuestas: QUIZ.map(() => null) });
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setPageMeta({
      title: `¿Mito o realidad? Pon a prueba tus derechos laborales · ${brand.name}`,
      description: 'Diez frases sobre prima, cesantías, despidos, vacaciones y pensión. ¿Mito o realidad? Juega en 2 minutos y reta a tus compañeros por WhatsApp.',
      path: '/herramientas/quiz',
    });
    return () => setPageMeta(null);
  }, []);

  const { indice, respuestas } = estado;
  const terminado = indice >= QUIZ.length;
  const pregunta = QUIZ[Math.min(indice, QUIZ.length - 1)];
  const respondida = !terminado && respuestas[indice] !== null;
  const acierto = respondida && respuestas[indice] === pregunta.realidad;
  const aciertos = respuestas.filter((r, i) => r !== null && r === QUIZ[i].realidad).length;

  useEffect(() => {
    // Al pasar de pregunta, el foco va al enunciado: así el lector de pantalla la lee.
    titulo.current?.focus();
  }, [indice]);

  function responder(valor: boolean) {
    if (respondida) return;
    setEstado((e) => ({ ...e, respuestas: e.respuestas.map((r, i) => (i === e.indice ? valor : r)) }));
  }

  const url = `${brand.siteUrl}/herramientas/quiz`;
  const textoReto = `Acerté ${aciertos} de ${QUIZ.length} en «¿Mito o realidad?» sobre derechos laborales. ¿Cuántas sacas tú? ${url}`;

  async function compartir() {
    if (navigator.share) {
      try {
        await navigator.share({ title: '¿Mito o realidad?', text: textoReto });
        return;
      } catch {
        /* la persona canceló: se ofrece WhatsApp */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(textoReto)}`, '_blank', 'noopener');
  }

  return (
    <div className="page py-10">
      <p className="text-sm"><Link to="/herramientas/" className="btn-link">Herramientas</Link></p>
      <PageHeader title="¿Mito o realidad?">
        Diez frases que se oyen en todos los trabajos. Decide si son mito o realidad y mira la explicación con la norma.
      </PageHeader>

      <div className="mt-8 max-w-2xl">
        {!terminado ? (
          <section aria-labelledby="pregunta-quiz">
            <div className="flex items-center justify-between text-sm text-slate">
              <span>Pregunta {indice + 1} de {QUIZ.length}</span>
              <span>{aciertos} {aciertos === 1 ? 'acierto' : 'aciertos'}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist" aria-hidden="true">
              <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${(indice / QUIZ.length) * 100}%` }} />
            </div>

            <h2 id="pregunta-quiz" ref={titulo} tabIndex={-1} className="mt-8 font-serif text-2xl leading-snug focus:outline-none sm:text-3xl">
              «{pregunta.afirmacion}»
            </h2>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[{ v: false, label: 'Mito' }, { v: true, label: 'Realidad' }].map(({ v, label }) => {
                const elegido = respuestas[indice] === v;
                const correcto = respondida && pregunta.realidad === v;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => responder(v)}
                    disabled={respondida}
                    aria-pressed={elegido}
                    className={`rounded-lg border-2 px-4 py-5 text-lg font-semibold transition-colors ${
                      !respondida ? 'border-line hover:border-teal hover:bg-teal/5'
                        : correcto ? 'border-teal bg-teal-tint text-ink'
                          : elegido ? 'border-danger/60 bg-danger-tint text-ink' : 'border-line opacity-60'
                    }`}
                  >
                    {label}
                    {respondida && correcto && <span className="ml-2" aria-hidden="true">✓</span>}
                  </button>
                );
              })}
            </div>

            {respondida && (
              <div className="mt-6 rounded-md border-l-4 border-teal bg-mist p-5" role="status">
                <p className="font-semibold">{acierto ? 'Correcto.' : 'No es así.'} Es {pregunta.realidad ? 'realidad' : 'un mito'}.</p>
                <p className="mt-2">{pregunta.explicacion}</p>
                <p className="mt-2 text-sm text-slate">Norma: {pregunta.norma}.</p>
                <p className="mt-2 text-sm">
                  Lee la guía: <Link to={`/derechos/${pregunta.guia.slug}/`} className="btn-link">{pregunta.guia.label}</Link>
                </p>
                <button type="button" className="btn-primary mt-5" onClick={() => setEstado((e) => ({ ...e, indice: e.indice + 1 }))}>
                  {indice + 1 < QUIZ.length ? 'Siguiente pregunta' : 'Ver mi resultado'}
                </button>
              </div>
            )}
          </section>
        ) : (
          <section aria-labelledby="resultado-quiz" className="rounded-lg border border-line p-6 sm:p-8">
            <h2 id="resultado-quiz" ref={titulo} tabIndex={-1} className="font-serif text-3xl focus:outline-none">
              Acertaste {aciertos} de {QUIZ.length}
            </h2>
            <p className="mt-3 text-lg">{mensajeResultado(aciertos, QUIZ.length)}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="btn-primary" onClick={compartir}>Retar a alguien por WhatsApp</button>
              <button type="button" className="btn-secondary" onClick={() => setEstado({ indice: 0, respuestas: QUIZ.map(() => null) })}>Jugar otra vez</button>
            </div>
            <h3 className="mt-8 font-sans text-base font-semibold">Repasa las respuestas</h3>
            <ol className="mt-3 space-y-3">
              {QUIZ.map((q, i) => {
                const bien = respuestas[i] === q.realidad;
                return (
                  <li key={q.afirmacion} className="flex gap-3">
                    <span aria-hidden="true" className={bien ? 'text-teal-strong' : 'text-danger'}>{bien ? '✓' : '✗'}</span>
                    <span>
                      <span className="sr-only">{bien ? 'Acertaste: ' : 'Fallaste: '}</span>
                      «{q.afirmacion}» <strong>{q.realidad ? 'Realidad' : 'Mito'}.</strong>{' '}
                      <Link to={`/derechos/${q.guia.slug}/`} className="btn-link text-sm">{q.guia.label}</Link>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
        <CanalWhatsApp className="mt-10" />
      </div>
    </div>
  );
}
