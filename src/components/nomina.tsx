// Piezas compartidas por las calculadoras de nómina.
import { useState, type ReactNode } from 'react';
import { esDominicalOFestivo, festivos, fecha as aFecha, sumarDias } from '../lib/festivos';
import type { Desprendible as DesprendibleT, Novedades, OtrosConceptos, Turno } from '../lib/nomina';
import { Alert, Dialog, Field } from './ui';

export const pesos = (n: number) => `${n < 0 ? '−' : ''}$${Math.abs(Math.round(n)).toLocaleString('es-CO')}`;
const soloDigitos = (s: string) => s.replace(/\D/g, '');

export function MoneyInput({ label, value, onChange, hint, optional, error }: { label: string; value: number; onChange: (n: number) => void; hint?: ReactNode; optional?: boolean; error?: string }) {
  return (
    <Field label={label} hint={hint} optional={optional} error={error}>
      {(p) => (
        <input {...p} inputMode="numeric" className="input" placeholder="$ 0" value={value ? value.toLocaleString('es-CO') : ''}
          onChange={(e) => onChange(Number(soloDigitos(e.target.value) || 0))} />
      )}
    </Field>
  );
}

export function NumberInput({ label, value, onChange, hint, suffix, max }: { label: string; value: number; onChange: (n: number) => void; hint?: ReactNode; suffix?: string; max?: number }) {
  return (
    <Field label={label} hint={hint}>
      {(p) => (
        <div className="flex items-center gap-2">
          <input {...p} inputMode="decimal" className="input" value={value || ''} placeholder="0"
            onChange={(e) => {
              const n = Number(e.target.value.replace(',', '.').replace(/[^\d.]/g, '')) || 0;
              onChange(max !== undefined ? Math.min(n, max) : n);
            }} />
          {suffix && <span className="shrink-0 text-sm text-slate">{suffix}</span>}
        </div>
      )}
    </Field>
  );
}

// ---------------------------------------------------------------- período

export type Periodicidad = 'mensual' | 'q1' | 'q2';
export interface Periodo { anio: number; mes: number; periodicidad: Periodicidad }

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const pad = (n: number) => String(n).padStart(2, '0');

export function periodoActual(): Periodo {
  const d = new Date();
  return { anio: d.getFullYear(), mes: d.getMonth() + 1, periodicidad: 'mensual' };
}

/** Fechas del período (todas las del calendario) y días de nómina (30 o 15, convención comercial). */
export function rangoPeriodo(p: Periodo) {
  const ultimo = new Date(p.anio, p.mes, 0).getDate();
  const desde = p.periodicidad === 'q2' ? 16 : 1;
  const hasta = p.periodicidad === 'q1' ? 15 : ultimo;
  const fechas = Array.from({ length: hasta - desde + 1 }, (_, i) => `${p.anio}-${pad(p.mes)}-${pad(desde + i)}`);
  return { fechas, desde: fechas[0], hasta: fechas[fechas.length - 1], diasNomina: p.periodicidad === 'mensual' ? 30 : 15 };
}

