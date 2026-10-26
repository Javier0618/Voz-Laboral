import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { createAnonymousExperience, createExperience, getCompanyById, listCategories, listMyExperiences, updateMyExperience, type ExperienceStatus, type Tone } from '../lib/api';
import { formatPeriod, relationshipLabel } from '../lib/format';
import { BODY_MAX, BODY_MIN, detectPersonalData, experienceSchema, fieldErrors, personalDataMessages, type ExperienceInput } from '../lib/schemas';
import type { AppError } from '../lib/supabase';
import { CompanyPicker, type PickedCompany } from '../components/CompanyPicker';
import { SuggestCompanyDialog } from '../components/SuggestCompanyDialog';
import { Alert, ConfigNotice, Field, Loading, notConfigured, PageHeader, StatusChip, ToneChip, useAsync } from '../components/ui';

const DRAFT_KEY = 'vozlaboral:borrador';

interface Draft {
  company: PickedCompany | null;
  tone: '' | Tone;
  category: string;
  periodStart: string;
  periodEnd: string;
  relationship: '' | 'actual' | 'anterior' | 'prefiero_no_decir';
  title: string;
  body: string;
  hasDocuments: boolean;
  rulesAccepted: boolean;
}

const emptyDraft: Draft = {
  company: null, tone: '', category: '', periodStart: '', periodEnd: '', relationship: '', title: '', body: '', hasDocuments: false, rulesAccepted: false,
};

// El borrador vive en sessionStorage: sobrevive a una recarga o a un error,
// pero se borra al cerrar la pestaña (más prudente en equipos compartidos).
function loadDraft(): Draft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? { ...emptyDraft, ...JSON.parse(raw) } : emptyDraft;
  } catch {
    return emptyDraft;
  }
}
function saveDraft(d: Draft) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* almacenamiento no disponible */ }
}
function clearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* almacenamiento no disponible */ }
}

export default function Share() {
  const { session, profile, loading } = useAuth();
  const [sent, setSent] = useState(false);

  if (notConfigured) return <div className="page py-10"><ConfigNotice /></div>;
  if (loading) return <div className="page py-10"><Loading /></div>;

  return (
    <div className="page py-10">
      <PageHeader title="Compartir una experiencia">
        Buena, mala o mixta: cuenta cómo es trabajar en una empresa. Se publica con un alias después de una revisión.
      </PageHeader>
      <div className="mt-8">
        {!session ? (
          <>
            {!sent && <div className="mb-10 grid gap-5 rounded-lg border border-line bg-mist p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div>
                <h2 className="font-sans text-base font-semibold">Puedes compartir sin crear una cuenta</h2>
                <p className="mt-1 max-w-prose text-sm leading-6 text-slate">
                  Con una cuenta podrás seguir tu experiencia: saber cuándo se publica, ver las reacciones y los comentarios de otras
                  personas, y editarla o apelar si hace falta. Tu correo nunca se muestra.
                </p>
              </div>
              <Link to="/cuenta?siguiente=/compartir" className="btn-secondary justify-self-start">Crear cuenta o iniciar sesión</Link>
            </div>}
            <ExperienceForm anonymous onSent={() => setSent(true)} />
          </>
        ) : profile?.status && profile.status !== 'activa' ? (
          <Alert tone="warning" title="Tu cuenta no puede publicar en este momento">
            {profile.status === 'suspendida' ? `Motivo: ${profile.suspended_reason ?? 'incumplimiento reiterado de las reglas.'}` : 'Hay una solicitud de eliminación pendiente. Puedes cancelarla desde Mi cuenta.'}
          </Alert>
        ) : !profile?.alias ? (
          <Alert tone="info" title="Elige primero tu alias público">
            <p>Es el nombre con el que se verán tus publicaciones. No puede parecerse a tu correo.</p>
            <Link to="/cuenta" className="btn-primary mt-3">Elegir alias</Link>
          </Alert>
        ) : (
          <ExperienceForm />
        )}
      </div>
    </div>
  );
}

