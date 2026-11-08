import { useState } from 'react';
import { calcularPrima, type DatosPrima, type ResultadoPrima } from '../../lib/prima';
import { ULTIMO_ANIO, valoresDe } from '../../lib/liquidacion';
import { SelectorAnio } from '../../components/SelectorAnio';
import { Alert, Field, PageHeader } from '../../components/ui';
import { CalcSharePrompt } from '../../components/CalcSharePrompt';
import { PrintButton } from '../../components/PrintButton';
import { CalculatorGuideLinks } from '../../components/CalculatorGuideLinks';
import { ComoSeCalcula } from '../../components/ComoSeCalcula';

const pesos = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;
const soloDigitos = (s: string) => s.replace(/\D/g, '');
const conMiles = (s: string) => (s ? Number(s).toLocaleString('es-CO') : '');

export default function PrimaPage() {
  const [salario, setSalario] = useState('');
  const [variables, setVariables] = useState('');
  const [dias, setDias] = useState('180');
  const [auxilio, setAuxilio] = useState<'auto' | 'si' | 'no'>('auto');
  const [semestre, setSemestre] = useState<'primer' | 'segundo'>('primer');
  const [anio, setAnio] = useState<number>(ULTIMO_ANIO);
  const [resultado, setResultado] = useState<ResultadoPrima | null>(null);

  function calcular(e: React.FormEvent) {
    e.preventDefault();
    const datos: DatosPrima = {
      salarioBase: Number(salario || 0),
      promedioVariables: Number(variables || 0),
      diasSemestre: Number(dias),
      incluyeAuxilioTransporte: auxilio === 'auto' ? undefined : auxilio === 'si',
    };
    if (datos.salarioBase <= 0 || !Number.isInteger(datos.diasSemestre) || datos.diasSemestre < 1 || datos.diasSemestre > 180) return;
    setResultado(calcularPrima(datos, semestre, valoresDe(anio)));
  }

  return (
    <div className="page py-10">
      <PageHeader title="Calculadora de Prima de Servicios" sharePath="/calculadoras/prima/">
        Estima tu prima de junio o diciembre. El cálculo usa el salario, los pagos salariales variables y los días efectivamente trabajados; puedes ajustar si recibes auxilio de transporte.
      </PageHeader>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <form onSubmit={calcular} className="min-w-0 space-y-6" aria-label="Datos para el cálculo de prima">
          <fieldset>
            <legend className="label">Semestre a calcular</legend>
            <div className="mt-2 flex flex-wrap gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="semestre"
                  className="h-4 w-4 accent-teal"
                  checked={semestre === 'primer'}
                  onChange={() => { setSemestre('primer'); setResultado(null); }}
                />
                Primer semestre (enero a junio, se paga hasta el 30 de junio)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="semestre"
                  className="h-4 w-4 accent-teal"
                  checked={semestre === 'segundo'}
                  onChange={() => { setSemestre('segundo'); setResultado(null); }}
                />
                Segundo semestre (julio a diciembre, se paga hasta el 20 de diciembre)
              </label>
            </div>
          </fieldset>

          <SelectorAnio anio={anio} onChange={(a) => { setAnio(a); setResultado(null); }} />

          <Field
            label="Salario básico mensual (sin auxilio de transporte)"
            hint={`El mínimo de ${anio} es ${pesos(valoresDe(anio).salarioMinimo)}.`}
          >
            {(p) => (
              <input
                {...p}
                inputMode="numeric"
                required
                className="input"
                placeholder="$"
                value={conMiles(salario)}
                onChange={(e) => {
                  setSalario(soloDigitos(e.target.value));
                  setResultado(null);
                }}
              />
            )}
          </Field>

          <Field
            label="Promedio mensual de horas extra, recargos y comisiones"
            optional
            hint="Promedio de los ingresos salariales variables devengados en el semestre."
          >
            {(p) => (
              <input
                {...p}
                inputMode="numeric"
                className="input"
                placeholder="$ 0"
                value={conMiles(variables)}
                onChange={(e) => {
                  setVariables(soloDigitos(e.target.value));
                  setResultado(null);
                }}
              />
            )}
          </Field>

          <Field
            label="¿Te corresponde auxilio de transporte?"
            hint="El modo automático usa el salario básico y el límite de dos salarios mínimos. Ajusta la opción si conoces tu situación real; no todos los trabajadores reciben este auxilio."
          >
            {(props) => (
              <select {...props} className="input" value={auxilio} onChange={(ev) => { setAuxilio(ev.target.value as 'auto' | 'si' | 'no'); setResultado(null); }}>
                <option value="auto">Calcular automáticamente según salario</option>
                <option value="si">Sí, incluir auxilio</option>
                <option value="no">No, excluir auxilio</option>
              </select>
            )}
          </Field>

          <Field
            label="Días laborados en el semestre"
            hint="180 días si trabajaste el semestre completo. Si ingresaste a mitad de período, pon los días proporcionales."
          >
            {(p) => (
              <input
                {...p}
                type="number"
                min="1"
                max="180"
                step="1"
                required
                className="input"
                value={dias}
                onChange={(e) => {
                  setDias(e.target.value);
                  setResultado(null);
                }}
              />
            )}
          </Field>

          <button type="submit" className="btn-primary px-6">Calcular prima</button>
        </form>

        <section id="resultado" tabIndex={-1} aria-live="polite" className="focus:outline-none">
          {resultado ? (
            <div className="folio p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4 text-sm text-slate">
                <div className="flex items-center gap-3">
                  <span>Prima estimada ({semestre === 'primer' ? '1.ᵉʳ semestre' : '2.º semestre'})</span>
                  <PrintButton />
                </div>
                <span>Límite de pago: {resultado.fechaLimitePago}</span>
              </div>

              <dl className="mt-6 space-y-3">
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-slate">Base para liquidar</dt>
                  <dd className="tabular-nums font-semibold">{pesos(resultado.basePrima)}</dd>
                </div>
                {resultado.auxilioTransporte > 0 && (
                  <div className="flex justify-between gap-4 text-xs text-slate">
                    <dt>Incluye auxilio de transporte</dt>
                    <dd className="tabular-nums">+{pesos(resultado.auxilioTransporte)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-slate">Días tenidos en cuenta</dt>
                  <dd className="tabular-nums">{resultado.diasCalculados} de 180 días</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t-2 border-ink pt-4">
                  <dt className="font-serif text-xl">Valor total de la prima</dt>
                  <dd className="font-serif text-3xl font-semibold tabular-nums text-teal-strong">{pesos(resultado.valorPrima)}</dd>
                </div>
              </dl>

              <div className="mt-6 space-y-3">
                <p className="text-xs text-slate">Fórmula: {resultado.detalle}. Respaldo: {resultado.norma}.</p>
                <Alert tone="info" title="Plazo y obligatoriedad legal">
                  La prima de servicios equivale a un mes de salario por año trabajado (o proporcional) y no constituye salario.
                  Debe pagarse a más tardar el {resultado.fechaLimitePago}. Los trabajadores de servicio doméstico también tienen derecho (Ley 1788 de 2016).
                </Alert>
                <CalcSharePrompt
                  categoria="salario-y-pagos"
                  motivo="¿Tu empresa no te paga la prima a tiempo o no incluye los recargos?"
                  mensaje="Cuéntalo con un alias y ayuda a que otras personas conozcan el comportamiento de la empresa."
                />
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-mist px-6 py-10 sm:px-8">
              <p className="font-serif text-2xl">Tu prima calculada aparecerá aquí</p>
              <p className="mt-2 max-w-prose text-slate">
                Ingresa tu salario y pulsa «Calcular prima». Verás una estimación y la fecha límite de pago; compárala con tu caso y los soportes de nómina.
              </p>
            </div>
          )}
        </section>
      </div>

      <ComoSeCalcula>
        <p>
          La prima de servicios equivale a un mes de salario por cada año trabajado y se paga en dos partes: la primera a más tardar el 30
          de junio y la segunda a más tardar el 20 de diciembre (art. 306 del CST). Esta calculadora estima la prima de un semestre.
        </p>
        <h3>La fórmula</h3>
        <p><strong>Prima = base × días trabajados en el semestre ÷ 360</strong></p>
        <ul>
          <li><strong>Base:</strong> tu salario más el promedio de pagos variables (horas extra, recargos, comisiones).</li>
          <li><strong>Auxilio de transporte:</strong> se incluye cuando corresponde legalmente; el límite salarial por sí solo no garantiza que se reconozca en todos los casos. Puedes ajustar la selección.</li>
          <li><strong>Días:</strong> hasta 180 por semestre. Si entraste a mitad de semestre, se cuenta solo el tiempo trabajado.</li>
        </ul>
        <h3>Ejemplo</h3>
        <p>
          Con el salario mínimo de 2026 ($1.750.905) y el auxilio de transporte ($249.095), la base es $2.000.000. Por un semestre completo:
          $2.000.000 × 180 ÷ 360 = $1.000.000.
        </p>
      </ComoSeCalcula>

      <CalculatorGuideLinks path="/calculadoras/prima" />
    </div>
  );
}
