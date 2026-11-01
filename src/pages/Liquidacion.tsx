import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  calcularLiquidacion, validarLiquidacion, VALORES_2026,
  type DatosLiquidacion, type MotivoRetiro, type ResultadoLiquidacion, type TipoContrato,
} from '../lib/liquidacion';
import { Alert, Field, PageHeader } from '../components/ui';
import { TextoCst } from '../components/ArticulosCst';
import { CalcSharePrompt } from '../components/CalcSharePrompt';
import { PrintButton } from '../components/PrintButton';
import { CalculatorGuideLinks } from '../components/CalculatorGuideLinks';
import { ComoSeCalcula } from '../components/ComoSeCalcula';

const pesos = (n: number) => `$${n.toLocaleString('es-CO')}`;
const soloDigitos = (s: string) => s.replace(/\D/g, '');
const conMiles = (s: string) => (s ? Number(s).toLocaleString('es-CO') : '');

const motivos: { value: MotivoRetiro; label: string; tipos: TipoContrato[] }[] = [
  { value: 'renuncia', label: 'Renuncia o acuerdo con el empleador', tipos: ['indefinido', 'fijo'] },
  { value: 'despido_sin_justa_causa', label: 'Despido sin justa causa', tipos: ['indefinido', 'fijo'] },
  { value: 'despido_justa_causa', label: 'Despido con justa causa', tipos: ['indefinido', 'fijo'] },
  { value: 'fin_plazo', label: 'Terminó el plazo pactado', tipos: ['fijo'] },
];

