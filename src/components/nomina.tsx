// Piezas compartidas por las calculadoras de nómina.
import { useState, type ReactNode } from 'react';
import { esDominicalOFestivo, festivos, fecha as aFecha, sumarDias } from '../lib/festivos';
import type { Desprendible as DesprendibleT, Horas, Novedades, OtrosConceptos, TipoHora, Turno } from '../lib/nomina';
import { Alert, Dialog, Field } from './ui';
import { TextoCst } from './ArticulosCst';
import { CalcSharePrompt } from './CalcSharePrompt';
import { PrintButton } from './PrintButton';

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
          {suffix && <span className="text-slate">{suffix}</span>}
        </div>
      )}
    </Field>
  );
}

export type Periodo = { anio: number; mes: number; periodicidad: string };

export function periodoActual(): Periodo {
  const d = new Date();
  return { anio: d.getFullYear(), mes: d.getMonth() + 1, periodicidad: 'mensual' };
}

export function rangoPeriodo(p: Periodo): { desde: string; hasta: string; diasNomina: number; fechas: string[] } {
  const y = p.anio;
  const m = p.mes;
  const pad = (n: number) => String(n).padStart(2, '0');
  const ultimo = new Date(y, m, 0).getDate();
  let desdeD = 1;
  let hastaD = ultimo;
  let diasNomina = 30;
  if (p.periodicidad === 'q1' || p.periodicidad === 'primera') {
    hastaD = 15;
    diasNomina = 15;
  } else if (p.periodicidad === 'q2' || p.periodicidad === 'segunda') {
    desdeD = 16;
    diasNomina = 15;
  }
  const desde = `${y}-${pad(m)}-${pad(desdeD)}`;
  const hasta = `${y}-${pad(m)}-${pad(hastaD)}`;
  const fechas: string[] = [];
  for (let d = desdeD; d <= hastaD; d++) fechas.push(`${y}-${pad(m)}-${pad(d)}`);
  return { desde, hasta, diasNomina, fechas };
}

