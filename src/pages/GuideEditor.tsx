// Editor de una guía de «Tus derechos», solo para administración. La base de
// datos impone los permisos: este panel solo los refleja.
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  addGuideSource, deleteGuideSource, getGuide, guideViews, setGuideCover, setGuideStatus, updateGuide, uploadGuideImage,
  type GuideDetail, type GuideStatus,
} from '../lib/adminApi';
import { listCategories } from '../lib/api';
import { prepareCoverImage } from '../lib/image';
import { formatDate, todayLocal } from '../lib/format';
import type { AppError } from '../lib/supabase';
import { GuideBody } from '../components/GuideBody';
import { Alert, ConfigNotice, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, Loading, notConfigured, useAsync } from '../components/ui';

const statusLabel: Record<GuideStatus, string> = {
  borrador: 'Borrador', pendiente_verificacion: 'Pendiente de verificación', publicado: 'Publicada', archivado: 'Archivada',
};

export default function GuideEditor() {
  const { id = '' } = useParams();
  const { isAdmin, loading } = useAuth();
  const guide = useAsync(() => (notConfigured || !isAdmin ? Promise.resolve(null) : getGuide(id)), [id, isAdmin]);

  if (notConfigured) return <div className="page py-10"><ConfigNotice /></div>;
  if (loading || (guide.loading && !guide.data)) return <div className="page py-10"><Loading /></div>;
  if (!isAdmin) return <div className="page py-10"><Alert tone="warning" title="Acceso restringido">Solo la administración puede editar guías.</Alert></div>;
  if (guide.error) return <div className="page py-10"><ErrorState error={guide.error} onRetry={guide.reload} /></div>;
  if (!guide.data) return <div className="page py-10"><EmptyState title="No encontramos esta guía" action={<Link to="/moderacion" className="btn-primary">Volver a Moderación</Link>} /></div>;
  // key por id: al recargar tras guardar no se vuelve a montar y el aviso de confirmación sigue visible.
  return <Editor key={guide.data.id} guide={guide.data} onSaved={guide.reload} />;
}

