// Sugerencias editoriales: temas que el redactor propone publicar o actualizar.
// La administración pide la redacción, descarta o marca como existente; la
// guía redactada llega como borrador y se publica desde el editor de siempre.
import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  applySuggestionProposal, createEditorialSuggestion, deleteSuggestion, listGuideSuggestions, listGuides, listSearchGaps, setSuggestionStatus, type GuideSuggestion,
} from '../../lib/adminApi';
import { formatDate } from '../../lib/format';
import { TEMAS_GUIAS } from '../../lib/temasGuias';
import type { AppError } from '../../lib/supabase';
import { GuideBody } from '../../components/GuideBody';
import { Alert, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, Loading, useAsync } from '../../components/ui';

type Filter = 'nueva' | 'pedida' | 'redactada' | 'publicada' | 'archivo';

/** Redactada y ya publicada (guía nueva) o aplicada (actualización). */
const isPublished = (s: GuideSuggestion) =>
  s.status === 'redactada' && (s.kind === 'nueva' ? s.draft?.status === 'publicado' : Boolean(s.decided_at));

const filters: { id: Filter; label: string; match: (s: GuideSuggestion) => boolean }[] = [
  { id: 'nueva', label: 'Nuevas', match: (s) => s.status === 'nueva' },
  { id: 'pedida', label: 'Pedidas', match: (s) => s.status === 'pedida' },
  { id: 'redactada', label: 'Redactadas', match: (s) => s.status === 'redactada' && !isPublished(s) },
  { id: 'publicada', label: 'Publicadas', match: isPublished },
  { id: 'archivo', label: 'Descartadas', match: (s) => s.status === 'descartada' || s.status === 'existente' },
];
const priorityStyle: Record<GuideSuggestion['priority'], string> = {
  alta: 'border-amber/40 bg-amber-tint text-amber',
  media: 'border-line bg-mist text-navy',
  baja: 'border-line bg-paper text-slate',
};
const topicName = (slug: string) => TEMAS_GUIAS.find((t) => t.slug === slug)?.name;

