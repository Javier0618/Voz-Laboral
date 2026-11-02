/** Mi cuenta → Mis nóminas: lo guardado en las calculadoras, período por período. */
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  deletePayrollRecord, listPayrollRecords, PAYROLL_CALCULATORS, periodLabel, readDraft, type PayrollRecord,
} from '../lib/payroll';
import { ConfirmDialog, EmptyState, Loading, useAsync } from './ui';

// Formato propio: importar el de components/nomina metería el motor de nómina en el paquete principal.
const pesos = (n: number) => `${n < 0 ? '−' : ''}$${Math.abs(Math.round(n)).toLocaleString('es-CO')}`;

const CALCULADORAS_CON_GUARDADO = Object.values(PAYROLL_CALCULATORS);

export function MyPayrolls() {
  const { data, loading, error, reload } = useAsync(() => listPayrollRecords(), []);
  const [borrando, setBorrando] = useState<PayrollRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const draft = readDraft();
  const { hash } = useLocation();

  // Desde «Mis nóminas» en una calculadora: lleva a esta sección cuando cargue.
  useEffect(() => {
    if (hash === '#mis-nominas' && !loading) document.getElementById('mis-nominas')?.scrollIntoView();
  }, [hash, loading]);

  // Sin la migración 2500 la sección no aparece: el resto de la cuenta funciona igual.
  if (error) return null;

  const max = Math.max(1, ...(data ?? []).map((r) => r.net_estimate));
  const enlace = (r: Pick<PayrollRecord, 'calculator' | 'period_key'>) => `${PAYROLL_CALCULATORS[r.calculator].path}?periodo=${r.period_key}`;

  return (
    <section aria-labelledby="mis-nominas-titulo" id="mis-nominas" className="scroll-mt-24">
      <h2 id="mis-nominas-titulo" className="text-2xl">Mis nóminas</h2>
      <p className="mt-2 max-w-prose text-slate">
        Lo que anotas en las calculadoras de nómina se guarda solo, por período. Aquí ves cuánto te debería llegar en cada uno: compáralo con tu
        desprendible. Es un cálculo orientativo; solo tú lo ves.
      </p>
      {draft && (
        <p className="mt-4 rounded border border-teal/40 bg-teal/5 px-4 py-3 text-sm">
          Tienes datos anotados de {periodLabel(draft.period_key).toLowerCase()} que aún no se guardan.{' '}
          <Link to={enlace(draft)} className="font-semibold underline">Volver a la calculadora para guardarlos</Link>
        </p>
      )}
      <div className="mt-6">
        {loading ? <Loading /> : !data?.length ? (
          <EmptyState title="Aún no tienes nóminas guardadas" action={<Link to="/calculadoras/operativos" className="btn-primary">Anotar mis turnos</Link>}>
            Abre una de estas calculadoras con tu sesión iniciada y anota tus días: {CALCULADORAS_CON_GUARDADO.map((c) => c.name.toLowerCase()).join(', ')}.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {data.map((r) => (
              <li key={`${r.calculator}-${r.period_key}`} className="grid gap-x-6 gap-y-2 py-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] sm:items-center">
                <div>
                  <p className="font-semibold">{periodLabel(r.period_key)}</p>
                  <p className="text-sm text-slate">
                    {PAYROLL_CALCULATORS[r.calculator].name}
                    {r.worked_days > 0 && ` · ${r.worked_days} ${r.worked_days === 1 ? 'día' : 'días'}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-mist" aria-hidden="true">
                    <div className="h-full rounded-full bg-teal" style={{ width: `${Math.max(2, (r.net_estimate / max) * 100)}%` }} />
                  </div>
                  <span className="w-32 text-right font-semibold tabular-nums">{pesos(r.net_estimate)}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <Link to={enlace(r)} className="font-semibold underline">Abrir</Link>
                  <button type="button" className="text-slate underline hover:text-ink" onClick={() => setBorrando(r)}>Borrar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(borrando)} title="Borrar este período" confirmLabel="Borrar" busy={busy} onClose={() => setBorrando(null)}
        onConfirm={async () => {
          if (!borrando) return;
          setBusy(true);
          try {
            await deletePayrollRecord(borrando.calculator, borrando.period_key);
            setBorrando(null);
            reload();
          } finally {
            setBusy(false);
          }
        }}
      >
        Se borrará lo que anotaste en {borrando ? periodLabel(borrando.period_key).toLowerCase() : ''}. No se puede deshacer.
      </ConfirmDialog>
    </section>
  );
}