const toneOptions: { value: Tone; label: string; hint: string }[] = [
  { value: 'positiva', label: 'Buena', hint: 'Algo que la empresa hace bien.' },
  { value: 'mixta', label: 'Mixta', hint: 'Tuvo cosas buenas y malas.' },
  { value: 'negativa', label: 'Mala', hint: 'Algo que no funcionó o te afectó.' },
];

/** Copia el enlace de seguimiento y confirma de forma accesible. */
function TrackingLink({ token }: { token: string }) {
  const url = `${window.location.origin}/seguimiento/${token}`;
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border-2 border-ink p-5">
      <p className="font-semibold">Tu enlace privado de seguimiento</p>
      <p className="mt-1 text-sm text-slate">Guárdalo: es la única forma de ver tu experiencia sin cuenta. No lo compartas.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input readOnly value={url} aria-label="Enlace de seguimiento" className="input font-mono text-sm" onFocus={(e) => e.currentTarget.select()} />
        <button
          type="button"
          className="btn-primary shrink-0"
          onClick={() => navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => setCopied(false))}
        >
          {copied ? 'Copiado' : 'Copiar enlace'}
        </button>
      </div>
      <p role="status" className="sr-only">{copied ? 'Enlace copiado' : ''}</p>
    </div>
  );
}