function Editor({ guide: g, onSaved }: { guide: GuideDetail; onSaved: () => void }) {
  const { session } = useAuth();
  const categories = useAsync(() => listCategories(), []);
  const [form, setForm] = useState({ title: g.title, summary: g.summary, content: g.content, category_slug: g.category_slug ?? '' });
  const [view, setView] = useState<'editar' | 'vista'>('editar');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<number | null>(null);
  const dirty = form.title !== g.title || form.summary !== g.summary || form.content !== g.content || form.category_slug !== (g.category_slug ?? '');
  const { views, lastViewAt } = guideViews(g.legal_resource_stats);

  // Evita perder cambios al cerrar o recargar la pestaña.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function validate() {
    const v: Record<string, string> = {};
    if (form.title.trim().length < 5 || form.title.trim().length > 160) v.title = 'El título debe tener entre 5 y 160 caracteres.';
    if (form.summary.trim().length < 20 || form.summary.trim().length > 400) v.summary = 'El resumen debe tener entre 20 y 400 caracteres.';
    if (form.content.trim().length < 50) v.content = 'El contenido debe tener al menos 50 caracteres.';
    setErrors(v);
    return !Object.keys(v).length;
  }

  async function save(): Promise<boolean> {
    if (!validate()) {
      setView('editar');
      return false;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await updateGuide(g.id, { title: form.title.trim(), summary: form.summary.trim(), content: form.content.trim(), category_slug: form.category_slug || null });
      return true;
    } catch (err) {
      setError((err as AppError).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: GuideStatus) {
    if (!session) return;
    if (dirty && !(await save())) return;
    setBusy(true);
    setError(null);
    try {
      await setGuideStatus(g.id, status, session.user.id);
      setPublishing(false);
      onSaved();
    } catch (err) {
      setError((err as AppError).message);
    } finally {
      setBusy(false);
    }
  }

  function insertImage(markdown: string) {
    const at = caret.current ?? form.content.length;
    const before = form.content.slice(0, at).replace(/\s*$/, '');
    const after = form.content.slice(at).replace(/^\s*/, '');
    setForm({ ...form, content: `${before}\n\n${markdown}\n\n${after}`.trim() });
    setImageOpen(false);
    setNotice('Imagen insertada. Guarda los cambios para conservarla.');
  }

  return (
    <div className="page py-10">
      <p className="text-sm text-slate"><Link to="/moderacion?tab=guias" className="hover:text-ink hover:underline">Volver a las guías</Link></p>
      <header className="mt-3 flex flex-wrap items-start justify-between gap-6 border-b border-ink/80 pb-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-medium sm:text-4xl">{form.title || 'Guía sin título'}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate">
            <span className="rounded-[3px] border border-line px-2 py-0.5 text-xs font-semibold text-ink">{statusLabel[g.status]}</span>
            {g.last_verified_at && <span>Verificada el {formatDate(g.last_verified_at)}</span>}
            <span>Actualizada el {formatDate(g.updated_at)}</span>
          </div>
        </div>
        <dl className="text-right">
          <dt className="text-sm text-slate">Visitas</dt>
          <dd className="font-serif text-3xl">{views.toLocaleString('es-CO')}</dd>
          {lastViewAt && <dd className="text-xs text-slate">Última el {formatDate(lastViewAt)}</dd>}
          {g.status !== 'publicado' && <dd className="text-xs text-slate">Solo cuentan las visitas a guías publicadas</dd>}
        </dl>
      </header>

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-6">
          <Field label="Título" error={errors.title}>
            {(p) => <input {...p} className="input text-lg" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />}
          </Field>
          <Field label="Resumen" error={errors.summary} hint={`Aparece en el listado de guías. ${form.summary.trim().length} de 400 caracteres.`}>
            {(p) => <textarea {...p} className="input min-h-[88px]" maxLength={400} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />}
          </Field>
          <Field label="Categoría" optional>
            {(p) => (
              <select {...p} className="input" value={form.category_slug} onChange={(e) => setForm({ ...form, category_slug: e.target.value })}>
                <option value="">Temas generales</option>
                {categories.data?.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            )}
          </Field>

          <section aria-labelledby="contenido-guia">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="contenido-guia" className="font-sans text-base font-semibold">Contenido</h2>
              <div role="tablist" aria-label="Modo del editor" className="flex gap-1 border-b border-line">
                {(['editar', 'vista'] as const).map((m) => (
                  <button key={m} type="button" role="tab" aria-selected={view === m}
                    className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${view === m ? 'border-teal text-teal-strong' : 'border-transparent text-slate hover:text-ink'}`}
                    onClick={() => setView(m)}>
                    {m === 'editar' ? 'Editar' : 'Vista previa'}
                  </button>
                ))}
              </div>
            </div>
            {view === 'editar' ? (
              <div className="mt-3">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <button type="button" className="btn-secondary" onClick={() => { caret.current = textarea.current?.selectionStart ?? null; setImageOpen(true); }}>
                    Insertar imagen
                  </button>
                  <p className="text-sm text-slate">Separa los bloques con una línea en blanco.</p>
                </div>
                <details className="mb-3 rounded border border-line bg-mist px-4 py-3 text-sm">
                  <summary className="cursor-pointer font-semibold text-ink">Guía de formato</summary>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[12rem_minmax(0,1fr)]">
                    <dt><code>## Título</code></dt><dd className="text-slate">Subtítulo de sección. Aparece en el índice «En esta guía».</dd>
                    <dt><code>### Título</code></dt><dd className="text-slate">Subtítulo menor dentro de una sección.</dd>
                    <dt><code>- texto</code></dt><dd className="text-slate">Lista con viñetas (una línea por punto).</dd>
                    <dt><code>1. texto</code></dt><dd className="text-slate">Lista numerada, para pasos en orden.</dd>
                    <dt><code>&gt; texto</code></dt><dd className="text-slate">Recuadro «Importante» para una advertencia o un dato clave.</dd>
                    <dt><code>**texto**</code></dt><dd className="text-slate">Negrita.</dd>
                    <dt><code>[texto](https://…)</code></dt><dd className="text-slate">Enlace a una fuente oficial. Solo se aceptan direcciones https.</dd>
                    <dt><code>[texto](/derechos/slug)</code></dt><dd className="text-slate">Enlace a otra guía de VozLaboral. Usa el slug que aparece en su dirección.</dd>
                  </dl>
                </details>
                <label htmlFor="guia-contenido" className="sr-only">Contenido de la guía</label>
                <textarea
                  id="guia-contenido"
                  ref={textarea}
                  aria-invalid={Boolean(errors.content)}
                  className="input min-h-[520px] font-sans text-[0.9375rem] leading-7"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
                {errors.content && <p className="field-error">{errors.content}</p>}
              </div>
            ) : (
              <div className="mt-6 rounded border border-line p-6 sm:p-8">
                <h2 className="text-3xl">{form.title}</h2>
                <p className="mt-3 max-w-prose text-lg text-slate">{form.summary}</p>
                <div className="mt-8"><GuideBody content={form.content} /></div>
              </div>
            )}
          </section>

          {error && <Alert tone="error">{error}</Alert>}
          {notice && <Alert tone="success">{notice}</Alert>}
          <div className="flex flex-wrap gap-3 border-t border-line pt-6">
            <button type="button" className="btn-primary" disabled={busy || !dirty} onClick={async () => { if (await save()) { setNotice('Cambios guardados.'); onSaved(); } }}>
              {busy ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {g.status !== 'publicado' && <button type="button" className="btn-secondary" disabled={busy} onClick={() => setPublishing(true)}>Publicar guía</button>}
            {g.status === 'publicado' && <Link to={`/derechos/${g.slug}`} className="btn-secondary">Ver publicada</Link>}
            {g.status === 'publicado' && <button type="button" className="btn-secondary" disabled={busy} onClick={() => changeStatus('pendiente_verificacion')}>Retirar para revisar</button>}
            {g.status !== 'archivado' && <button type="button" className="btn-secondary" disabled={busy} onClick={() => changeStatus('archivado')}>Archivar</button>}
          </div>
          {g.status === 'publicado' && dirty && <Alert tone="warning">Esta guía está publicada: los cambios serán visibles en cuanto los guardes.</Alert>}
        </div>

        <div className="space-y-10">
          <CoverPanel guide={g} onChange={onSaved} />
          <Sources guide={g} onChange={onSaved} />
        </div>
      </div>

      <ImageDialog open={imageOpen} slug={g.slug} onClose={() => setImageOpen(false)} onInsert={insertImage} />
      <ConfirmDialog open={publishing} onClose={() => setPublishing(false)} title="¿Publicar esta guía?" confirmLabel="Publicar guía" tone="primary" busy={busy}
        onConfirm={() => changeStatus('publicado')}>
        Confirma que un abogado revisó el contenido contra las fuentes oficiales citadas. {dirty && 'Antes se guardarán tus cambios. '}
        La guía será visible para cualquier persona en Tus derechos.
      </ConfirmDialog>
    </div>
  );
}

/** Imagen de portada: se ve en el listado de guías, en la portada y arriba de la guía. */
function CoverPanel({ guide: g, onChange }: { guide: GuideDetail; onChange: () => void }) {
  const [alt, setAlt] = useState(g.cover_alt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function run(task: () => Promise<void>, done: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await task();
      setNotice(done);
      onChange();
    } catch (err) {
      setError((err as AppError).message ?? 'No se pudo guardar la portada.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  function upload(file: File | undefined) {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Usa una imagen PNG, JPG o WebP.');
      return;
    }
    void run(async () => {
      const prepared = await prepareCoverImage(file);
      const url = await uploadGuideImage(g.slug, prepared);
      await setGuideCover(g.id, { url, alt }, g.cover_url);
    }, g.cover_url ? 'Portada reemplazada.' : 'Portada guardada.');
  }

  return (
    <section aria-labelledby="portada-guia">
      <h2 id="portada-guia" className="border-b border-ink/80 pb-3 font-sans text-base font-semibold">Imagen de portada</h2>
      <p className="mt-3 text-sm text-slate">
        Aparece en el listado de guías, en la portada del sitio y arriba de la guía. Se recorta en horizontal (1200 × 628) y se le quitan los
        metadatos.
      </p>
      <div className="mt-4 overflow-hidden rounded border border-line bg-mist">
        {g.cover_url ? (
          <img src={g.cover_url} alt="" className="block aspect-[1200/628] w-full object-cover" />
        ) : (
          <div className="flex aspect-[1200/628] items-center justify-center px-4 text-center text-sm text-slate">Sin portada</div>
        )}
      </div>
      <div className="mt-4">
        <Field label="Descripción de la imagen" optional hint="Para lectores de pantalla. Déjala vacía si la imagen es solo decorativa.">
          {(p) => <input {...p} className="input" value={alt} maxLength={200} onChange={(e) => setAlt(e.target.value)} />}
        </Field>
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" id={`portada-${g.id}`}
        onChange={(e) => upload(e.target.files?.[0])} disabled={busy} />
      <div className="mt-4 flex flex-wrap gap-2">
        <label htmlFor={`portada-${g.id}`} className={`btn-secondary cursor-pointer ${busy ? 'pointer-events-none opacity-60' : ''}`}>
          {busy ? 'Guardando…' : g.cover_url ? 'Cambiar imagen' : 'Subir imagen'}
        </label>
        {g.cover_url && alt.trim() !== g.cover_alt && (
          <button type="button" className="btn-secondary" disabled={busy}
            onClick={() => run(() => setGuideCover(g.id, { url: g.cover_url, alt }, g.cover_url), 'Descripción guardada.')}>
            Guardar descripción
          </button>
        )}
        {g.cover_url && (
          <button type="button" className="btn-secondary" disabled={busy}
            onClick={() => run(() => setGuideCover(g.id, { url: null, alt: '' }, g.cover_url).then(() => setAlt('')), 'Portada quitada.')}>
            Quitar
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-slate">PNG, JPG o WebP. No uses fotos de personas reconocibles ni documentos con datos personales.</p>
      {error && <div className="mt-3"><Alert tone="error">{error}</Alert></div>}
      {notice && <div className="mt-3"><Alert tone="success">{notice}</Alert></div>}
    </section>
  );
}

function ImageDialog({ open, slug, onClose, onInsert }: { open: boolean; slug: string; onClose: () => void; onInsert: (markdown: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setFile(null); setAlt(''); setErrors({}); setError(null); }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (!file) v.file = 'Elige una imagen.';
    if (alt.trim().length < 5) v.alt = 'Describe la imagen con al menos 5 caracteres: es lo que leen los lectores de pantalla.';
    setErrors(v);
    if (Object.keys(v).length || !file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadGuideImage(slug, file);
      onInsert(`![${alt.trim().replace(/[[\]]/g, '')}](${url})`);
    } catch (err) {
      setError((err as AppError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Insertar imagen">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Imagen" error={errors.file} hint="PNG, JPG o WebP de hasta 2 MB. No uses documentos con datos personales.">
          {(p) => <input {...p} type="file" accept="image/png,image/jpeg,image/webp" className="block w-full text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />}
        </Field>
        <Field label="Descripción de la imagen" error={errors.alt}>
          {(p) => <input {...p} className="input" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={200} />}
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Subiendo…' : 'Subir e insertar'}</button>
        </div>
      </form>
    </Dialog>
  );
}

function Sources({ guide: g, onChange }: { guide: GuideDetail; onChange: () => void }) {
  const today = todayLocal();
  const empty = { label: '', publisher: 'Secretaría General del Senado de la República', url: '', accessed_at: today };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (form.label.trim().length < 3 || form.publisher.trim().length < 2 || !/^https?:\/\/\S+$/.test(form.url.trim())) {
      return setError('Completa el nombre de la fuente, quién la publica y una dirección que empiece por http:// o https://');
    }
    setBusy(true);
    setError(null);
    try {
      await addGuideSource(g.id, { label: form.label.trim(), publisher: form.publisher.trim(), url: form.url.trim(), accessed_at: form.accessed_at });
      setForm(empty);
      onChange();
    } catch (err) {
      setError((err as AppError).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await deleteGuideSource(id);
      setRemoving(null);
      onChange();
    } catch (err) {
      setError((err as AppError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside aria-labelledby="fuentes" className="space-y-5 lg:border-l lg:border-line lg:pl-8">
      <h2 id="fuentes" className="border-b border-ink/80 pb-3 font-sans text-base font-semibold">Fuentes oficiales</h2>
      {g.legal_resource_sources.length === 0 ? (
        <p className="text-sm text-slate">Sin fuentes. Una guía no se puede publicar sin al menos una.</p>
      ) : (
        <ul className="space-y-4 text-sm">
          {g.legal_resource_sources.map((s) => (
            <li key={s.id} className="border-b border-line pb-4">
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn-link">{s.label}</a>
              <span className="block text-slate">{s.publisher}. Consultada el {formatDate(s.accessed_at)}</span>
              <button type="button" className="mt-1 text-danger underline-offset-4 hover:underline" onClick={() => setRemoving(s.id)}>Quitar</button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} noValidate className="space-y-3 rounded bg-mist p-4">
        <p className="text-sm font-semibold">Añadir fuente</p>
        <Field label="Nombre">{(p) => <input {...p} className="input" placeholder="Código Sustantivo del Trabajo, art. 57" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />}</Field>
        <Field label="Publicada por">{(p) => <input {...p} className="input" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />}</Field>
        <Field label="Dirección">{(p) => <input {...p} type="url" className="input" placeholder="http://www.secretariasenado.gov.co/…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />}</Field>
        <Field label="Fecha de consulta">{(p) => <input {...p} type="date" className="input" max={today} value={form.accessed_at} onChange={(e) => setForm({ ...form, accessed_at: e.target.value })} />}</Field>
        {error && <Alert tone="error">{error}</Alert>}
        <button type="submit" className="btn-secondary w-full" disabled={busy}>Añadir fuente</button>
      </form>
      <ConfirmDialog open={removing !== null} onClose={() => setRemoving(null)} title="¿Quitar esta fuente?" confirmLabel="Quitar fuente" busy={busy}
        onConfirm={() => removing && remove(removing)}>
        La guía dejará de citarla. Si es la única fuente de una guía publicada, retírala antes para revisión.
      </ConfirmDialog>
    </aside>
  );
}
