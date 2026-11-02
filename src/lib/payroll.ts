/**
 * Nóminas guardadas (migración 2500): lo que una persona con cuenta anota en
 * las calculadoras de nómina, guardado por período. Solo la dueña lo ve.
 */
import { requireClient } from './supabase';
import { toAppError } from './errors';
import type { Periodo } from '../components/nomina';

export type PayrollCalculator = 'administrativos' | 'operativos' | 'vigilantes' | 'por-dias';

export const PAYROLL_CALCULATORS: Record<PayrollCalculator, { name: string; path: string }> = {
  administrativos: { name: 'Nómina administrativa', path: '/calculadoras/administrativos' },
  operativos: { name: 'Nómina por turnos', path: '/calculadoras/operativos' },
  vigilantes: { name: 'Nómina de vigilante', path: '/calculadoras/vigilantes' },
  'por-dias': { name: 'Nómina por días', path: '/calculadoras/por-dias' },
};

export interface PayrollRecord {
  calculator: PayrollCalculator;
  period_key: string;
  data: Record<string, unknown>;
  net_estimate: number;
  worked_days: number;
  updated_at: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const CORTES = ['mensual', 'q1', 'q2'];

/** «2026-11-mensual», «2026-11-q1»… Es la llave del período en la base de datos y en la dirección (?periodo=). */
export function periodKey(p: Periodo): string {
  return `${p.anio}-${pad(p.mes)}-${CORTES.includes(p.periodicidad) ? p.periodicidad : 'mensual'}`;
}

export function parsePeriodKey(key: string | null): Periodo | null {
  const m = /^(\d{4})-(\d{2})-(mensual|q1|q2)$/.exec(key ?? '');
  if (!m) return null;
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12) return null;
  return { anio: Number(m[1]), mes, periodicidad: m[3] };
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export function periodLabel(key: string): string {
  const p = parsePeriodKey(key);
  if (!p) return key;
  const mes = MESES[p.mes - 1];
  const base = `${mes[0].toUpperCase()}${mes.slice(1)} de ${p.anio}`;
  return p.periodicidad === 'q1' ? `${base}, 1.ª quincena` : p.periodicidad === 'q2' ? `${base}, 2.ª quincena` : base;
}

async function run<T>(promise: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw toAppError(error);
  return data as T;
}

const COLS = 'calculator, period_key, data, net_estimate, worked_days, updated_at';

export function getPayrollRecord(calculator: PayrollCalculator, key: string) {
  return run<PayrollRecord | null>(
    requireClient().from('payroll_records').select(COLS).eq('calculator', calculator).eq('period_key', key).maybeSingle(),
  );
}

export function savePayrollRecord(userId: string, r: Omit<PayrollRecord, 'updated_at'>) {
  return run(
    requireClient().from('payroll_records').upsert(
      { user_id: userId, calculator: r.calculator, period_key: r.period_key, data: r.data, net_estimate: Math.round(r.net_estimate), worked_days: r.worked_days },
      { onConflict: 'user_id,calculator,period_key' },
    ),
  );
}

export function listPayrollRecords() {
  return run<PayrollRecord[]>(requireClient().from('payroll_records').select(COLS).order('period_key', { ascending: false }).limit(200));
}

export function deletePayrollRecord(calculator: PayrollCalculator, key: string) {
  return run(requireClient().from('payroll_records').delete().eq('calculator', calculator).eq('period_key', key));
}

// ---------------------------------------------------------------- borrador antes de crear la cuenta
// Si alguien anota sus días sin cuenta y pulsa «Crear cuenta gratis», lo que
// llevaba queda en este navegador (7 días) y se guarda al volver con sesión.
const DRAFT = 'tuvozlaboral:nomina-pendiente';
const DRAFT_DAYS = 7;

export interface PayrollDraft { calculator: PayrollCalculator; period_key: string; data: Record<string, unknown>; at: number }

export function stashDraft(d: Omit<PayrollDraft, 'at'>) {
  try {
    localStorage.setItem(DRAFT, JSON.stringify({ ...d, at: Date.now() }));
  } catch {
    // Sin almacenamiento (modo privado): no pasa nada, solo no se recupera.
  }
}

export function readDraft(): PayrollDraft | null {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT) ?? 'null') as PayrollDraft | null;
    if (!d || Date.now() - d.at > DRAFT_DAYS * 86_400_000 || !PAYROLL_CALCULATORS[d.calculator] || !parsePeriodKey(d.period_key)) return null;
    return d;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT);
  } catch {
    // nada
  }
}