function ExperienceForm({ anonymous = false, onSent }: { anonymous?: boolean; onSent?: () => void }) {
  const [params] = useSearchParams();
  const editId = params.get('editar');
  const presetCompany = params.get('empresa');
  const [draft, setDraft] = useState<Draft>(() => (editId ? emptyDraft : loadDraft()));
  const [step, setStep] = useState<'form' | 'preview' | 'done'>('form');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<AppError | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ status: ExperienceStatus; token?: string } | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [editBlocked, setEditBlocked] = useState<string | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const startedAt = useRef(Date.now());
  const formTop = useRef<HTMLDivElement>(null);

  const categories = useAsync(() => listCategories(), []);

  // Edición de una experiencia propia (en revisión o con ajustes pedidos).
  useEffect(() => {
    if (!editId) return;
    listMyExperiences().then((mine) => {
      const e = mine.find((x) => x.id === editId);
      if (!e) return setEditBlocked('No encontramos esa experiencia en tu cuenta.');
      if (!['en_revision', 'requiere_ajustes'].includes(e.status)) return setEditBlocked('Solo puedes editar experiencias en revisión o con ajustes solicitados.');
      setDraft({
        company: { id: e.company_id, name: e.company_name },
        tone: e.tone,
        category: e.category_slug,
        periodStart: e.period_start.slice(0, 7),
        periodEnd: e.period_end?.slice(0, 7) ?? '',
        relationship: e.relationship as Draft['relationship'],
        title: e.title ?? '',
        body: e.body,
        hasDocuments: e.has_documents,
        rulesAccepted: true,
      });
    }).catch((err: AppError) => setEditBlocked(err.message));
  }, [editId]);

  useEffect(() => {
    if (!presetCompany || editId || draft.company) return;
    getCompanyById(presetCompany)
      .then((c) => c && setDraft((d) => ({ ...d, company: { id: c.id, name: c.trade_name, detail: `${c.sector}. ${c.city}, ${c.department}` } })))
      .catch(() => undefined);
  }, [presetCompany, editId, draft.company]);

  useEffect(() => {
    if (!editId && step !== 'done') saveDraft(draft);
  }, [draft, editId, step]);

  const flags = useMemo(() => detectPersonalData(`${draft.title} ${draft.body}`), [draft.title, draft.body]);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const categoryName = categories.data?.find((c) => c.slug === draft.category)?.name ?? '';

  function toInput(): unknown {
    return {
      companyId: draft.company?.id ?? '',
      tone: draft.tone || undefined,
      category: draft.category,
      periodStart: draft.periodStart,
      periodEnd: draft.periodEnd,
      relationship: draft.relationship || undefined,
      title: draft.title.trim(),
      body: draft.body,
      hasDocuments: draft.hasDocuments,
      rulesAccepted: draft.rulesAccepted,
    };
  }

  function review(e: React.FormEvent) {
    e.preventDefault();
    const parsed = experienceSchema.safeParse(toInput());
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      // Lleva el foco al primer campo con error.
      setTimeout(() => (document.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus(), 0);
      return;
    }
    setErrors({});
    setStep('preview');
    formTop.current?.scrollIntoView();
  }

  async function submit() {
    // Señales simples contra envíos automatizados; los límites reales están en la base de datos.
    if (honeypot.current?.value || Date.now() - startedAt.current < 4000) {
      setSubmitError({ kind: 'validation', message: 'Lo enviaste muy rápido. Espera unos segundos y vuelve a intentarlo.' } as AppError);
      return;
    }
    const parsed = experienceSchema.safeParse(toInput());
    if (!parsed.success) return setStep('form');
    setBusy(true);
    setSubmitError(null);
    try {
      const input = parsed.data as ExperienceInput;
      const saved = editId ? await updateMyExperience(editId, input) : anonymous ? await createAnonymousExperience(input) : await createExperience(input);
      setResult({ status: saved.status, token: 'token' in saved ? String(saved.token) : undefined });
      clearDraft();
      setStep('done');
      onSent?.();
    } catch (err) {
      setSubmitError(err as AppError);
    } finally {
      setBusy(false);
    }
  }

  if (editBlocked) return <Alert tone="warning" title="No se puede editar">{editBlocked} <Link to="/cuenta" className="btn-link">Volver a Mi cuenta</Link></Alert>;

  if (step === 'done' && result) {
    return (
      <div className="max-w-2xl space-y-6" role="status">
        <div>
          <h2 className="text-3xl">Gracias por compartir</h2>
          <p className="mt-2 text-slate">
            Tu experiencia está en revisión. La moderación comprueba que cumpla las reglas y, si necesita algún ajuste, te dirá qué cambiar.
          </p>
          <div className="mt-3"><StatusChip status={result.status} /></div>
        </div>
        {result.token ? (
          <>
            <TrackingLink token={result.token} />
            <div className="rounded-lg bg-mist p-5">
              <p className="font-semibold">¿Quieres enterarte de cómo reaccionan otras personas?</p>
              <p className="mt-1 text-sm leading-6 text-slate">
                Crea una cuenta y vincula esta experiencia desde tu enlace de seguimiento. Así la verás en Mi cuenta con sus reacciones y
                comentarios, y podrás editarla o apelar.
              </p>
              <Link to={`/cuenta?siguiente=/seguimiento/${result.token}`} className="btn-primary mt-4">Crear cuenta</Link>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Link to="/cuenta" className="btn-primary">Ver mis experiencias</Link>
            <Link to="/" className="btn-secondary">Volver al inicio</Link>
          </div>
        )}
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div ref={formTop} className="max-w-3xl">
        <h2 className="text-2xl">Revisa antes de enviar</h2>
        <p className="mt-2 text-slate">
          Así se verá si se publica{anonymous ? ', firmada como «Persona sin cuenta»' : ''}. Tu correo y tu cuenta no aparecen.
        </p>
        <article className="mt-6 rounded-lg border border-line p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate">
            {draft.tone && <ToneChip tone={draft.tone} />}
            <span>{relationshipLabel[draft.relationship]}</span>
            <span>{formatPeriod(`${draft.periodStart}-01`, draft.periodEnd ? `${draft.periodEnd}-01` : null)}</span>
          </div>
          <h3 className="mt-2 text-xl">{draft.title || categoryName}</h3>
          <p className="mt-1 text-sm"><span className="font-semibold">{draft.company?.name}</span>, {categoryName}</p>
          <p className="testimony mt-4">{draft.body.trim()}</p>
          {draft.hasDocuments && <p className="mt-4 text-sm text-slate">El autor indica que dispone de documentos</p>}
        </article>
        {flags.length > 0 && (
          <div className="mt-6">
            <Alert tone="warning" title="Revisa estos posibles datos personales">
              <ul className="list-disc pl-5">{flags.map((f) => <li key={f}>{personalDataMessages[f]}</li>)}</ul>
              <p className="mt-2">Puedes enviarla igualmente: el equipo de moderación la revisará con más atención y podría pedirte ajustes.</p>
            </Alert>
          </div>
        )}
        {submitError && <div className="mt-6"><Alert tone="error" title="No se envió">{submitError.message} Tu texto sigue guardado en esta pestaña.</Alert></div>}
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" disabled={busy} onClick={submit}>{busy ? 'Enviando…' : 'Enviar a revisión'}</button>
          <button type="button" className="btn-secondary" onClick={() => setStep('form')}>Seguir editando</button>
        </div>
      </div>
    );
  }

  const remaining = BODY_MIN - draft.body.trim().length;

  return (
    <div ref={formTop} className="grid gap-12 lg:grid-cols-[1fr_18rem]">
      <form onSubmit={review} noValidate className="max-w-2xl space-y-7">
        {/* Campo trampa para bots: oculto a personas y lectores de pantalla. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
          <label>Sitio web<input ref={honeypot} tabIndex={-1} autoComplete="off" name="website" /></label>
        </div>

        {editId && <Alert tone="info" title="Editando una experiencia">Al guardar los cambios volverá a la cola de revisión.</Alert>}

        <fieldset>
          <legend className="label">¿Cómo fue tu experiencia?</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {toneOptions.map((t) => (
              <label
                key={t.value}
                className={`flex cursor-pointer flex-col rounded-lg border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal ${
                  draft.tone === t.value ? 'border-ink bg-mist' : 'border-line hover:border-slate'
                }`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <input type="radio" name="tone" className="h-4 w-4 accent-teal" checked={draft.tone === t.value} onChange={() => set('tone', t.value)}
                    aria-labelledby={`tono-${t.value}`} aria-describedby={`tono-${t.value}-ayuda`} />
                  <span id={`tono-${t.value}`}>{t.label}</span>
                </span>
                <span id={`tono-${t.value}-ayuda`} className="mt-1 pl-6 text-sm text-slate">{t.hint}</span>
              </label>
            ))}
          </div>
          {errors.tone && <p className="field-error">{errors.tone}</p>}
        </fieldset>

        <div>
          <CompanyPicker label="Empresa" value={draft.company} onChange={(c) => set('company', c)} error={errors.companyId}
            hint="Revisa la ciudad y el sector para no confundirla con otra de nombre parecido." />
          {!draft.company && (
            <p className="mt-2 text-sm text-slate">
              ¿No aparece? <button type="button" className="btn-link" onClick={() => setSuggesting(true)}>Sugiere la empresa</button> y vuelve cuando el equipo la añada.
            </p>
          )}
        </div>

        <Field label="Categoría" error={errors.category}>
          {(p) => (
            <select {...p} className="input" value={draft.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Elige una categoría</option>
              {categories.data?.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          )}
        </Field>

        <fieldset>
          <legend className="label">¿Cuándo ocurrió? (periodo aproximado)</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Desde" error={errors.periodStart}>
              {(p) => <input {...p} type="month" min="1990-01" className="input" value={draft.periodStart} onChange={(e) => set('periodStart', e.target.value)} />}
            </Field>
            <Field label="Hasta" optional error={errors.periodEnd}>
              {(p) => <input {...p} type="month" min="1990-01" className="input" value={draft.periodEnd} onChange={(e) => set('periodEnd', e.target.value)} />}
            </Field>
          </div>
          <p className="hint">Solo se publica el mes y el año. Si prefieres más reserva, indica un periodo más amplio.</p>
        </fieldset>

        <fieldset>
          <legend className="label">Tu relación con la empresa</legend>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-6">
            {(['actual', 'anterior', 'prefiero_no_decir'] as const).map((r) => (
              <label key={r} className="flex items-center gap-2">
                <input type="radio" name="relationship" className="h-4 w-4 accent-teal" checked={draft.relationship === r} onChange={() => set('relationship', r)} />
                {r === 'actual' ? 'Trabajo allí' : r === 'anterior' ? 'Trabajé allí' : 'Prefiero no decirlo'}
              </label>
            ))}
          </div>
          {errors.relationship && <p className="field-error">{errors.relationship}</p>}
        </fieldset>

        <Field label="Título" optional error={errors.title} hint="Un resumen breve. Sin nombres de personas.">
          {(p) => <input {...p} className="input" maxLength={120} value={draft.title} onChange={(e) => set('title', e.target.value)} />}
        </Field>

        <Field
          label="Cuenta tu experiencia"
          error={errors.body}
          hint={
            <>
              Cuenta lo que viviste o viste. Si algo te lo contaron, dilo. No hace falta nombrar a jefes ni compañeros.{' '}
              <span className="tabular-nums">{remaining > 0 ? `Faltan ${remaining} caracteres para el mínimo.` : `${draft.body.trim().length} de ${BODY_MAX} caracteres.`}</span>
            </>
          }
        >
          {(p) => (
            <textarea
              {...p}
              className="input min-h-[260px] font-serif text-[1.0625rem] leading-7"
              maxLength={BODY_MAX}
              value={draft.body}
              onChange={(e) => set('body', e.target.value)}
              placeholder="Por ejemplo: cómo era el día a día, qué hacía bien o mal la empresa y cómo te afectó."
            />
          )}
        </Field>

        {flags.length > 0 && (
          <Alert tone="warning" title="Tu texto podría incluir datos personales">
            <ul className="list-disc pl-5">{flags.map((f) => <li key={f}>{personalDataMessages[f]}</li>)}</ul>
            <p className="mt-2">Quítalos si no son imprescindibles: protegen a otras personas y reducen el riesgo de que te identifiquen.</p>
          </Alert>
        )}

        <div className="space-y-4 rounded border border-line p-4">
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-teal" checked={draft.hasDocuments} onChange={(e) => set('hasDocuments', e.target.checked)} />
            <span>
              Dispongo de documentos que respaldan mi relato
              <span className="block text-sm text-slate">
                Por ahora no se pueden adjuntar archivos. No pegues en el texto contenido de documentos confidenciales ni datos de terceros.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-teal" checked={draft.rulesAccepted} aria-invalid={Boolean(errors.rulesAccepted)}
              onChange={(e) => set('rulesAccepted', e.target.checked)} />
            <span>
              Leí y acepto las <Link to="/politicas/reglas" target="_blank" className="btn-link">reglas de publicación</Link>
            </span>
          </label>
          {errors.rulesAccepted && <p className="field-error">{errors.rulesAccepted}</p>}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">Revisar antes de enviar</button>
          {!editId && (
            <button type="button" className="btn-secondary" onClick={() => { setDraft(emptyDraft); clearDraft(); setErrors({}); }}>
              Vaciar formulario
            </button>
          )}
        </div>
      </form>

      <aside className="space-y-6 text-sm text-slate lg:border-l lg:border-line lg:pl-8">
        <section>
          <h2 className="font-sans text-base font-semibold text-ink">Antes de escribir</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Cuenta hechos y cómo te afectaron. Tu opinión vale si la presentas como tal.</li>
            <li>Lo bueno también ayuda: dice qué esperar de un trabajo.</li>
            <li>No escribas nombres, teléfonos, cédulas ni correos de nadie.</li>
            <li>Si estás en riesgo, acude primero a las <Link to="/derechos" className="btn-link">autoridades</Link>.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-sans text-base font-semibold text-ink">Tu borrador</h2>
          <p className="mt-2">Se guarda en esta pestaña mientras escribes y se borra al cerrarla o al enviar.</p>
        </section>
      </aside>
      <SuggestCompanyDialog open={suggesting} onClose={() => setSuggesting(false)} />
    </div>
  );
}
