import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { createClaim } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { claimSchema, fieldErrors } from '../shared/schemas';
import { Dialog } from './Dialog';
import { SelectField, TextArea, TextField } from './Field';
import { Notice } from './States';
import { useToast } from './Toast';

// Solicitud de corrección o de representación de una empresa. La reclamación
// nunca da acceso a la identidad de quien publicó.
export function ClaimButton({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
        Pedir una corrección
      </button>
      <ClaimDialog open={open} onClose={() => setOpen(false)} companyId={companyId} companyName={companyName} />
    </>
  );
}

function ClaimDialog({
  open,
  onClose,
  companyId,
  companyName,
}: {
  open: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
}) {
  const { session } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    claimType: 'correccion' as 'correccion' | 'representacion',
    claimantName: '',
    claimantPosition: '',
    contactEmail: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = claimSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    setSubmitError(null);
    try {
      await createClaim({ ...parsed.data, claimantId: session!.user.id, companyId });
      toast.show('Solicitud enviada a revisión');
      onClose();
    } catch (err) {
      setSubmitError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} title={`Solicitud sobre ${companyName}`} onClose={onClose}>
      {!session ? (
        <div>
          <p>Para enviar una solicitud necesitas una cuenta.</p>
          <Link className="btn-primary mt-4" to="/cuenta/ingresar">Ingresar</Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <p className="text-muted">
            La moderación revisa cada solicitud. No compartimos la identidad de quienes publican.
          </p>
          <SelectField
            label="Tipo de solicitud"
            value={form.claimType}
            onChange={(e) => setForm({ ...form, claimType: e.target.value as typeof form.claimType })}
          >
            <option value="correccion">Corregir datos de la empresa o de una experiencia</option>
            <option value="representacion">Represento a la empresa y quiero responder</option>
          </SelectField>
          <TextField label="Tu nombre" value={form.claimantName} autoComplete="name"
            onChange={(e) => setForm({ ...form, claimantName: e.target.value })} error={errors.claimantName} />
          <TextField label="Tu cargo o relación con la empresa" value={form.claimantPosition}
            onChange={(e) => setForm({ ...form, claimantPosition: e.target.value })} error={errors.claimantPosition} />
          <TextField label="Correo de contacto" type="email" value={form.contactEmail} autoComplete="email"
            hint="Para representación, usa un correo corporativo."
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} error={errors.contactEmail} />
          <TextArea label="Qué necesitas" value={form.message} className="input min-h-28"
            onChange={(e) => setForm({ ...form, message: e.target.value })} error={errors.message} />
          {submitError && <Notice tone="danger" role="alert">{submitError}</Notice>}
          <button type="submit" className="btn-primary" disabled={busy} aria-busy={busy}>
            {busy ? 'Enviando…' : 'Enviar a revisión'}
          </button>
        </form>
      )}
    </Dialog>
  );
}
