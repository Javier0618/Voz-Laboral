import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  calcularLiquidacion, validarLiquidacion, valoresDe, VALORES_2026,
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

type ModoSalario = 'minimo' | 'fijo' | 'anios';
const fechaValida = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Años calendario que abarca el contrato, si las fechas son válidas y están en orden. */
function aniosDelContrato(ingreso: string, retiro: string): number[] {
  if (!fechaValida(ingreso) || !fechaValida(retiro) || retiro < ingreso) return [];
  const a = Number(ingreso.slice(0, 4));
  const b = Number(retiro.slice(0, 4));
  return b - a > 40 ? [] : Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

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
    baseVacaciones: '',
    vacaciones: '0',
    pendientes: '0',
    modoSalario: 'minimo' as ModoSalario,
    cesantiasAnteriores: false,
    primasAnteriores: false,
  });
  const [salariosAnio, setSalariosAnio] = useState<Record<number, string>>({});
  const anios = aniosDelContrato(form.fechaIngreso, form.fechaRetiro);
  const anioRetiro = anios[anios.length - 1];
  // Hay primas vencidas si el contrato empezó antes del semestre en que terminó.
  const inicioSemestre = fechaValida(form.fechaRetiro) ? `${form.fechaRetiro.slice(0, 4)}-${Number(form.fechaRetiro.slice(5, 7)) <= 6 ? '01' : '07'}-01` : '';
  const hayPrimasAnteriores = Boolean(inicioSemestre) && form.fechaIngreso < inicioSemestre;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<ResultadoLiquidacion | null>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setResultado(null);
  };

  function calcular(e: React.FormEvent) {
    e.preventDefault();
    // La base de vacaciones puede diferir del último salario si hay remuneración variable.
    const salarioPorAnio: Record<number, number> | undefined =
      form.modoSalario === 'minimo' ? Object.fromEntries(anios.map((a) => [a, valoresDe(a).salarioMinimo]))
        : form.modoSalario === 'anios' ? Object.fromEntries(anios.map((a) => [a, Number(salariosAnio[a] || 0)]))
          : undefined;
    const ultimoSalario = salarioPorAnio && anioRetiro ? salarioPorAnio[anioRetiro] : Number(form.salario || 0);
    const datos: DatosLiquidacion = {
      tipoContrato: form.tipoContrato,
      motivo: form.motivo,
      fechaIngreso: form.fechaIngreso,
      fechaRetiro: form.fechaRetiro,
      fechaFinPactada: form.fechaFinPactada || undefined,
      salarioMensual: ultimoSalario || (form.modoSalario === 'fijo' ? 0 : 1),
      variableMensual: Number(form.variable || 0),
      baseVacacionesMensual: form.baseVacaciones ? Number(form.baseVacaciones) : undefined,
      diasVacacionesDisfrutados: Number(form.vacaciones || 0),
      diasSalarioPendiente: Number(form.pendientes || 0),
      salarioPorAnio,
      incluirCesantiasAnteriores: anios.length > 1 && form.cesantiasAnteriores,
      incluirPrimasAnteriores: hayPrimasAnteriores && form.primasAnteriores,
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
      <PageHeader title="Calcula tu liquidación" sharePath="/liquidacion">
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
              <select {...p} className="input" value={form.motivo} onChange={(e) => set('motivo', e.target.value as MotivoRetiro)}>
                {motivos.filter((m) => m.tipos.includes(form.tipoContrato)).map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            )}
          </Field>
          <p className="hint">
            La indemnización no está incluida en todas las terminaciones: la herramienta solo la calcula si eliges «Despido sin justa causa».
            Si renunciaste porque tu empleador incumplió gravemente el contrato (despido indirecto), el caso necesita una valoración distinta.
          </p>

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

          <fieldset>
            <legend className="label">¿Cómo fue tu salario durante el contrato?</legend>
            <div className="mt-2 space-y-2">
              {([
                ['minimo', 'El salario mínimo de cada año'],
                ['fijo', 'El mismo salario todo el tiempo'],
                ['anios', 'Cambió: lo escribo año por año'],
              ] as const).map(([m, label]) => (
                <label key={m} className="flex items-center gap-2">
                  <input type="radio" name="modo-salario" className="h-4 w-4 accent-teal" checked={form.modoSalario === m} onChange={() => set('modoSalario', m)} />
                  {label}
                </label>
              ))}
            </div>
            <p className="hint">Las cesantías, sus intereses y la prima de cada año se calculan con el salario y el auxilio de transporte de ese año.</p>
          </fieldset>

          {form.modoSalario === 'fijo' && (
            <Field label="Salario mensual" error={errors.salarioMensual} hint={`Salario fijo, sin auxilio de transporte. El mínimo de ${VALORES_2026.anio} es ${pesos(VALORES_2026.salarioMinimo)}.`}>
              {(p) => <input {...p} inputMode="numeric" className="input" placeholder="$" value={conMiles(form.salario)} onChange={(e) => set('salario', soloDigitos(e.target.value))} />}
            </Field>
          )}
          {form.modoSalario === 'minimo' && anios.length > 0 && (
            <ul className="rounded-md bg-mist px-4 py-3 text-sm">
              {anios.map((a) => {
                const v = valoresDe(a);
                return (
                  <li key={a} className="flex justify-between gap-4 py-0.5">
                    <span>{a}{v.aproximado ? ' (aún sin decreto: se usa el último conocido)' : ''}</span>
                    <span className="tabular-nums">{pesos(v.salarioMinimo)} + auxilio {pesos(v.auxilioTransporte)}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {form.modoSalario === 'minimo' && anios.length === 0 && <p className="hint">Escribe las fechas para ver el salario mínimo de cada año.</p>}
          {form.modoSalario === 'anios' && (
            anios.length === 0 ? <p className="hint">Escribe primero las fechas de ingreso y retiro.</p> : (
              <fieldset className="space-y-3">
                <legend className="label">Salario mensual de cada año</legend>
                {anios.map((a) => (
                  <Field key={a} label={`${a}`} hint={a === anioRetiro ? 'Tu último salario: referencia para la indemnización y la base de vacaciones si no indicas otra.' : undefined} error={errors.salarioPorAnio && !(Number(salariosAnio[a]) > 0) ? 'Indica el salario de este año.' : undefined}>
                    {(p) => <input {...p} inputMode="numeric" className="input" placeholder={`$ (mínimo: ${pesos(valoresDe(a).salarioMinimo)})`} value={conMiles(salariosAnio[a] ?? '')}
                      onChange={(e) => { setSalariosAnio((s) => ({ ...s, [a]: soloDigitos(e.target.value) })); setResultado(null); }} />}
                  </Field>
                ))}
              </fieldset>
            )
          )}
          <Field label="Horas extra, recargos y comisiones" optional error={errors.variableMensual} hint="Promedio mensual de lo que recibes además del salario fijo.">
            {(p) => <input {...p} inputMode="numeric" className="input" placeholder="$ 0" value={conMiles(form.variable)} onChange={(e) => set('variable', soloDigitos(e.target.value))} />}
          </Field>

          <Field label="Base mensual para pagar vacaciones" optional error={errors.baseVacacionesMensual} hint="Si tienes salario variable, indica el promedio mensual aplicable (por ejemplo, sueldo y comisiones). No incluyas auxilio de transporte. Si lo dejas vacío, se usa el último salario fijo.">
            {(p) => <input {...p} inputMode="numeric" className="input" placeholder="Opcional: $" value={conMiles(form.baseVacaciones)} onChange={(e) => set('baseVacaciones', soloDigitos(e.target.value))} />}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Días de vacaciones ya disfrutados" error={errors.diasVacacionesDisfrutados} hint="Días hábiles en todo el contrato.">
              {(p) => <input {...p} inputMode="numeric" className="input" value={form.vacaciones} onChange={(e) => set('vacaciones', soloDigitos(e.target.value))} />}
            </Field>
            <Field label="Días de salario que te deben" error={errors.diasSalarioPendiente} hint="Por ejemplo, los últimos días del mes.">
              {(p) => <input {...p} inputMode="numeric" className="input" value={form.pendientes} onChange={(e) => set('pendientes', soloDigitos(e.target.value))} />}
            </Field>
          </div>

          {(anios.length > 1 || hayPrimasAnteriores) && (
            <fieldset className="rounded-md border border-line p-4">
              <legend className="label px-1">¿Te quedaron debiendo algo de antes?</legend>
              <div className="mt-1 space-y-3">
                {anios.length > 1 && (
                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1 h-4 w-4 accent-teal" checked={form.cesantiasAnteriores} onChange={(e) => set('cesantiasAnteriores', e.target.checked)} />
                    <span>Mi empleador no consignó en el fondo las cesantías de {anios.slice(0, -1).join(', ')}.</span>
                  </label>
                )}
                {hayPrimasAnteriores && (
                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1 h-4 w-4 accent-teal" checked={form.primasAnteriores} onChange={(e) => set('primasAnteriores', e.target.checked)} />
                    <span>No me pagaron las primas de semestres anteriores.</span>
                  </label>
                )}
              </div>
              <p className="hint">Si no las marcas, se supone que ya te las pagaron o consignaron. Revisa el extracto de tu fondo de cesantías.</p>
            </fieldset>
          )}

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
            <strong>Cesantías, año por año:</strong> base de cada año × días trabajados en ese año ÷ 360, con el salario, el salario mínimo y
            el auxilio de transporte de ese año. En la liquidación van las del año en que terminó el contrato; las de años anteriores debieron
            consignarse en tu fondo y solo se suman, con sus intereses, si marcas que no se consignaron (Ley 50 de 1990, art. 99, num. 4).
          </li>
          <li><strong>Intereses de las cesantías:</strong> cesantías × días × 12 % ÷ 360.</li>
          <li><strong>Prima del semestre en curso:</strong> base × días trabajados en el semestre ÷ 360. Las de semestres anteriores se suman si marcas que no te las pagaron.</li>
          <li>
            <strong>Vacaciones pendientes:</strong> 15 días hábiles por año trabajado, menos los que ya disfrutaste, pagados con tu último
            salario fijo ÷ 30 (art. 189 del CST).
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
      {r.porAnio.length > 1 && <PorAnio r={r} />}
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
          Usa convención 30/360 y no contempla todos los casos especiales. Lo de años o semestres anteriores solo se suma si marcaste que no te lo
          pagaron. Para entender cada concepto y qué hacer si no te pagan, lee la guía{' '}
          <Link to="/derechos/liquidacion-al-terminar-el-contrato/" className="btn-link">Liquidación al terminar el contrato</Link>.
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

/** Lo causado en cada año: salario, auxilio, cesantías e intereses con los valores de ese año. */
function PorAnio({ r }: { r: ResultadoLiquidacion }) {
  const incluidas = r.conceptos.some((c) => c.clave === 'cesantias_anteriores');
  return (
    <section className="mt-6">
      <h3 className="font-sans text-sm font-semibold text-slate">Año por año</h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-slate">
              <th scope="col" className="py-2 pr-2 font-semibold">Año</th>
              <th scope="col" className="py-2 pr-2 text-right font-semibold">Días</th>
              <th scope="col" className="py-2 pr-2 text-right font-semibold">Salario + auxilio</th>
              <th scope="col" className="py-2 pr-2 text-right font-semibold">Cesantías</th>
              <th scope="col" className="py-2 text-right font-semibold">Intereses</th>
            </tr>
          </thead>
          <tbody>
            {r.porAnio.map((f) => (
              <tr key={f.anio} className="border-b border-dashed border-line align-top">
                <th scope="row" className="py-2 pr-2 text-left font-semibold">
                  {f.anio}
                  <span className="block text-xs font-normal text-slate">
                    {f.esUltimo ? 'En esta liquidación' : incluidas ? 'No consignadas: incluidas' : `Al fondo antes del 15 de febrero de ${f.anio + 1}`}
                  </span>
                </th>
                <td className="py-2 pr-2 text-right tabular-nums">{f.dias}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{pesos(Math.round(f.salario))}{f.auxilio > 0 && <span className="block text-xs text-slate">+ {pesos(f.auxilio)}</span>}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{pesos(Math.round(f.cesantias))}</td>
                <td className="py-2 text-right tabular-nums">{pesos(Math.round(f.intereses))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate">Cada año usa su propio salario, el salario mínimo y el auxilio de transporte de ese año. Las cesantías de cada año se liquidan el 31 de diciembre (Ley 50 de 1990, art. 99).</p>
    </section>
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