export function Suggestions() {
  const { data, loading, error, reload } = useAsync(() => listGuideSuggestions(), []);
  const [filter, setFilter] = useState<Filter>('nueva');
  const count = (f: Filter) => (data ?? []).filter(filters.find((x) => x.id === f)!.match).length;
  const visible = (data ?? []).filter(filters.find((x) => x.id === filter)!.match);
  const order = { alta: 0, media: 1, baja: 2 };
  if (filter === 'nueva') visible.sort((a, b) => order[a.priority] - order[b.priority]);

  return (
    <section>
      <p className="max-w-prose text-slate">
        Temas que conviene publicar o actualizar, con el motivo y sus fuentes. Pulsa «Redactar guía» en los que te interesen: la guía llega
        como <strong>borrador</strong> y la publicas desde Guías después de revisarla.
      </p>
      <EditorialAssistant />
      <div role="tablist" aria-label="Estado de las sugerencias" className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${filter === f.id ? 'border-ink bg-ink text-white' : 'border-line text-slate hover:border-slate hover:text-ink'}`}>
            {f.label}{data ? ` · ${count(f.id)}` : ''}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : !visible.length ? (
          <EmptyState title={filter === 'nueva' ? 'No hay sugerencias nuevas' : 'No hay sugerencias aquí'}>
            {filter === 'nueva'
              ? 'Prepara el contexto desde el asistente editorial y realiza la investigación web en ChatGPT. Después importa el JSON de recomendaciones.'
              : filter === 'pedida'
                ? 'Cuando pulses «Redactar guía» en una sugerencia, aparecerá aquí hasta que el redactor la escriba.'
                : filter === 'publicada'
                  ? 'Aquí quedan las sugerencias cuya guía ya publicaste, o cuya actualización aplicaste.'
                  : 'Nada por ahora.'}
          </EmptyState>
        ) : (
          <ul className="space-y-5">{visible.map((s) => <SuggestionCard key={s.id} s={s} onDone={reload} />)}</ul>
        )}
      </div>
    </section>
  );
}


/** Prepara el contexto para investigar con ChatGPT y permite importar el JSON resultante. */
function EditorialAssistant() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [guides, searches, suggestions] = await Promise.all([
      listGuides(), listSearchGaps(180), listGuideSuggestions(),
    ]);
    return { guides, searches, suggestions };
  }, []);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  function exportContext() {
    if (!data) return;
    const payload = {
      schema: 'tuvozlaboral-editorial-context-v1',
      generated_at: new Date().toISOString(),
      site: 'TuVozLaboral',
      country: 'Colombia',
      guides: data.guides.map((g) => ({
        slug: g.slug, title: g.title, summary: g.summary, status: g.status,
        topic: g.topic, category_slug: g.category_slug,
        last_verified_at: g.last_verified_at, updated_at: g.updated_at,
      })),
      internal_searches_without_results: data.searches,
      existing_suggestions: data.suggestions.map((s) => ({
        kind: s.kind, title: s.title, status: s.status, topic: s.topic, target: s.target?.slug ?? null,
      })),
      google_search_queries: [
        'site:mintrabajo.gov.co trabajo Colombia novedades laborales 2026',
        'site:suin-juriscol.gov.co laboral Colombia ley decreto resolución 2026',
        'site:funcionpublica.gov.co normas laborales Colombia 2026',
        'site:corteconstitucional.gov.co trabajo Colombia sentencia 2026',
        'site:consejodeestado.gov.co laboral Colombia sentencia 2026',
        ...data.searches.slice(0, 12).map((item) => `\"${item.term}\" Colombia derechos laborales`),
      ],
      recommendation_contract: {
        output: 'JSON válido con una propiedad recommendations que contenga una lista',
        fields: ['kind', 'title', 'reason', 'demand', 'priority', 'topic', 'keywords', 'sources', 'target'],
        source_format: { label: 'Nombre descriptivo de la fuente', url: 'URL HTTPS verificable' },
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `tuvozlaboral-investigacion-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setReport('Contexto descargado. Adjunta el JSON en ChatGPT y usa las instrucciones de investigación que aparecen debajo.');
    setReportError(null);
  }

  async function importRecommendations(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setReport(null);
    setReportError(null);
    try {
      const parsed = JSON.parse(await file.text());
      const items = Array.isArray(parsed) ? parsed : parsed?.recommendations;
      if (!Array.isArray(items) || !items.length) throw new Error('El archivo debe contener una lista «recommendations» con al menos una recomendación.');
      if (!data) throw new Error('No se ha podido cargar el catálogo para validar duplicados.');
      const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const knownGuides = new Set(data.guides.map((g) => normalize(g.title)));
      const knownSlugs = new Set(data.guides.map((g) => g.slug));
      const existing = new Set(data.suggestions.filter((s) => !['descartada', 'existente'].includes(s.status)).map((s) => normalize(s.title)));
      const added = new Set<string>();
      let created = 0;
      const skipped: string[] = [];
      const failed: string[] = [];

      for (const [index, raw] of items.entries()) {
        const label = typeof raw?.title === 'string' ? raw.title : `Recomendación ${index + 1}`;
        try {
          if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('formato inválido');
          const title = String(raw.title ?? '').trim();
          const reason = String(raw.reason ?? '').trim();
          const kind = raw.kind === 'actualizar' ? 'actualizar' : raw.kind === 'nueva' ? 'nueva' : null;
          const priority = ['alta', 'media', 'baja'].includes(raw.priority) ? raw.priority : 'media';
          const topic = raw.topic == null ? '' : String(raw.topic);
          const keywords = Array.isArray(raw.keywords) ? raw.keywords.map(String).map((v: string) => v.trim()).filter(Boolean).slice(0, 15) : [];
          const sources = Array.isArray(raw.sources) ? raw.sources.map((s: any) => ({ label: String(s?.label ?? '').trim(), url: String(s?.url ?? '').trim() })) : [];
          if (!kind) throw new Error('kind debe ser «nueva» o «actualizar»');
          if (title.length < 5 || title.length > 160) throw new Error('título fuera del límite de 5–160 caracteres');
          if (reason.length < 20 || reason.length > 2000) throw new Error('motivo fuera del límite de 20–2000 caracteres');
          if (topic && !TEMAS_GUIAS.some((t) => t.slug === topic)) throw new Error('tema editorial no reconocido');
          if (!sources.length || sources.length > 15 || sources.some((s: {label:string;url:string}) => s.label.length < 3 || s.label.length > 200 || !/^https:\/\//i.test(s.url))) {
            throw new Error('incluye entre 1 y 15 fuentes con nombre y URL HTTPS');
          }
          if (kind === 'actualizar' && (typeof raw.target !== 'string' || !knownSlugs.has(raw.target))) {
            throw new Error('la actualización debe indicar el slug de una guía existente');
          }
          const normalized = normalize(title);
          if (existing.has(normalized) || added.has(normalized) || (kind === 'nueva' && knownGuides.has(normalized))) {
            skipped.push(`«${title}»: posible duplicado`);
            continue;
          }
          await createEditorialSuggestion({
            kind, title, reason, demand: String(raw.demand ?? '').slice(0, 1000),
            priority, topic, keywords, sources, target: kind === 'actualizar' ? raw.target : null,
          });
          added.add(normalized);
          created++;
        } catch (err) {
          failed.push(`«${label}»: ${err instanceof Error ? err.message : 'no se pudo importar'}`);
        }
      }
      setReport(`Importación terminada: ${created} sugerencia(s) creada(s), ${skipped.length} omitida(s) por duplicado y ${failed.length} con error.${skipped.length ? '\\n' + skipped.join('\\n') : ''}${failed.length ? '\\n' + failed.join('\\n') : ''}`);
      await reload();
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'No se pudo leer el archivo.');
    } finally {
      setBusy(false);
    }
  }

  const prompt = `Actúa como investigador editorial y abogado laboralista especializado en Colombia para TuVozLaboral. Analiza el JSON adjunto y utiliza google_search_queries como consultas iniciales de búsqueda web; contrasta los hallazgos con fuentes oficiales. Investiga en la web asuntos laborales colombianos recientes y relevantes: leyes sancionadas, decretos, resoluciones, circulares, decisiones judiciales, proyectos en trámite y fechas de entrada en vigor. Busca primero en fuentes oficiales (Diario Oficial, SUIN-Juriscol, Ministerio del Trabajo, Función Pública, Corte Constitucional, Corte Suprema, Consejo de Estado, DANE, UGPP, Colpensiones y Congreso). Puedes usar noticias fiables para descubrir temas, pero confirma cada afirmación jurídica con su fuente primaria. Distingue expresamente norma vigente, proyecto, anuncio y decisión judicial; no presentes propuestas como derecho vigente. Cruza cada hallazgo con el catálogo, las búsquedas internas y las sugerencias existentes. Detecta duplicados y decide si conviene una guía nueva o actualizar una existente. Prioriza utilidad para trabajadores, impacto, actualidad y vacíos reales. No inventes volumen de búsquedas: el interés debe indicar si procede de búsquedas internas, actualidad normativa o una estimación editorial. Devuelve SOLO JSON válido con esta estructura: {"recommendations":[{"kind":"nueva|actualizar","title":"...","reason":"Motivo concreto de al menos 20 caracteres","demand":"Señal de interés y su origen, sin inventar métricas","priority":"alta|media|baja","topic":"reformas|formas-de-trabajar|jornada|salud|dignidad|colectivos|salario|terminacion|tramites|empleo","keywords":["..."],"sources":[{"label":"Fuente oficial o verificable","url":"https://..."}],"target":"slug existente, solo si kind=actualizar"}]}. Cada recomendación debe tener al menos una fuente HTTPS verificable. Máximo 15 palabras clave y 15 fuentes por recomendación. No redactes guías ni publiques nada. Si no hay evidencia suficiente, devuelve menos recomendaciones en vez de rellenar.`;

  return (
    <section className="mt-6 rounded-lg border border-teal/30 bg-mist/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl">Asistente de investigación editorial</h2>
          <p className="mt-1 max-w-prose text-sm text-slate">
            Prepara los datos del sitio para investigarlos en ChatGPT con búsqueda web. No requiere API ni genera consumo adicional.
          </p>
        </div>
        <span className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold text-slate">Sin API de pago</span>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">No se pudo cargar el contexto: {String(error)}</p>}
      <p className="mt-3 text-sm text-slate">
        {loading ? 'Cargando guías, búsquedas y sugerencias…' : data ? `${data.guides.length} guías · ${data.searches.length} términos sin resultado · ${data.suggestions.length} sugerencias revisadas` : 'No hay contexto disponible.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={!data || loading} onClick={exportContext}>Descargar contexto de investigación</button>
        <label className={`btn-secondary cursor-pointer ${busy ? 'pointer-events-none opacity-60' : ''}`}>
          {busy ? 'Importando…' : 'Importar recomendaciones JSON'}
          <input type="file" accept="application/json,.json" className="sr-only" disabled={busy || !data} onChange={importRecommendations} />
        </label>
      </div>
      {report && <div role="status" className="mt-4 whitespace-pre-line rounded border border-line bg-paper p-3 text-sm">{report}</div>}
      {reportError && <div className="mt-4"><Alert tone="error">{reportError}</Alert></div>}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold">Instrucciones para investigar en ChatGPT</summary>
        <p className="mt-2 text-sm text-slate">Descarga el contexto, adjúntalo en esta conversación y pega estas instrucciones. Después importa aquí el JSON de recomendaciones que te entregue ChatGPT.</p>
        <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded bg-paper p-3 text-xs">{prompt}</pre>
        <button type="button" className="btn-secondary mt-3" onClick={() => navigator.clipboard.writeText(prompt).then(() => setReport('Instrucciones copiadas. Adjunta también el archivo de contexto descargado.')).catch(() => setReportError('No se pudo copiar. Selecciona y copia el texto manualmente.'))}>Copiar instrucciones</button>
      </details>
      <p className="mt-3 text-xs text-slate">La exportación se genera en tu navegador. La investigación web se realiza desde ChatGPT; el panel no ejecuta Google directamente ni necesita una API. Solo se guardan en Supabase las sugerencias que importes. Todas quedan en estado «nueva» y requieren revisión humana.</p>
    </section>
  );
}

/** Lo que la gente buscó en el sitio sin encontrar nada (registro anónimo, migración 2400). */
function SearchGaps() {
  const { data, error } = useAsync(() => listSearchGaps(30), []);
  if (error || !data) return null;
  return (
    <details className="mt-6 rounded-lg border border-line bg-mist/50 px-5 py-4">
      <summary className="cursor-pointer font-semibold">
        Búsquedas sin resultado en los últimos 30 días · {data.length}
      </summary>
      {data.length === 0 ? (
        <p className="mt-3 text-sm text-slate">Nadie ha buscado algo que no encontrara. Esta lista se llena con lo que la gente escribe en el buscador.</p>
      ) : (
        <>
          <p className="mt-3 max-w-prose text-sm text-slate">
            Términos que la gente escribió en el buscador sin obtener resultados, de forma anónima. El redactor los revisa al proponer temas.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {data.map((g) => (
              <li key={g.term} className="rounded-full border border-line bg-paper px-3 py-1 text-sm">
                {g.term} <span className="text-slate">· {g.searches}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </details>
  );
}

function SuggestionCard({ s, onDone }: { s: GuideSuggestion; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [preview, setPreview] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  async function act(task: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await task();
      onDone();
    } catch (err) {
      setError((err as AppError).message);
    } finally {
      setBusy(false);
    }
  }

  const topic = topicName(s.topic);
  return (
    <li className="rounded-lg border border-line bg-paper p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className={`rounded-full border px-2.5 py-0.5 ${priorityStyle[s.priority]}`}>Prioridad {s.priority}</span>
        <span className="rounded-full border border-line px-2.5 py-0.5 text-slate">{s.kind === 'nueva' ? 'Guía nueva' : 'Actualizar una guía'}</span>
        {topic && <span className="rounded-full border border-line px-2.5 py-0.5 text-slate">{topic}</span>}
        <span className="font-normal text-slate">Sugerida el {formatDate(s.created_at)}</span>
      </div>
      <h3 className="mt-3 font-serif text-2xl leading-snug">{s.title}</h3>
      {s.kind === 'actualizar' && s.target && (
        <p className="mt-1 text-sm text-slate">
          Guía: <Link to={`/moderacion/guias/${s.target.id}`} className="btn-link font-normal">{s.target.title}</Link>
          {s.target.status === 'publicado' ? ' (publicada)' : ''}
        </p>
      )}
      <dl className="mt-4 space-y-3 text-[0.9375rem]">
        <div><dt className="font-semibold">Por qué publicarla</dt><dd className="mt-0.5 max-w-prose text-slate">{s.reason}</dd></div>
        {s.demand && <div><dt className="font-semibold">Interés</dt><dd className="mt-0.5 max-w-prose text-slate">{s.demand}</dd></div>}
        {s.keywords.length > 0 && (
          <div>
            <dt className="font-semibold">Búsquedas a las que respondería</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">{s.keywords.map((k) => <span key={k} className="rounded bg-mist px-2 py-0.5 text-sm text-navy">{k}</span>)}</dd>
          </div>
        )}
        {s.sources.length > 0 && (
          <div>
            <dt className="font-semibold">Fuentes</dt>
            <dd>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {s.sources.map((f) => (
                  <li key={f.url}><a href={f.url} target="_blank" rel="noopener noreferrer" className="btn-link font-normal">{f.label}<span className="sr-only"> (se abre en otra pestaña)</span></a></li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        {s.instructions && <div><dt className="font-semibold">Tus indicaciones</dt><dd className="mt-0.5 max-w-prose text-slate">{s.instructions}</dd></div>}
      </dl>

      {error && <div className="mt-4"><Alert tone="error">{error}</Alert></div>}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        {s.status === 'nueva' && (
          <>
            <button type="button" className="btn-primary" disabled={busy} onClick={() => setAsking(true)}>
              {s.kind === 'nueva' ? 'Redactar guía' : 'Redactar actualización'}
            </button>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => act(() => setSuggestionStatus(s.id, 'existente'))}>Ya la tenemos</button>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => act(() => setSuggestionStatus(s.id, 'descartada'))}>Descartar</button>
          </>
        )}
        {s.status === 'pedida' && (
          <>
            <p className="text-sm text-slate">Pedida el {formatDate(s.requested_at!)}. El redactor la escribirá en su próxima revisión.</p>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => act(() => setSuggestionStatus(s.id, 'nueva'))}>Cancelar pedido</button>
          </>
        )}
        {s.status === 'redactada' && s.kind === 'nueva' && (
          s.draft ? (
            <>
              {s.draft.status === 'publicado'
                ? <Link to={`/derechos/${s.draft.slug}`} className="btn-secondary">Ver la guía publicada</Link>
                : <Link to={`/moderacion/guias/${s.draft.id}`} className="btn-primary">Revisar el borrador</Link>}
              <p className="text-sm text-slate">
                Redactada el {formatDate(s.drafted_at!)} · {s.draft.status === 'publicado' ? 'publicada' : 'en borrador, sin publicar'}
              </p>
            </>
          ) : <p className="text-sm text-slate">El borrador de esta sugerencia se borró.</p>
        )}
        {s.status === 'redactada' && s.kind === 'actualizar' && (
          s.decided_at || applied ? (
            <>
              <p className="text-sm text-slate">Propuesta aplicada{s.decided_at ? ` el ${formatDate(s.decided_at)}` : ''}.</p>
              {s.target && <Link to={`/moderacion/guias/${s.target.id}`} className="btn-secondary">Abrir la guía</Link>}
            </>
          ) : (
            <>
              <button type="button" className="btn-primary" disabled={busy} onClick={() => setPreview(true)}>Ver propuesta</button>
              <button type="button" className="btn-secondary" disabled={busy || !s.target} onClick={() => setApplying(true)}>Aplicar a la guía</button>
              <button type="button" className="btn-secondary" disabled={busy} onClick={() => act(() => setSuggestionStatus(s.id, 'descartada'))}>Descartar</button>
            </>
          )
        )}
        {(s.status === 'descartada' || s.status === 'existente') && (
          <>
            <p className="text-sm text-slate">{s.status === 'existente' ? 'Marcada como «ya la tenemos»' : 'Descartada'}{s.decided_at ? ` el ${formatDate(s.decided_at)}` : ''}.</p>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => act(() => setSuggestionStatus(s.id, 'nueva'))}>Reabrir</button>
            <button type="button" className="btn-danger" disabled={busy} onClick={() => setRemoving(true)}>Eliminar</button>
          </>
        )}
      </div>

      <RequestDialog open={asking} suggestion={s} onClose={() => setAsking(false)}
        onConfirm={(instructions) => act(() => setSuggestionStatus(s.id, 'pedida', instructions)).then(() => setAsking(false))} busy={busy} />
      <Dialog open={preview} onClose={() => setPreview(false)} title="Propuesta de actualización">
        {s.proposal_notes && <Alert tone="info" title="Qué cambia">{s.proposal_notes}</Alert>}
        <div className="mt-4 max-h-[60vh] overflow-y-auto rounded border border-line p-4">{s.proposal && <GuideBody content={s.proposal} />}</div>
      </Dialog>
      <ConfirmDialog open={applying} onClose={() => setApplying(false)} title="¿Aplicar la propuesta a la guía?" confirmLabel="Aplicar" tone="primary" busy={busy}
        onConfirm={() => act(async () => { await applySuggestionProposal(s.id); setApplied(s.id); setApplying(false); })}>
        El texto de «{s.target?.title}» se reemplaza por el propuesto.
        {s.target?.status === 'publicado' ? ' La guía está publicada: el cambio se verá de inmediato. Revisa la propuesta antes.' : ''}
      </ConfirmDialog>
      <ConfirmDialog open={removing} onClose={() => setRemoving(false)} title="¿Eliminar esta sugerencia?" confirmLabel="Eliminar" busy={busy}
        onConfirm={() => act(async () => { await deleteSuggestion(s.id); setRemoving(false); })}>
        «{s.title}» se borra de forma definitiva. Si el redactor vuelve a encontrar el tema, podrá sugerirlo de nuevo.
      </ConfirmDialog>
    </li>
  );
}

function RequestDialog({ open, suggestion: s, busy, onClose, onConfirm }: {
  open: boolean; suggestion: GuideSuggestion; busy: boolean; onClose: () => void; onConfirm: (instructions: string) => void;
}) {
  const [instructions, setInstructions] = useState('');
  return (
    <Dialog open={open} onClose={onClose} title={s.kind === 'nueva' ? 'Pedir la redacción de la guía' : 'Pedir la actualización'}>
      <p className="text-slate">
        El redactor escribirá «{s.title}» con la plantilla editorial, sus fuentes oficiales y lo necesario para buscadores.{' '}
        {s.kind === 'nueva' ? 'Llegará como borrador: nada se publica sin tu revisión.' : 'Llegará como propuesta: tú decides si la aplicas.'}
      </p>
      <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); onConfirm(instructions); }}>
        <Field label="Indicaciones para el redactor" optional hint="Por ejemplo: enfócate en trabajadores por días, incluye un ejemplo con el salario mínimo.">
          {(p) => <textarea {...p} className="input min-h-[96px]" maxLength={2000} value={instructions} onChange={(e) => setInstructions(e.target.value)} />}
        </Field>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Enviando…' : 'Pedir redacción'}</button>
        </div>
      </form>
    </Dialog>
  );
}

