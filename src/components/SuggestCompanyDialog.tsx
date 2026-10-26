import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { suggestCompany } from '../lib/api';
import type { AppError } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Alert, Dialog, Field } from './ui';

export function SuggestCompanyDialog({ open, onClose, initialName = '' }: { open: boolean; onClose: () => void; initialName?: string }) {
  const { session } = useAuth();
  const [form, setForm] = useState({ tradeName: initialName, city: '', department: '', website: '', note: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    if (open) {
      setDone(false);
      setError(null);
      setForm((f) => ({ ...f, tradeName: f.tradeName || initialName }));
    }
  }, [open, initialName]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.tradeName.trim().length < 2) next.tradeName = 'Escribe el nombre de la empresa.';
    if (form.city.trim().length < 2) next.city = 'Escribe la ciudad.';
    if (form.website && !/^https?:\/\/\S+$/.test(form.website.trim())) next.website = 'Escribe la dirección completa, empezando por https://';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setError(null);
    try {
      await suggestCompany({ ...form, tradeName: form.tradeName.trim(), city: form.city.trim(), website: form.website.trim() });
      setDone(true);
    } catch (err) {
      setError(err as AppError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Sugerir una empresa">
      {!session ? (
        <p className="text-slate">
          Necesitas una cuenta para sugerir empresas. <Link to="/cuenta" className="btn-link">Inicia sesión o crea una cuenta</Link>.
        </p>
      ) : done ? (
        <div className="space-y-4">
          <Alert tone="success" title="Sugerencia enviada">
            El equipo comprobará los datos antes de crear el perfil. Así evitamos duplicados y atribuir experiencias a la empresa equivocada.
          </Alert>
          <button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Nombre de la empresa" error={errors.tradeName}>
            {(p) => <input {...p} className="input" value={form.tradeName} onChange={(e) => setForm({ ...form, tradeName: e.target.value })} />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ciudad" error={errors.city}>
              {(p) => <input {...p} className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />}
            </Field>
            <Field label="Departamento" optional>
              {(p) => <input {...p} className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />}
            </Field>
          </div>
          <Field label="Sitio web oficial" optional error={errors.website}>
            {(p) => <input {...p} type="url" className="input" placeholder="https://" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />}
          </Field>
          <Field label="Nota para el equipo" optional hint="Por ejemplo, otros nombres con los que se conoce. No incluyas datos de personas.">
            {(p) => <textarea {...p} className="input min-h-[80px]" maxLength={500} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />}
          </Field>
          {error && <Alert tone="error">{error.message}</Alert>}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Enviando…' : 'Enviar sugerencia'}</button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
