import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { getCompanyProfile, submitClaim } from '../lib/api';
import { claimSchema, fieldErrors } from '../lib/schemas';
import type { AppError } from '../lib/supabase';
import { Alert, ConfigNotice, EmptyState, ErrorState, Field, Loading, notConfigured, PageHeader, useAsync } from '../components/ui';

const claimTypes = [
  { value: 'error_verificable', label: 'Un dato verificable es incorrecto', hint: 'Por ejemplo, una fecha o un hecho que puedes demostrar.' },
  { value: 'datos_privados', label: 'Se publicó información privada', hint: 'Datos personales de alguien o información confidencial.' },
  { value: 'datos_empresa', label: 'Los datos del perfil de la empresa son incorrectos', hint: 'Nombre, ciudad, sector o sitio web.' },
  { value: 'desacuerdo_opinion', label: 'No estamos de acuerdo con una opinión', hint: 'Puedes publicar una respuesta. Las opiniones legítimas no se retiran.' },
  { value: 'otro', label: 'Otro motivo', hint: '' },
];
const actions = [
  { value: 'correccion', label: 'Corregir un dato' },
  { value: 'revision', label: 'Revisar una publicación' },
  { value: 'retiro_datos_privados', label: 'Retirar información privada' },
  { value: 'respuesta_publica', label: 'Publicar una respuesta de la empresa' },
];

export default function Claim() {
  const { slug = '' } = useParams();
  const { session } = useAuth();
  const company = useAsync(() => (notConfigured ? Promise.resolve(null) : getCompanyProfile(slug)), [slug]);
  const [form, setForm] = useState({ claimantName: '', claimantRole: '', contactEmail: '', claimType: '', requestedAction: '', description: '', experienceRef: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<AppError | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (notConfigured) return <div className="page py-10"><ConfigNotice /></div>;
  if (company.loading) return <div className="page py-10"><Loading /></div>;
  if (company.error) return <div className="page py-10"><ErrorState error={company.error} onRetry={company.reload} /></div>;
  if (!company.data) return <div className="page py-10"><EmptyState title="No encontramos esta empresa" /></div>;
  const c = company.data.company;

  const experienceId = /[0-9a-f-]{36}/i.exec(form.experienceRef)?.[0] ?? null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = claimSchema.safeParse(form);
    const errs = parsed.success ? {} : fieldErrors(parsed.error);
    if (form.experienceRef && !experienceId) errs.experienceRef = 'Pega el enlace completo de la publicación o déjalo vacío.';
    setErrors(errs);
    if (!parsed.success || Object.keys(errs).length) return;
    setBusy(true);
    setError(null);
    try {
      await submitClaim({ ...parsed.data, companyId: c.id, experienceId });
      setDone(true);
    } catch (err) {
      setError(err as AppError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page py-10">
      <PageHeader title={`Solicitar una corrección sobre ${c.trade_name}`}>
        Para representantes de la empresa. Revisamos cada solicitud con un procedimiento proporcional a lo que se pide.
      </PageHeader>
      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_20rem]">
        <div className="max-w-2xl">
          {!session ? (
            <Alert tone="info" title="Necesitas una cuenta">
              <p>Así podrás consultar el estado de tu solicitud.</p>
              <Link to={`/cuenta?siguiente=/empresas/${c.slug}/reclamacion`} className="btn-primary mt-3">Iniciar sesión o crear una cuenta</Link>
            </Alert>
          ) : done ? (
            <div className="space-y-4">
              <Alert tone="success" title="Solicitud enviada">Puedes seguir su estado en Mi cuenta. Te escribiremos al correo de contacto si necesitamos más información.</Alert>
              <Link to={`/empresas/${c.slug}`} className="btn-secondary">Volver al perfil</Link>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tu nombre" error={errors.claimantName}>
                  {(p) => <input {...p} className="input" autoComplete="name" value={form.claimantName} onChange={(e) => setForm({ ...form, claimantName: e.target.value })} />}
                </Field>
                <Field label="Cargo o relación con la empresa" error={errors.claimantRole}>
                  {(p) => <input {...p} className="input" value={form.claimantRole} onChange={(e) => setForm({ ...form, claimantRole: e.target.value })} />}
                </Field>
              </div>
              <Field label="Correo de contacto" error={errors.contactEmail} hint="Preferiblemente del dominio de la empresa. Solo lo ve el equipo de moderación.">
                {(p) => <input {...p} type="email" className="input" autoComplete="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />}
              </Field>
              <fieldset>
                <legend className="label">¿Qué ocurre?</legend>
                <div className="mt-2 space-y-3">
                  {claimTypes.map((t) => (
                    <label key={t.value} className="flex items-start gap-3">
                      <input type="radio" name="claimType" className="mt-1 h-4 w-4 accent-teal" checked={form.claimType === t.value} onChange={() => setForm({ ...form, claimType: t.value })} />
                      <span>{t.label}{t.hint && <span className="block text-sm text-slate">{t.hint}</span>}</span>
                    </label>
                  ))}
                </div>
                {errors.claimType && <p className="field-error">{errors.claimType}</p>}
              </fieldset>
              <Field label="¿Qué solicitas?" error={errors.requestedAction}>
                {(p) => (
                  <select {...p} className="input" value={form.requestedAction} onChange={(e) => setForm({ ...form, requestedAction: e.target.value })}>
                    <option value="">Elige una opción</option>
                    {actions.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                )}
              </Field>
              <Field label="Enlace o identificador de la publicación" optional error={errors.experienceRef}>
                {(p) => <input {...p} className="input" value={form.experienceRef} onChange={(e) => setForm({ ...form, experienceRef: e.target.value })} />}
              </Field>
              <Field label="Explicación" error={errors.description} hint="Indica qué dato consideras incorrecto y la información que lo respalda.">
                {(p) => <textarea {...p} className="input min-h-[180px]" maxLength={4000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}
              </Field>
              {error && <Alert tone="error">{error.message}</Alert>}
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Enviando…' : 'Enviar solicitud'}</button>
            </form>
          )}
        </div>
        <aside className="space-y-4 text-sm text-slate lg:border-l lg:border-line lg:pl-8">
          <h2 className="font-sans text-base font-semibold text-ink">Cómo tratamos las solicitudes</h2>
          <p>Distinguimos entre corregir un error verificable, retirar información privada y discrepar de una opinión legítima.</p>
          <p>Ninguna solicitud revela la identidad de quien escribió una experiencia. La plataforma no acepta pagos para retirar contenido.</p>
          <p>Mientras estudiamos una solicitud, la publicación puede aparecer marcada como «En disputa».</p>
        </aside>
      </div>
    </div>
  );
}
