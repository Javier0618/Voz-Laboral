import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Checkbox, SelectField, TextArea, TextField } from '../../components/Field';
import { Notice } from '../../components/States';
import { clearDraft, loadDraft, saveDraft } from '../../lib/draft';
import { friendlyError } from '../../lib/errors';
import { formatPeriod, monthToDate } from '../../lib/format';
import { detectSensitiveData, sensitiveLabels } from '../../lib/sensitive';
import {
  MAX_ACCOUNT,
  MIN_ACCOUNT,
  relationshipLabels,
  relationships,
  type Category,
  type Company,
  type Relationship,
} from '../../shared/domain';
import { experienceSchema, fieldErrors } from '../../shared/schemas';
import { CompanyPicker, type PickedCompany } from './CompanyPicker';

export interface ShareDraft {
  company: PickedCompany | null;
  categoryId: string;
  periodStart: string;
  periodEnd: string;
  relationship: Relationship | '';
  title: string;
  accountDirect: string;
  accountThirdParty: string;
  hasDocuments: boolean;
  acceptRules: boolean;
}

const EMPTY: ShareDraft = {
  company: null,
  categoryId: '',
  periodStart: '',
  periodEnd: '',
  relationship: '',
  title: '',
  accountDirect: '',
  accountThirdParty: '',
  hasDocuments: false,
  acceptRules: false,
};

export interface SubmitPayload {
  companyId: string;
  categoryId: number;
  periodStart: string;
  periodEnd: string | null;
  relationship: Relationship;
  title: string | null;
  accountDirect: string;
  accountThirdParty: string | null;
  hasDocuments: boolean;
}

