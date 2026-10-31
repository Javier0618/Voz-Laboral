import { useState } from 'react';
import { calcularPrima, type DatosPrima, type ResultadoPrima } from '../../lib/prima';
import { VALORES_2026 } from '../../lib/liquidacion';
import { Alert, Field, PageHeader } from '../../components/ui';
import { CalcSharePrompt } from '../../components/CalcSharePrompt';
import { PrintButton } from '../../components/PrintButton';

const pesos = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;
const soloDigitos = (s: string) => s.replace(/\D/g, '');
const conMiles = (s: string) => (s ? Number(s).toLocaleString('es-CO') : '');

export default function PrimaPage() {
  const [salario, setSalario] = useState('');
  const [variables, setVariables] = useState('');
  const [dias, setDias] = useState('180');
  const [semestre, setSemestre] = useState<'primer' | 'segundo'>('primer');
  const [resultado, setResultado] = useState<ResultadoPrima | null>(null);

  function calcular(e: React.FormEvent) {
    e.preventDefault();
    const datos: DatosPrima = {
      salarioBase: Number(salario || 0),
      promedioVariables: Number(variables || 0),
      diasSemestre: Number(dias || 180),
    };
    if (datos.salarioBase <= 0) return;
    setResultado(calcularPrima(datos, semestre));
  }

  return (
    <div className="page py-10">
      <PageHeader title="Calculadora de Prima de Servicios">
        Estima el valor de tu prima semestral en Colombia (junio o diciembre). Incluye auxilio de transporte si devengas hasta 2 SMMLV.
      </PageHeader>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <form onSubmit={calcular} noValidate className="space-y-6" aria-label="Datos para el cálculo de prima">
          <fieldset>
            <legend className="label">Semestre a calcular</legend>
            <div className="mt-2 flex flex-wrap gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="semestre"
                  className="h-4 w-4 accent-teal"
                  checked={semestre === 'primer'}
                  onChange={() => setSemestre('primer')}
                />
                Primer semestre (enero a junio, se paga hasta el 30 de junio)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="semestre"
                  className="h-4 w-4 accent-teal"
                  checked={semestre === 'segundo'}
                  onChange={() => setSemestre('segundo')}
                />
                Segundo semestre (julio a diciembre, se paga hasta el 20 de diciembre)
              </label>
            </div>
          </fieldset>

          <Field
            label="Salario básico mensual"
            hint={`El mínimo de ${VALORES_2026.anio} es ${pesos(VALORES_2026.salarioMinimo)}.`}
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
            label="Días laborados en el semestre"
            hint="180 días si trabajaste el semestre completo. Si ingresaste a mitad de período, pon los días proporcionales."
          >
            {(p) => (
              <input
                {...p}
                type="number"
                min="1"
                max="180"
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
                Ingresa tu salario y pulsa «Calcular prima». Te diremos el valor exacto a recibir y la fecha límite de pago.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