export function PeriodoFields({ value, onChange, quincenas = true }: { value: Periodo; onChange: (p: Periodo) => void; quincenas?: boolean }) {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return (
    <fieldset className="grid gap-4 sm:grid-cols-3">
      <legend className="sr-only">Período</legend>
      <Field label="Año">
        {(p) => (
          <input {...p} type="number" className="input" value={value.anio}
            onChange={(e) => onChange({ ...value, anio: Number(e.target.value) || value.anio })} />
        )}
      </Field>
      <Field label="Mes">
        {(p) => (
          <select {...p} className="input" value={value.mes} onChange={(e) => onChange({ ...value, mes: Number(e.target.value) })}>
            {meses.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
          </select>
        )}
      </Field>
      {quincenas ? (
        <Field label="Corte">
          {(p) => (
            <select {...p} className="input" value={value.periodicidad} onChange={(e) => onChange({ ...value, periodicidad: e.target.value })}>
              <option value="mensual">Mes completo</option>
              <option value="q1">Primera quincena</option>
              <option value="q2">Segunda quincena</option>
            </select>
          )}
        </Field>
      ) : <div />}
    </fieldset>
  );
}

export function NovedadesFields({ value, onChange }: { value: Novedades; onChange: (v: Novedades) => void }) {
  const set = (k: keyof Novedades, n: number) => onChange({ ...value, [k]: n });
  return (
    <fieldset className="space-y-3 rounded border border-line p-4">
      <legend className="px-1 font-sans text-base font-semibold">Novedades del período (días)</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberInput label="Incapacidad" value={value.incapacidad} onChange={(n) => set('incapacidad', n)} />
        <NumberInput label="Vacaciones" value={value.vacaciones} onChange={(n) => set('vacaciones', n)} />
        <NumberInput label="Ausencia" value={value.ausencia} onChange={(n) => set('ausencia', n)} />
        <NumberInput label="Permiso remunerado" value={value.permisoRemunerado} onChange={(n) => set('permisoRemunerado', n)} />
        <NumberInput label="Permiso no remunerado" value={value.permisoNoRemunerado} onChange={(n) => set('permisoNoRemunerado', n)} />
      </div>
    </fieldset>
  );
}

export function OtrosFields({ value, onChange }: { value: OtrosConceptos; onChange: (v: OtrosConceptos) => void }) {
  const set = (k: keyof OtrosConceptos, n: number) => onChange({ ...value, [k]: n });
  return (
    <fieldset className="space-y-3 rounded border border-line p-4">
      <legend className="px-1 font-sans text-base font-semibold">Otros conceptos</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <MoneyInput label="Bonificaciones salariales" value={value.bonificacionesSalariales} onChange={(n) => set('bonificacionesSalariales', n)} />
        <MoneyInput label="Bonificaciones no salariales" value={value.bonificacionesNoSalariales} onChange={(n) => set('bonificacionesNoSalariales', n)} />
        <MoneyInput label="Otros auxilios no salariales" value={value.auxiliosNoSalariales} onChange={(n) => set('auxiliosNoSalariales', n)} />
        <MoneyInput label="Anticipos" value={value.anticipos} onChange={(n) => set('anticipos', n)} />
        <MoneyInput label="Préstamos o libranzas" value={value.prestamos} onChange={(n) => set('prestamos', n)} />
        <MoneyInput label="Otros descuentos" value={value.otrosDescuentos} onChange={(n) => set('otrosDescuentos', n)} />
      </div>
    </fieldset>
  );
}

export function ExplicacionDescanso() {
  return (
    <>
      <h3>Descanso o almuerzo</h3>
      <p>
        El tiempo de descanso dentro de la jornada no es trabajo (CST, art. 167). Si lo marcas en el calendario, se resta del total del turno.
      </p>
    </>
  );
}

export function ComoSeCalcula({ children }: { children: ReactNode }) {
  return (
    <section className="mt-14 max-w-prose border-t border-line pt-10" aria-labelledby="como-se-calcula">
      <h2 id="como-se-calcula" className="text-2xl">Cómo se calcula</h2>
      <div className="guide-body mt-4 space-y-4 text-base leading-7 text-slate">{children}</div>
    </section>
  );
}

const ORDEN_ETIQUETAS: TipoHora[] = ['HED', 'HEN', 'HEDD', 'HEDN', 'RN', 'RDD', 'RDN'];

/** Etiquetas compactas para una celda del calendario, p. ej. "2 HED", "2,5 RN". */
export function etiquetasDesgloseDia(h: Horas | undefined): string[] {
  if (!h) return [];
  const out: string[] = [];
  for (const t of ORDEN_ETIQUETAS) {
    const v = h[t];
    if (v < 0.05) continue;
    const n = Math.round(v * 10) / 10;
    const s = Number.isInteger(n) ? String(n) : n.toLocaleString('es-CO', { maximumFractionDigits: 1 });
    out.push(`${s} ${t}`);
  }
  return out;
}

// ---------------------------------------------------------------- desprendible

export function DesprendibleView({ titulo, d, extra }: { titulo: string; d: DesprendibleT; extra?: ReactNode }) {
  return (
    <div className="folio p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4 text-sm text-slate">
        <div className="flex items-center gap-3">
          <span>{titulo}</span>
          <PrintButton />
        </div>
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
        {d.avisos.map((a) => <p key={a} className="text-sm text-slate"><TextoCst texto={a} /></p>)}
        <Alert tone="warning" title="Es una estimación, no tu desprendible oficial">
          Compárala con el de tu empresa. Las diferencias pueden venir de las fechas de corte, de cómo tu empresa cuenta las horas extra o de
          otros conceptos que no están aquí.
        </Alert>
        <CalcSharePrompt
          categoria="salario-y-pagos"
          motivo="¿Tu empresa no te paga las horas extra o los recargos que corresponden?"
          mensaje="Comparte tu experiencia sin dar tu nombre y ayuda a visibilizar las condiciones de trabajo reales."
        />
      </div>
    </div>
  );
}

function Bloque({ titulo, lineas, negativo }: { titulo: string; lineas: DesprendibleT['devengados']; negativo?: boolean }) {
  if (!lineas.length) return null;
  return (
    <section className="mt-6">
      <h3 className="font-sans text-sm font-semibold text-slate">{titulo}</h3>
      <ul className="mt-2 space-y-3">
        {lineas.map((l) => (
          <li key={l.clave} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 text-sm">
            <span className="font-medium text-ink">{l.nombre}</span>
            <span className="tabular-nums">{negativo ? '−' : ''}{pesos(l.valor)}</span>
            {(l.detalle || l.norma) && (
              <span className="col-span-2 text-xs text-slate">
                <TextoCst texto={[l.detalle, l.norma].filter(Boolean).join('. ') } />
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------- calendario

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export type Turnos = Record<string, Turno | 'descanso'>;

export function turnosLista(t: Turnos): Turno[] {
  return Object.values(t).filter((x): x is Turno => !!x && x !== 'descanso');
}

export function etiquetaTurno(t: Turno): string {
  const ini = Number(t.entrada.slice(0, 2));
  const fin = Number(t.salida.slice(0, 2));
  if (t.salida <= t.entrada || ini >= 19 || fin <= 6) return 'Noche';
  return 'Día';
}

export function CalendarioTurnos({ fechas, turnos, onChange, plantilla, desglose }: { fechas: string[]; turnos: Turnos; onChange: (t: Turnos) => void; plantilla: Turno; desglose?: Record<string, Horas> }) {
  const [editando, setEditando] = useState<string | null>(null);
  const primer = aFecha(fechas[0]);
  const huecos = (primer.getDay() + 6) % 7;
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
          const tags = t && t !== 'descanso' ? etiquetasDesgloseDia(desglose?.[f]) : [];
          return (
            <li key={f}>
              <button type="button" onClick={() => setEditando(f)}
                aria-label={`${aFecha(f).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}${festivo ? `, festivo: ${festivo}` : ''}. ${texto}${tags.length ? `. ${tags.join(', ')}` : ''}. Editar`}
                className={`flex min-h-16 w-full flex-col items-start gap-0.5 rounded border p-1 text-left text-[0.6875rem] leading-tight sm:min-h-20 sm:p-1.5 sm:text-xs ${color} ${dom ? 'border-amber' : 'border-line'} hover:border-ink`}>
                <span className={`font-semibold ${dom && !(t && t !== 'descanso' && etiquetaTurno(t) === 'Noche') ? 'text-amber' : ''}`}>{Number(f.slice(8))}{festivo ? ' F' : ''}</span>
                <span className="w-full truncate">{!t ? '·' : t === 'descanso' ? 'Desc.' : `${t.entrada}–${t.salida}`}</span>
                {tags.length > 0 && (
                  <span className="mt-0.5 flex w-full flex-col gap-0.5 leading-tight">
                    {tags.map((e) => (
                      <span key={e} className={`truncate text-[10px] font-semibold tabular-nums ${t && t !== 'descanso' && etiquetaTurno(t) === 'Noche' ? 'text-white/90' : 'text-ink/80'}`}>{e}</span>
                    ))}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-slate">
        Borde naranja: domingo o festivo (F). Verde: día. Azul: noche. Gris: descanso. En cada día: HED/HEN = extra diurna/nocturna; RN/RDD/RDN = recargos. Toca un día para cambiarlo.
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
        <Field label="Descanso (min)" hint="Almuerzo o pausa: no cuenta como trabajo.">{(p) => <input {...p} inputMode="numeric" className="input" value={t.descansoMin || ''} placeholder="0" onChange={(e) => setT({ ...t, descansoMin: Number(e.target.value.replace(/\D/g, '')) || 0 })} />}</Field>
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