export function ShareForm({
  userId,
  alias,
  categories,
  initialCompany,
  searchCompanies,
  proposeCompany,
  onSubmit,
  onSuccess,
}: {
  userId: string;
  alias: string;
  categories: Category[];
  initialCompany?: PickedCompany | null;
  searchCompanies: (q: string) => Promise<Company[]>;
  proposeCompany: (name: string, city: string, sector: string) => Promise<string>;
  onSubmit: (payload: SubmitPayload) => Promise<void>;
  onSuccess: () => void;
}) {
  const [draft, setDraft] = useState<ShareDraft>(() => {
    const saved = loadDraft<ShareDraft>(userId);
    const base = saved ? { ...EMPTY, ...saved } : EMPTY;
    return initialCompany && !base.company ? { ...base, company: initialCompany } : base;
  });
  const [restored] = useState(() => loadDraft<ShareDraft>(userId) !== null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveDraft(userId, draft);
  }, [userId, draft]);

  useEffect(() => {
    if (mode === 'preview') headingRef.current?.focus();
  }, [mode]);

  const set = <K extends keyof ShareDraft>(key: K, value: ShareDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const total = draft.accountDirect.length + draft.accountThirdParty.length;
  const sensitive = detectSensitiveData(`${draft.title}\n${draft.accountDirect}\n${draft.accountThirdParty}`);
  const categoryName = categories.find((c) => String(c.id) === draft.categoryId)?.name ?? '';

  function validate() {
    const parsed = experienceSchema.safeParse({
      companyId: draft.company?.id ?? '',
      categoryId: draft.categoryId || 0,
      periodStart: draft.periodStart,
      periodEnd: draft.periodEnd,
      relationship: draft.relationship,
      title: draft.title,
      accountDirect: draft.accountDirect,
      accountThirdParty: draft.accountThirdParty,
      hasDocuments: draft.hasDocuments,
      acceptRules: draft.acceptRules,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      requestAnimationFrame(() => errorRef.current?.focus());
      return null;
    }
    setErrors({});
    return parsed.data;
  }

  async function send() {
    const data = validate();
    if (!data) {
      setMode('edit');
      return;
    }
    setBusy(true);
    setSubmitError(null);
    try {
      await onSubmit({
        companyId: data.companyId,
        categoryId: data.categoryId,
        periodStart: monthToDate(data.periodStart),
        periodEnd: data.periodEnd ? monthToDate(data.periodEnd) : null,
        relationship: data.relationship,
        title: data.title || null,
        accountDirect: data.accountDirect.trim(),
        accountThirdParty: data.accountThirdParty.trim() || null,
        hasDocuments: data.hasDocuments,
      });
      // Solo se borra el borrador cuando el servidor confirmó el envío.
      clearDraft(userId);
      onSuccess();
    } catch (err) {
      setSubmitError(friendlyError(err));
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setBusy(false);
    }
  }

  const errorList = Object.values(errors);

  if (mode === 'preview') {
    return (
      <section aria-labelledby="vista-previa" className="py-6">
        <h2 id="vista-previa" ref={headingRef} tabIndex={-1} className="text-3xl outline-none">
          Vista previa
        </h2>
        <p className="mt-1 text-muted">Así se verá si la moderación la publica. Nadie la ve mientras está en revisión.</p>
        <article className="mt-4 rounded-md border border-line p-5">
          <p className="text-sm text-muted">
            {categoryName} · {formatPeriod(monthToDate(draft.periodStart), draft.periodEnd ? monthToDate(draft.periodEnd) : null)}
            {draft.relationship && ` · ${relationshipLabels[draft.relationship]}`}
          </p>
          <h3 className="mt-2 text-2xl">{draft.title || `Experiencia en ${draft.company?.name}`}</h3>
          <p className="mt-1 font-medium">{draft.company?.name}</p>
          <div className="prose-reading mt-3 space-y-3">
            <p className="whitespace-pre-line">{draft.accountDirect}</p>
            {draft.accountThirdParty && (
              <div className="border-l-2 border-line pl-4">
                <p className="font-sans text-sm font-medium text-muted">Lo que conoce por terceros</p>
                <p className="whitespace-pre-line">{draft.accountThirdParty}</p>
              </div>
            )}
          </div>
          <p className="mt-3 text-sm text-muted">
            Publicada por <span className="font-medium text-ink">{alias}</span>
          </p>
        </article>
        {sensitive.length > 0 && (
          <div className="mt-4">
            <Notice tone="warning" title="Revisa los datos personales">
              Parece que el texto incluye {sensitive.map((k) => sensitiveLabels[k]).join(', ')}. La moderación lo
              retirará antes de publicar.
            </Notice>
          </div>
        )}
        <div ref={errorRef} tabIndex={-1} className="mt-4 outline-none">
          {submitError && (
            <Notice tone="danger" role="alert" title="No se pudo enviar">
              {submitError} Tu borrador sigue guardado en este navegador.
            </Notice>
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={send} disabled={busy} aria-busy={busy}>
            {busy ? 'Enviando…' : 'Enviar a revisión'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setMode('edit')} disabled={busy}>
            Volver a editar
          </button>
        </div>
      </section>
    );
  }

  return (
    <form
      noValidate
      className="space-y-6 py-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (validate()) setMode('preview');
      }}
    >
      {restored && (
        <Notice tone="info">
          Recuperamos tu borrador guardado en este navegador.{' '}
          <button
            type="button"
            className="btn-link"
            onClick={() => {
              clearDraft(userId);
              setDraft({ ...EMPTY, company: initialCompany ?? null });
            }}
          >
            Empezar de cero
          </button>
        </Notice>
      )}

      <div ref={errorRef} tabIndex={-1} className="outline-none">
        {errorList.length > 0 && (
          <Notice tone="danger" role="alert" title="Revisa estos campos">
            <ul className="list-disc pl-5">
              {errorList.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </Notice>
        )}
      </div>

      <CompanyPicker
        value={draft.company}
        onChange={(c) => set('company', c)}
        error={errors.companyId}
        search={searchCompanies}
        propose={proposeCompany}
      />

      <SelectField label="Categoría" value={draft.categoryId} error={errors.categoryId}
        onChange={(e) => set('categoryId', e.target.value)}>
        <option value="">Elige una categoría</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </SelectField>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Desde" type="month" value={draft.periodStart} error={errors.periodStart}
          hint="Mes y año aproximados" onChange={(e) => set('periodStart', e.target.value)} />
        <TextField label="Hasta" type="month" optional value={draft.periodEnd} error={errors.periodEnd}
          hint="Déjalo vacío si fue un solo mes o sigue ocurriendo" onChange={(e) => set('periodEnd', e.target.value)} />
      </div>

      <fieldset>
        <legend className="field-label">Tu relación con la empresa</legend>
        <div className="space-y-2">
          {relationships.map((r) => (
            <label key={r} className="flex min-h-11 items-center gap-3">
              <input
                type="radio"
                name="relationship"
                value={r}
                checked={draft.relationship === r}
                onChange={() => set('relationship', r)}
                className="h-5 w-5 accent-action"
              />
              {relationshipLabels[r]}
            </label>
          ))}
        </div>
        {errors.relationship && <p className="field-error">{errors.relationship}</p>}
      </fieldset>

      <TextField label="Título" optional value={draft.title} error={errors.title} maxLength={120}
        onChange={(e) => set('title', e.target.value)} />

      <TextArea
        label="Lo que viste o viviste directamente"
        value={draft.accountDirect}
        error={errors.accountDirect}
        onChange={(e) => set('accountDirect', e.target.value)}
        hint="Describe hechos: qué pasó, cuándo y cómo te afectó. No nombres a personas ni incluyas datos de contacto."
      />
      <TextArea
        label="Lo que conoces por terceros"
        optional
        value={draft.accountThirdParty}
        onChange={(e) => set('accountThirdParty', e.target.value)}
        hint="Lo que te contaron otras personas. Se mostrará separado de tu relato directo."
      />
      <p className={total > MAX_ACCOUNT ? 'field-error' : 'text-sm text-muted'} aria-live="polite">
        {total.toLocaleString('es-CO')} de {MIN_ACCOUNT}–{MAX_ACCOUNT.toLocaleString('es-CO')} caracteres
      </p>

      {sensitive.length > 0 && (
        <Notice tone="warning" title="Parece que hay datos personales" role="status">
          El texto parece incluir {sensitive.map((k) => sensitiveLabels[k]).join(', ')}. Quítalo para proteger tu
          identidad y la de otras personas.
        </Notice>
      )}

      <Checkbox
        label="Dispongo de documentos que respaldan lo que cuento"
        checked={draft.hasDocuments}
        onChange={(e) => set('hasDocuments', e.target.checked)}
        hint="Por ahora no se pueden adjuntar archivos. Guárdalos; la moderación podría pedírtelos más adelante."
      />
      <Checkbox
        label="Acepto las reglas de publicación"
        checked={draft.acceptRules}
        error={errors.acceptRules}
        onChange={(e) => set('acceptRules', e.target.checked)}
        hint={<>Lee las <Link to="/reglas">reglas</Link> antes de continuar.</>}
      />

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary">Ver vista previa</button>
      </div>
    </form>
  );
}
