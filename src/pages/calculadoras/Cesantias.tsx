import { useState } from 'react';
import { calcularCesantias, type DatosCesantias, type ResultadoCesantias } from '../../lib/cesantias';
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

export default function CesantiasPage() {
  const [salario, setSalario] = useState('');
  const [variables, setVariables] = useState('');
  const [dias, setDias] = useState('360');
  const [anio, setAnio] = useState<number>(ULTIMO_ANIO);
  const [resultado, setResultado] = useState<ResultadoCesantias | null>(null);

  function calcular(e: React.FormEvent) {
    e.preventDefault();
    const datos: DatosCesantias = {
      salarioBase: Number(salario || 0),
      promedioVariables: Number(variables || 0),
      diasTrabajadosAnio: Number(dias || 360),
    };
    if (datos.salarioBase <= 0) return;
    setResultado(calcularCesantias(datos, valoresDe(anio)));
  }

  return (
    <div className="page py-10">
      <PageHeader title="Calculadora de Cesantías e Intereses de Cesantías" sharePath="/calculadoras/cesantias/">
        Calcula el valor que tu empleador debe consignar a tu fondo de cesantías antes del 14 de febrero y los intereses que te debe pagar en enero.
      </PageHeader>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <form onSubmit={calcular} noValidate className="space-y-6" aria-label="Datos para el cálculo de cesantías">
          <SelectorAnio anio={anio} onChange={(a) => { setAnio(a); setResultado(null); }} />

          <Field
            label="Salario básico mensual"
            hint={`El mínimo de ${anio} es ${pesos(valoresDe(anio).salarioMinimo)}.`}
          >
            {(p) => (
              <input
                {...p}
                inputMode="numeric"
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
            label="Promedio mensual de horas extra, recargos y comisiones en el año"
            optional
            hint="Promedio de ingresos variables recibidos durante el año."
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
            label="Días laborados en el año (hasta 360)"
            hint="360 días para el año completo; si ingresaste durante el año, ingresa los días proporcionales."
          >
            {(p) => (
              <input
                {...p}
                type="number"
                min="1"
                max="360"
                className="input"
                value={dias}
                onChange={(e) => {
                  setDias(e.target.value);
                  setResultado(null);
                }}
              />
            )}
          </Field>

          <button type="submit" className="btn-primary px-6">Calcular cesantías</button>
        </form>

        <section id="resultado" tabIndex={-1} aria-live="polite" className="focus:outline-none">
          {resultado ? (
            <div className="folio p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4 text-sm text-slate">
                <div className="flex items-center gap-3">
                  <span>Cesantías e Intereses</span>
                  <PrintButton />
                </div>
                <span>Días calculados: {resultado.diasTrabajados}</span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between gap-4 text-sm border-b border-line pb-2">
                  <span className="text-slate">Base de liquidación</span>
                  <span className="tabular-nums font-semibold">{pesos(resultado.baseCalculo)}</span>
                </div>

                <div className="rounded-lg bg-mist p-4 space-y-3">
                  <div className="flex justify-between items-baseline gap-4">
                    <div>
                      <p className="font-semibold text-ink">Cesantías (Al Fondo)</p>
                      <p className="text-xs text-slate">{resultado.fechaLimiteFondo}</p>
                    </div>
                    <span className="font-serif text-2xl font-semibold tabular-nums text-navy">{pesos(resultado.cesantias)}</span>
                  </div>

                  <div className="border-t border-line pt-3 flex justify-between items-baseline gap-4">
                    <div>
                      <p className="font-semibold text-ink">Intereses de cesantías (En nómina)</p>
                      <p className="text-xs text-slate">{resultado.fechaLimiteIntereses}</p>
                    </div>
                    <span className="font-serif text-2xl font-semibold tabular-nums text-teal-strong">{pesos(resultado.interesesCesantias)}</span>
                  </div>
                </div>

                <div className="border-t-2 border-ink pt-4 flex items-baseline justify-between gap-4">
                  <dt className="font-serif text-xl">Total beneficio económico</dt>
                  <dd className="font-serif text-3xl font-semibold tabular-nums">{pesos(resultado.total)}</dd>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Alert tone="info" title="Sanción por no consignar a tiempo">
                  Si el empleador no consigna las cesantías antes de la medianoche del 14 de febrero, la ley establece una indemnización moratoria
                  de un día de salario por cada día de retardo (Ley 50 de 1990, art. 99).
                </Alert>
                <CalcSharePrompt
                  categoria="salario-y-pagos"
                  motivo="¿Tu empresa no te consignó las cesantías o no te pagó los intereses?"
                  mensaje="Cuéntalo con un alias y alerta a otros trabajadores."
                />
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-mist px-6 py-10 sm:px-8">
              <p className="font-serif text-2xl">Tu resultado aparecerá aquí</p>
              <p className="mt-2 max-w-prose text-slate">
                Ingresa tu salario y días trabajados para conocer cuánto deben consignarte en el fondo y cuánto recibes en efectivo en enero.
              </p>
            </div>
          )}
        </section>
      </div>

      <ComoSeCalcula>
        <p>
          Las cesantías equivalen a un mes de salario por cada año trabajado (art. 249 del CST). Sobre ellas, el empleador te debe intereses
          del 12 % anual (Ley 52 de 1975).
        </p>
        <h3>Las fórmulas</h3>
        <p><strong>Cesantías = base × días trabajados en el año ÷ 360</strong></p>
        <p><strong>Intereses = cesantías × días trabajados × 12 % ÷ 360</strong></p>
        <ul>
          <li><strong>Base:</strong> tu salario más el promedio de pagos variables, y el auxilio de transporte si ganas hasta 2 salarios mínimos.</li>
          <li><strong>Días:</strong> hasta 360 por año. Si no trabajaste el año completo, el cálculo es proporcional.</li>
        </ul>
        <h3>Fechas</h3>
        <ul>
          <li>Los intereses se te pagan directamente a más tardar el 31 de enero.</li>
          <li>Las cesantías se consignan en tu fondo antes del 15 de febrero (art. 99 de la Ley 50 de 1990).</li>
        </ul>
        <h3>Ejemplo</h3>
        <p>
          Con una base de $2.000.000 (salario mínimo más auxilio de transporte de 2026) y el año completo: cesantías de $2.000.000 e
          intereses de $2.000.000 × 360 × 12 % ÷ 360 = $240.000.
        </p>
      </ComoSeCalcula>

      <CalculatorGuideLinks path="/calculadoras/cesantias" />
    </div>
  );
}