export function PeriodoFields({ value, onChange, quincenas = true }: { value: Periodo; onChange: (p: Periodo) => void; quincenas?: boolean }) {
  const anios = [2025, 2026, 2027];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Mes">
        {(p) => (
          <select {...p} className="input" value={value.mes} onChange={(e) => onChange({ ...value, mes: Number(e.target.value) })}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        )}
      </Field>
      <Field label="Año">
        {(p) => (
          <select {...p} className="input" value={value.anio} onChange={(e) => onChange({ ...value, anio: Number(e.target.value) })}>
            {anios.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
      </Field>
      {quincenas && (
        <Field label="Período de pago">
          {(p) => (
            <select {...p} className="input" value={value.periodicidad} onChange={(e) => onChange({ ...value, periodicidad: e.target.value as Periodicidad })}>
              <option value="mensual">Mes completo</option>
              <option value="q1">Primera quincena (1 al 15)</option>
              <option value="q2">Segunda quincena (16 al fin de mes)</option>
            </select>
          )}
        </Field>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- novedades y otros

export function NovedadesFields({ value, onChange }: { value: Novedades; onChange: (n: Novedades) => void }) {
  const campo = (k: keyof Novedades, label: string, hint: string) => (
    <NumberInput label={label} hint={hint} suffix="días" max={31} value={value[k]} onChange={(n) => onChange({ ...value, [k]: n })} />
  );
  return (
    <fieldset className="space-y-4">
      <legend className="font-sans text-base font-semibold">Novedades del período</legend>
      <p className="text-sm text-slate">Escribe solo los días que tuviste de cada novedad en este período.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {campo('incapacidad', 'Incapacidad por enfermedad', '2/3 del salario; los 2 primeros días los paga el empleador.')}
        {campo('vacaciones', 'Vacaciones', 'Se pagan con tu salario normal.')}
        {campo('permisoRemunerado', 'Permiso o licencia remunerada', 'Calamidad, cita médica, votación…')}
        {campo('permisoNoRemunerado', 'Permiso no remunerado', 'Lo pediste tú y no se paga.')}
        {campo('ausencia', 'Ausencia sin justificar', 'No se paga ese día.')}
      </div>
    </fieldset>
  );
}

export function OtrosFields({ value, onChange }: { value: OtrosConceptos; onChange: (o: OtrosConceptos) => void }) {
  const campo = (k: keyof OtrosConceptos, label: string, hint: string) => (
    <MoneyInput label={label} hint={hint} optional value={value[k]} onChange={(n) => onChange({ ...value, [k]: n })} />
  );
  return (
    <fieldset className="space-y-4">
      <legend className="font-sans text-base font-semibold">Otros pagos y descuentos</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {campo('bonificacionesSalariales', 'Comisiones o bonificaciones salariales', 'Pagos habituales por tu trabajo. Cuentan para seguridad social.')}
        {campo('auxiliosNoSalariales', 'Auxilios no salariales', 'Alimentación, rodamiento, vivienda… pactados como no salariales.')}
        {campo('bonificacionesNoSalariales', 'Bonificaciones no salariales', 'Por ejemplo, un bono ocasional por mera liberalidad.')}
        {campo('anticipos', 'Anticipos de nómina', 'Dinero que ya recibiste de este período.')}
        {campo('prestamos', 'Préstamos o libranzas', 'Cuotas que autorizaste descontar.')}
        {campo('otrosDescuentos', 'Otros descuentos autorizados', 'Seguros, fondos de empleados…')}
      </div>
    </fieldset>
  );
}

// ---------------------------------------------------------------- desprendible

export function DesprendibleView({ titulo, d, extra }: { titulo: string; d: DesprendibleT; extra?: ReactNode }) {
  return (
    <div className="folio p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4 text-sm text-slate">
        <span>{titulo}</span>
        <span>Valor hora: {pesos(d.valorHora)}</span>
      </div>
      {extra}
      <Bloque titulo="Lo que te pagan" lineas={d.devengados} />
      <Bloque titulo="Descuentos" lineas={d.deducciones} negativo />
      <dl className="mt-6 space-y-2 border-t-2 border-ink pt-4">
        <div className="flex justify-between gap-4"><dt>Total devengado</dt><dd className="tabular-nums">{pesos(d.totalDevengado)}</dd></div>
        <div className="flex justify-between gap-4"><dt>Total descuentos</dt><dd className="tabular-nums">−{pesos(d.totalDeducciones)}</dd></div>
        <div className="flex items-baseline justify-between gap-4 pt-2">
          <dt className="font-serif text-xl">Neto a recibir</dt>
          <dd className="font-serif text-3xl tabular-nums">{pesos(d.neto)}</dd>
        </div>
        <div className="flex justify-between gap-4 pt-2 text-sm text-slate">
          <dt>Base de cotización (IBC)</dt><dd className="tabular-nums">{pesos(d.ibc)}</dd>
        </div>
      </dl>
      <div className="mt-6 space-y-3">
        {d.avisos.map((a) => <p key={a} className="text-sm text-slate">{a}</p>)}
        <Alert tone="warning" title="Es una estimación, no tu desprendible oficial">
          Compárala con el de tu empresa. Las diferencias pueden venir de las fechas de corte, de cómo tu empresa cuenta las horas extra o de
          datos que falten.
        </Alert>
      </div>
    </div>
  );
}

function Bloque({ titulo, lineas, negativo }: { titulo: string; lineas: DesprendibleT['devengados']; negativo?: boolean }) {
  if (!lineas.length) return null;
  return (
    <section className="mt-5">
      <h3 className="font-sans text-sm font-semibold text-slate">{titulo}</h3>
      <ul className="mt-2">
        {lineas.map((l) => (
          <li key={l.clave} className="border-b border-dashed border-line py-3">
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-semibold">{l.nombre}</span>
              <span className="tabular-nums">{negativo ? '−' : ''}{pesos(l.valor)}</span>
            </div>
            {(l.detalle || l.norma) && (
              <p className="mt-1 text-sm text-slate">{[l.detalle, l.norma].filter(Boolean).join('. ')}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ComoSeCalcula({ children }: { children: ReactNode }) {
  return (
    <section aria-labelledby="como-se-calcula" className="mt-16 border-t border-ink/80 pt-8">
      <h2 id="como-se-calcula" className="text-3xl">Cómo se calcula</h2>
      <div className="mt-5 max-w-prose space-y-4 text-[1.0625rem] leading-7 [&_h3]:mt-6 [&_h3]:font-sans [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- calendario de turnos

export type Turnos = Record<string, Turno | 'descanso'>;
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function etiquetaTurno(t: Turno): string {
  const h = Number(t.entrada.slice(0, 2));
  return t.salida <= t.entrada || h >= 17 ? 'Noche' : 'Día';
}

export function CalendarioTurnos({ fechas, turnos, onChange, plantilla }: { fechas: string[]; turnos: Turnos; onChange: (t: Turnos) => void; plantilla: Turno }) {
  const [editando, setEditando] = useState<string | null>(null);
  const primer = aFecha(fechas[0]);
  const huecos = (primer.getDay() + 6) % 7; // lunes primero
  const anio = Number(fechas[0].slice(0, 4));
  const fest = festivos(anio);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate" aria-hidden="true">
        {DIAS.map((d) => <span key={d}>{d}</span>)}
      </div>
      <ul className="mt-1 grid grid-cols-7 gap-1" aria-label="Días del período">
        {Array.from({ length: huecos }, (_, i) => <li key={`h${i}`} aria-hidden="true" />)}
        {fechas.map((f) => {
          const t = turnos[f];
          const festivo = fest.get(f);
          const dom = esDominicalOFestivo(f);
          const texto = !t ? 'Sin turno' : t === 'descanso' ? 'Descanso' : `${etiquetaTurno(t)} ${t.entrada}–${t.salida}`;
          const color = !t ? 'bg-paper' : t === 'descanso' ? 'bg-mist' : etiquetaTurno(t) === 'Noche' ? 'bg-navy text-white' : 'bg-teal-tint';
          return (
            <li key={f}>
              <button type="button" onClick={() => setEditando(f)}
                aria-label={`${aFecha(f).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}${festivo ? `, festivo: ${festivo}` : ''}. ${texto}. Editar`}
                className={`flex h-16 w-full flex-col items-start justify-between rounded border p-1 text-left text-[0.6875rem] leading-tight sm:h-20 sm:p-1.5 sm:text-xs ${color} ${dom ? 'border-amber' : 'border-line'} hover:border-ink`}>
                <span className={`font-semibold ${dom && !(t && t !== 'descanso' && etiquetaTurno(t) === 'Noche') ? 'text-amber' : ''}`}>{Number(f.slice(8))}{festivo ? ' F' : ''}</span>
                <span className="w-full truncate">{!t ? '·' : t === 'descanso' ? 'Desc.' : `${t.entrada}–${t.salida}`}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-slate">
        Borde naranja: domingo o festivo (F). Verde: turno de día. Azul: turno de noche. Gris: descanso. Toca un día para cambiarlo.
      </p>
      {editando && (
        <EditorTurno
          fecha={editando}
          valor={turnos[editando]}
          plantilla={plantilla}
          onClose={() => setEditando(null)}
          onSave={(v) => {
            const next = { ...turnos };
            if (v === null) delete next[editando];
            else next[editando] = v;
            onChange(next);
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}

function EditorTurno({ fecha: f, valor, plantilla, onClose, onSave }: { fecha: string; valor: Turno | 'descanso' | undefined; plantilla: Turno; onClose: () => void; onSave: (v: Turno | 'descanso' | null) => void }) {
  const inicial = valor && valor !== 'descanso' ? valor : { ...plantilla, fecha: f };
  const [t, setT] = useState<Turno>(inicial);
  const festivo = festivos(Number(f.slice(0, 4))).get(f);
  const cruza = t.salida <= t.entrada;
  return (
    <Dialog open onClose={onClose} title={aFecha(f).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}>
      {festivo && <p className="mb-3 text-sm font-semibold text-amber">Festivo: {festivo}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Entrada">{(p) => <input {...p} type="time" className="input" value={t.entrada} onChange={(e) => setT({ ...t, entrada: e.target.value })} />}</Field>
        <Field label="Salida">{(p) => <input {...p} type="time" className="input" value={t.salida} onChange={(e) => setT({ ...t, salida: e.target.value })} />}</Field>
        <Field label="Descanso">{(p) => <input {...p} inputMode="numeric" className="input" value={t.descansoMin || ''} placeholder="0 min" onChange={(e) => setT({ ...t, descansoMin: Number(e.target.value.replace(/\D/g, '')) || 0 })} />}</Field>
      </div>
      {cruza && <p className="mt-2 text-sm text-slate">Sales al día siguiente ({sumarDias(f, 1).slice(8)}).</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={() => onSave(null)}>Sin turno</button>
        <button type="button" className="btn-secondary" onClick={() => onSave('descanso')}>Descanso</button>
        <button type="button" className="btn-primary" onClick={() => onSave({ ...t, fecha: f })}>Guardar turno</button>
      </div>
    </Dialog>
  );
}

export const turnosLista = (t: Turnos): Turno[] => Object.values(t).filter((x): x is Turno => x !== 'descanso');
