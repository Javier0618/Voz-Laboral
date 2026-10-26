import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { reportContent } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { reportReasonLabels, reportReasons, type ReportReason } from '../shared/domain';
import { fieldErrors, reportSchema } from '../shared/schemas';
import { Dialog } from './Dialog';
import { SelectField, TextArea } from './Field';
import { Notice } from './States';
import { useToast } from './Toast';

export function ReportButton({ experienceId, responseId }: { experienceId?: string; responseId?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn-link text-sm" onClick={() => setOpen(true)}>
        Reportar
      </button>
      <ReportDialog open={open} onClose={() => setOpen(false)} experienceId={experienceId} responseId={responseId} />
    </>
  );
}

function ReportDialog({
  open,
  onClose,
  experienceId,
  responseId,
}: {
  open: boolean;
  onClose: () => void;
  experienceId?: string;
  responseId?: string;
}) {
  const { session } = useAuth();
  const toast = useToast();
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = reportSchema.safeParse({ reason, details });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    setSubmitError(null);
    try {
      await reportContent({
        reporterId: session!.user.id,
        experienceId,
        responseId,
        reason: parsed.data.reason,
        details: parsed.data.details,
      });
      toast.show('Reporte enviado a revisión');
      setReason('');
      setDetails('');
      onClose();
    } catch (err) {
      setSubmitError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} title="Reportar contenido" onClose={onClose}>
      {!session ? (
        <div>
          <p>Para reportar necesitas una cuenta. Así evitamos reportes automáticos.</p>
          <Link className="btn-primary mt-4" to="/cuenta/ingresar">
            Ingresar
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <SelectField
            label="Motivo"
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            error={errors.reason}
            required
          >
            <option value="">Elige un motivo</option>
            {reportReasons.map((r) => (
              <option key={r} value={r}>
                {reportReasonLabels[r]}
              </option>
            ))}
          </SelectField>
          <TextArea
            label="Detalles"
            optional
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            error={errors.details}
            hint="No incluyas datos personales tuyos ni de otras personas."
            className="input min-h-24"
          />
          {submitError && <Notice tone="danger" role="alert">{submitError}</Notice>}
          <button type="submit" className="btn-primary" disabled={busy} aria-busy={busy}>
            {busy ? 'Enviando…' : 'Enviar reporte'}
          </button>
        </form>
      )}
    </Dialog>
  );
}
