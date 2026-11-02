/**
 * Guardado de las calculadoras de nómina para personas con cuenta, y el
 * mensaje que invita a crearla a quien no la tiene.
 *
 * Con sesión: al abrir un período se carga lo guardado y cada cambio se
 * guarda solo, un momento después de dejar de escribir. Sin sesión no se
 * consulta nada a la red.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  clearDraft, getPayrollRecord, periodLabel, readDraft, savePayrollRecord, stashDraft, type PayrollCalculator,
} from '../lib/payroll';
import { pesos } from './nomina';

const SAVE_AFTER_MS = 1200;

type Status = 'sin-sesion' | 'cargando' | 'listo' | 'guardando' | 'guardado' | 'error';

interface Options<T> {
  calculator: PayrollCalculator;
  periodKey: string;
  /** Lo que se guarda: todo lo que la persona escribió, menos el período. */
  datos: T;
  /** Restaura lo guardado en el estado de la calculadora. */
  aplicar: (d: T) => void;
  /** Al pasar a un período sin datos guardados: limpia lo del período anterior (conserva el salario). */
  limpiarPeriodo?: () => void;
  neto: number;
  diasTrabajados: number;
  /** true mientras no haya nada que valga la pena guardar. */
  vacio: boolean;
}

export function useSavedPayroll<T extends object>(o: Options<T>) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [status, setStatus] = useState<Status>(userId ? 'cargando' : 'sin-sesion');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const loadedKey = useRef<string | null>(null);
  const lastJson = useRef('');
  const pending = useRef<null | (() => Promise<void>)>(null);
  const latest = useRef(o);
  latest.current = o;

  // Cargar el período (y, si lo hay, el borrador que quedó antes de crear la cuenta).
  useEffect(() => {
    if (!userId) {
      loadedKey.current = null;
      setStatus('sin-sesion');
      return;
    }
    let active = true;
    const cambio = loadedKey.current !== null && loadedKey.current !== o.periodKey;
    loadedKey.current = null;
    setStatus('cargando');
    getPayrollRecord(o.calculator, o.periodKey)
      .then((row) => {
        if (!active) return;
        const draft = readDraft();
        if (row) {
          lastJson.current = JSON.stringify(row.data);
          latest.current.aplicar(row.data as T);
          setSavedAt(row.updated_at);
        } else if (draft && draft.calculator === o.calculator && draft.period_key === o.periodKey) {
          lastJson.current = '';
          latest.current.aplicar(draft.data as T);
          clearDraft();
          setSavedAt(null);
        } else {
          lastJson.current = '';
          if (cambio) latest.current.limpiarPeriodo?.();
          setSavedAt(null);
        }
        loadedKey.current = o.periodKey;
        setStatus('listo');
      })
      .catch(() => {
        if (!active) return;
        // Sin la tabla (migración pendiente) o sin red: la calculadora sigue funcionando.
        setStatus('error');
      });
    return () => {
      active = false;
      // Al cambiar de período, guarda ya lo que estaba por guardarse.
      void pending.current?.();
    };
  }, [userId, o.calculator, o.periodKey]);

  // Guardado automático.
  const json = JSON.stringify(o.datos);
  useEffect(() => {
    pending.current = null;
    if (!userId || status === 'error' || loadedKey.current !== o.periodKey || o.vacio || json === lastJson.current) return;
    const { calculator, periodKey, neto, diasTrabajados } = o;
    const save = async () => {
      pending.current = null;
      const previo = lastJson.current;
      lastJson.current = json;
      setStatus('guardando');
      try {
        await savePayrollRecord(userId, {
          calculator, period_key: periodKey, data: JSON.parse(json) as Record<string, unknown>, net_estimate: neto, worked_days: diasTrabajados,
        });
        setSavedAt(new Date().toISOString());
        setStatus('guardado');
      } catch {
        lastJson.current = previo;
        setStatus('error');
      }
    };
    pending.current = save;
    const id = window.setTimeout(() => void save(), SAVE_AFTER_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, json, o.neto, o.vacio, o.periodKey, status]);

  return { status, savedAt, conSesion: Boolean(userId) };
}

/** Barra de la calculadora: invitación para crear la cuenta, o estado del guardado. */
export function SavedPayrollBar<T extends object>({
  calculator, periodKey, datos, neto, diasTrabajados, status, savedAt, calendario,
}: {
  calculator: PayrollCalculator; periodKey: string; datos: T; neto: number; diasTrabajados: number;
  status: Status; savedAt: string | null;
  /** true en las calculadoras con calendario de días. */
  calendario: boolean;
}) {
  if (status === 'sin-sesion') {
    const guardarBorrador = () => stashDraft({ calculator, period_key: periodKey, data: datos as Record<string, unknown> });
    return (
      <aside aria-labelledby="guardar-nomina" className="rounded-lg border border-teal/40 bg-teal/5 p-5 sm:p-6">
        <h2 id="guardar-nomina" className="font-sans text-lg font-semibold">
          {calendario ? '¿Cuánto te va a llegar este mes? Llévalo día a día.' : 'Guarda tu nómina de cada mes y compárala con lo que te pagan.'}
        </h2>
        <p className="mt-2 max-w-prose text-slate">
          {calendario
            ? 'Crea tu cuenta gratis y lo que anotes aquí se guarda solo. Cada día que trabajes entras, marcas el turno y listo: al cierre sabes cuánto te deben pagar, antes de que llegue el desprendible. Y si no coincide, tienes tu registro para reclamar.'
            : 'Crea tu cuenta gratis y lo que anotes aquí se guarda solo, mes a mes. Así ves cuánto te debería llegar y tienes tu registro si el pago no coincide.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link to={`/cuenta?modo=registro&siguiente=${encodeURIComponent(`${window.location.pathname}?periodo=${periodKey}`)}`} onClick={guardarBorrador} className="btn-primary">
            Crear cuenta gratis
          </Link>
          <Link to={`/cuenta?siguiente=${encodeURIComponent(`${window.location.pathname}?periodo=${periodKey}`)}`} onClick={guardarBorrador} className="btn-link">
            Ya tengo cuenta
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate">Privado: solo tú lo ves. No pedimos tu nombre ni tu documento. Lo que ya anotaste no se pierde al crear la cuenta.</p>
      </aside>
    );
  }
  if (status === 'error') {
    return <p className="rounded border border-line px-4 py-3 text-sm text-slate" role="status">No pudimos guardar este período por ahora. La calculadora sigue funcionando; intenta más tarde.</p>;
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-lg border border-line bg-mist px-4 py-3 text-sm" role="status">
      <span>
        <strong>{periodLabel(periodKey)}</strong>
        {calendario && diasTrabajados > 0 && <> · {diasTrabajados} {diasTrabajados === 1 ? 'día anotado' : 'días anotados'}</>}
        {neto > 0 && <> · te debería llegar <strong>{pesos(neto)}</strong></>}
      </span>
      <span className="flex items-center gap-4 text-slate">
        <span>
          {status === 'cargando' ? 'Cargando lo guardado…'
            : status === 'guardando' ? 'Guardando…'
              : savedAt ? '✓ Guardado automáticamente' : 'Se guarda solo cuando anotes algo'}
        </span>
        <Link to="/cuenta#mis-nominas" className="font-semibold text-ink underline">Mis nóminas</Link>
      </span>
    </div>
  );
}