export default function Liquidacion() {
  const [form, setForm] = useState({
    tipoContrato: 'indefinido' as TipoContrato,
    motivo: 'renuncia' as MotivoRetiro,
    fechaIngreso: '',
    fechaRetiro: '',
    fechaFinPactada: '',
    salario: '',
    variable: '',
    vacaciones: '0',
    pendientes: '0',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<ResultadoLiquidacion | null>(null);
  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setResultado(null);
  };

  function calcular(e: React.FormEvent) {
    e.preventDefault();
    const datos: DatosLiquidacion = {
      tipoContrato: form.tipoContrato,
      motivo: form.motivo,
      fechaIngreso: form.fechaIngreso,
      fechaRetiro: form.fechaRetiro,
      fechaFinPactada: form.fechaFinPactada || undefined,
      salarioMensual: Number(form.salario || 0),
      variableMensual: Number(form.variable || 0),
      diasVacacionesDisfrutados: Number(form.vacaciones || 0),
      diasSalarioPendiente: Number(form.pendientes || 0),
    };
    const v = validarLiquidacion(datos);
    setErrors(v);
    if (Object.keys(v).length) {
      setResultado(null);
      setTimeout(() => (document.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus(), 0);
      return;
    }
    setResultado(calcularLiquidacion(datos));
    setTimeout(() => document.getElementById('resultado')?.focus(), 0);
  }

  return (
    <div className="page py-10">
      <PageHeader title="Calcula tu liquidación">
        Estima lo que te corresponde al terminar tu contrato: cesantías, intereses, prima, vacaciones y, si te despidieron sin justa causa,
        la indemnización. Tus datos no salen de este navegador.
      </PageHeader>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <form onSubmit={calcular} noValidate className="space-y-6" aria-label="Datos del contrato">
          <fieldset>
            <legend className="label">Tipo de contrato</legend>
            <div className="mt-2 flex flex-wrap gap-6">
              {(['indefinido', 'fijo'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2">
                  <input type="radio" name="tipo" className="h-4 w-4 accent-teal" checked={form.tipoContrato === t}
                    onChange={() => { set('tipoContrato', t); if (t === 'indefinido' && form.motivo === 'fin_plazo') set('motivo', 'renuncia'); }} />
                  {t === 'indefinido' ? 'Término indefinido' : 'Término fijo'}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Motivo del retiro" error={errors.motivo}>
            {(p) => (
              <select {...p} className="input" value={form.motivo} onChange={(e) => set('motivo', e.target.value)}>
                {motivos.filter((m) => m.tipos.includes(form.tipoContrato)).map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fecha de ingreso" error={errors.fechaIngreso}>
              {(p) => <input {...p} type="date" className="input" value={form.fechaIngreso} onChange={(e) => set('fechaIngreso', e.target.value)} />}
            </Field>
            <Field label="Fecha de retiro" error={errors.fechaRetiro}>
              {(p) => <input {...p} type="date" className="input" value={form.fechaRetiro} onChange={(e) => set('fechaRetiro', e.target.value)} />}
            </Field>
          </div>

          {form.tipoContrato === 'fijo' && form.motivo === 'despido_sin_justa_causa' && (
            <Field label="Fecha en que vencía el contrato" error={errors.fechaFinPactada} hint="La indemnización equivale a los salarios del tiempo que faltaba.">
              {(p) => <input {...p} type="date" className="input" value={form.fechaFinPactada} onChange={(e) => set('fechaFinPactada', e.target.value)} />}
            </Field>
          )}

          <Field label="Salario mensual" error={errors.salarioMensual} hint={`Salario fijo, sin auxilio de transporte. El mínimo de ${VALORES_2026.anio} es ${pesos(VALORES_2026.salarioMinimo)}.`}>
            {(p) => <input {...p} inputMode="numeric" className="input" placeholder="$" value={conMiles(form.salario)} onChange={(e) => set('salario', soloDigitos(e.target.value))} />}
          </Field>
          <Field label="Horas extra, recargos y comisiones" optional error={errors.variableMensual} hint="Promedio mensual de lo que recibes además del salario fijo.">
            {(p) => <input {...p} inputMode="numeric" className="input" placeholder="$ 0" value={conMiles(form.variable)} onChange={(e) => set('variable', soloDigitos(e.target.value))} />}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Días de vacaciones ya disfrutados" error={errors.diasVacacionesDisfrutados} hint="Días hábiles en todo el contrato.">
              {(p) => <input {...p} inputMode="numeric" className="input" value={form.vacaciones} onChange={(e) => set('vacaciones', soloDigitos(e.target.value))} />}
            </Field>
            <Field label="Días de salario que te deben" error={errors.diasSalarioPendiente} hint="Por ejemplo, los últimos días del mes.">
              {(p) => <input {...p} inputMode="numeric" className="input" value={form.pendientes} onChange={(e) => set('pendientes', soloDigitos(e.target.value))} />}
            </Field>
          </div>

          <button type="submit" className="btn-primary px-6">Calcular liquidación</button>
        </form>

        <section id="resultado" tabIndex={-1} aria-live="polite" aria-labelledby="resultado-titulo" className="focus:outline-none">
          <h2 id="resultado-titulo" className="sr-only">Resultado</h2>
          {resultado ? <Desprendible r={resultado} /> : (
            <div className="rounded-md bg-mist px-6 py-10 sm:px-8">
              <p className="text-2xl font-serif">Tu liquidación aparecerá aquí</p>
              <p className="mt-2 max-w-prose text-slate">Completa los datos y pulsa «Calcular liquidación». Verás cada concepto con su cálculo y la norma que lo respalda.</p>
            </div>
          )}
        </section>
      </div>

      <ComoSeCalcula>
        <p>
          La calculadora usa la convención de nómina de meses de 30 días y años de 360. Suma estos conceptos:
        </p>
        <ul>
          <li>
            <strong>Cesantías del año en curso:</strong> base × días trabajados en el año ÷ 360. Se presume que las de años anteriores ya
            se consignaron en tu fondo.
          </li>
          <li><strong>Intereses de las cesantías:</strong> cesantías × días × 12 % ÷ 360.</li>
          <li><strong>Prima del semestre en curso:</strong> base × días trabajados en el semestre ÷ 360.</li>
          <li>
            <strong>Vacaciones pendientes:</strong> 15 días hábiles por año trabajado, menos los que ya disfrutaste, pagados con tu salario fijo
            ÷ 30.
          </li>
          <li><strong>Salario pendiente:</strong> los días trabajados que aún no te pagaron, con su auxilio de transporte si aplica.</li>
          <li>
            <strong>Indemnización (solo si te despidieron sin justa causa):</strong> en contrato a término fijo, los salarios del tiempo que
            faltaba; en contrato indefinido, 30 días por el primer año y 20 por cada año adicional, o 20 y 15 si ganas 10 salarios mínimos o
            más (art. 64 del CST).
          </li>
        </ul>
        <p>
          La <strong>base</strong> de cesantías, intereses y prima es tu salario más el promedio de pagos variables, y el auxilio de
          transporte si ganas hasta 2 salarios mínimos. Las vacaciones no incluyen el auxilio de transporte.
        </p>
        <p>
          Sobre el salario pendiente se descuentan salud y pensión (4 % cada una) y, si ganas desde 4 salarios mínimos, el Fondo de
          Solidaridad Pensional. No incluye la retención en la fuente.
        </p>
      </ComoSeCalcula>

      <CalculatorGuideLinks path="/liquidacion" />
    </div>
  );
}

function Desprendible({ r }: { r: ResultadoLiquidacion }) {
  return (
    <div className="folio p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4 text-sm text-slate">
        <div className="flex items-center gap-3">
          <span>Liquidación estimada</span>
          <PrintButton />
        </div>
        <span>{r.diasLaborados.toLocaleString('es-CO')} días laborados</span>
      </div>
      <Lista titulo="Lo que te deben pagar" items={r.conceptos} />
      {r.deducciones.length > 0 && <Lista titulo="Descuentos" items={r.deducciones} negativo />}
      <dl className="mt-6 space-y-2 border-t-2 border-ink pt-4">
        <div className="flex justify-between gap-4"><dt>Total a favor</dt><dd className="tabular-nums">{pesos(r.totalConceptos)}</dd></div>
        {r.totalDeducciones > 0 && <div className="flex justify-between gap-4"><dt>Descuentos</dt><dd className="tabular-nums">−{pesos(r.totalDeducciones)}</dd></div>}
        <div className="flex items-baseline justify-between gap-4 pt-2">
          <dt className="font-serif text-xl">Neto estimado</dt>
          <dd className="font-serif text-3xl tabular-nums">{pesos(r.neto)}</dd>
        </div>
      </dl>
      <div className="mt-6 space-y-3">
        {r.avisos.map((a) => <p key={a} className="text-sm text-slate"><TextoCst texto={a} /></p>)}
        <Alert tone="warning" title="Es una estimación, no tu liquidación oficial">
          Usa convención 30/360, supone que las prestaciones de años anteriores ya te las pagaron o consignaron y no contempla todos los casos
          especiales. Para entender cada concepto y qué hacer si no te pagan, lee la guía{' '}
          <Link to="/derechos/liquidacion-al-terminar-el-contrato" className="btn-link">Liquidación al terminar el contrato</Link>.
        </Alert>
        <CalcSharePrompt
          categoria="salario-y-pagos"
          motivo="¿Tu empresa no te pagó la liquidación completa o demoró los pagos?"
          mensaje="Tu testimonio ayuda a que otras personas conozcan el cumplimiento laboral real de la empresa."
        />
      </div>
    </div>
  );
}

function Lista({ titulo, items, negativo }: { titulo: string; items: ResultadoLiquidacion['conceptos']; negativo?: boolean }) {
  return (
    <section className="mt-5">
      <h3 className="font-sans text-sm font-semibold text-slate">{titulo}</h3>
      <ul className="mt-2">
        {items.map((c) => (
          <li key={c.clave} className="border-b border-dashed border-line py-3">
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-semibold">{c.nombre}</span>
              <span className="tabular-nums">{negativo ? '−' : ''}{pesos(c.valor)}</span>
            </div>
            <p className="mt-1 text-sm text-slate">{c.detalle}. <span className="whitespace-nowrap"><TextoCst texto={c.norma} /></span></p>
          </li>
        ))}
      </ul>
    </section>
  );
}
