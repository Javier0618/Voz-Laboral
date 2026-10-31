import { useState } from 'react';
import { calcularSalarioNeto, type DatosSalarioNeto, type ResultadoSalarioNeto } from '../../lib/salarioNeto';
import { VALORES_2026 } from '../../lib/liquidacion';
import { Alert, Field, PageHeader } from '../../components/ui';
import { CalcSharePrompt } from '../../components/CalcSharePrompt';
import { PrintButton } from '../../components/PrintButton';

const pesos = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;
const soloDigitos = (s: string) => s.replace(/\D/g, '');
const conMiles = (s: string) => (s ? Number(s).toLocaleString('es-CO') : '');

export default function SalarioNetoPage() {
  const [bruto, setBruto] = useState('');
  const [noSalariales, setNoSalariales] = useState('');
  const [deduccionesVol, setDeduccionesVol] = useState('');
  const [resultado, setResultado] = useState<ResultadoSalarioNeto | null>(null);

  function calcular(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(bruto || 0);
    if (val <= 0) return;
    const datos: DatosSalarioNeto = {
      salarioBruto: val,
      otrosIngresosNoSalariales: Number(noSalariales || 0),
      deduccionesVoluntarias: Number(deduccionesVol || 0),
    };
    setResultado(calcularSalarioNeto(datos));
  }

  return (
    <div className="page py-10">
      <PageHeader title="Calculadora de Salario Neto vs. Bruto">
        ¿Te hicieron una oferta de trabajo o quieres saber cuánto te llegará a la cuenta bancaria? Calcula los descuentos de ley (salud, pensión, FSP y retención en la fuente).
      </PageHeader>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <form onSubmit={calcular} noValidate className="space-y-6" aria-label="Datos de la oferta salarial">
          <Field
            label="Salario mensual bruto ofrecido o pactado"
            hint={`El mínimo de ${VALORES_2026.anio} es ${pesos(VALORES_2026.salarioMinimo)}.`}
          >
            {(p) => (
              <input
                {...p}
                inputMode="numeric"
                className="input"
                placeholder="$"
                value={conMiles(bruto)}
                onChange={(e) => {
                  setBruto(soloDigitos(e.target.value));
                  setResultado(null);
                }}
              />
            )}
          </Field>

          <Field
            label="Auxilios o bonificaciones no salariales mensuales"
            optional
            hint="Valores pactados como no constitutivos de salario (ej. auxilio de rodamiento, alimentación)."
          >
            {(p) => (
              <input
                {...p}
                inputMode="numeric"
                className="input"
                placeholder="$ 0"
                value={conMiles(noSalariales)}
                onChange={(e) => {
                  setNoSalariales(soloDigitos(e.target.value));
                  setResultado(null);
                }}
              />
            )}
          </Field>

          <Field
            label="Aportes voluntarios / Deducciones tributarias (AFC, dependientes)"
            optional
            hint="Para reducir base de retención en la fuente si aplica."
          >
            {(p) => (
              <input
                {...p}
                inputMode="numeric"
                className="input"
                placeholder="$ 0"
                value={conMiles(deduccionesVol)}
                onChange={(e) => {
                  setDeduccionesVol(soloDigitos(e.target.value));
                  setResultado(null);
                }}
              />
            )}
          </Field>

          <button type="submit" className="btn-primary px-6">Calcular salario neto</button>
        </form>

        <section id="resultado" tabIndex={-1} aria-live="polite" className="focus:outline-none">
          {resultado ? (
            <div className="folio p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4 text-sm text-slate">
                <div className="flex items-center gap-3">
                  <span>Proyección de Nómina Mensual</span>
                  <PrintButton />
                </div>
                <span>IBC: {pesos(resultado.ibc)}</span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate">Salario bruto</span>
                  <span className="tabular-nums font-semibold">{pesos(resultado.salarioBruto)}</span>
                </div>
                {resultado.auxilioTransporte > 0 && (
                  <div className="flex justify-between gap-4 text-sm text-slate">
                    <span>Auxilio de transporte legal</span>
                    <span className="tabular-nums font-semibold text-teal-strong">+{pesos(resultado.auxilioTransporte)}</span>
                  </div>
                )}

                <div className="border-t border-line pt-3">
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate">Descuentos obligatorios</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    <li className="flex justify-between gap-4">
                      <span>Salud (4 %)</span>
                      <span className="tabular-nums text-slate">−{pesos(resultado.descuentoSalud)}</span>
                    </li>
                    <li className="flex justify-between gap-4">
                      <span>Pensión (4 %)</span>
                      <span className="tabular-nums text-slate">−{pesos(resultado.descuentoPension)}</span>
                    </li>
                    {resultado.descuentoFsp > 0 && (
                      <li className="flex justify-between gap-4">
                        <span>Fondo de Solidaridad Pensional</span>
                        <span className="tabular-nums text-slate">−{pesos(resultado.descuentoFsp)}</span>
                      </li>
                    )}
                    {resultado.retencionFuente > 0 && (
                      <li className="flex justify-between gap-4">
                        <span>Retención en la fuente (Art. 383 ET)</span>
                        <span className="tabular-nums text-danger">−{pesos(resultado.retencionFuente)}</span>
                      </li>
                    )}
                    <li className="flex justify-between gap-4 border-t border-dashed border-line pt-2 font-medium">
                      <span>Total deducciones de ley</span>
                      <span className="tabular-nums text-danger">−{pesos(resultado.totalDescuentosLey)}</span>
                    </li>
                  </ul>
                </div>

                <div className="border-t-2 border-ink pt-4 flex items-baseline justify-between gap-4">
                  <dt className="font-serif text-xl">Neto a consignar</dt>
                  <dd className="font-serif text-3xl font-semibold tabular-nums text-teal-strong">{pesos(resultado.salarioNeto)}</dd>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {resultado.avisos.map((av) => (
                  <p key={av} className="text-xs text-slate">{av}</p>
                ))}
                <Alert tone="info" title="Estimación según normas 2026">
                  Usa la tabla del art. 383 del Estatuto Tributario con UVT 2026 ($52.374) y la deducción automática del 25 % de renta exenta laboral.
                </Alert>
                <CalcSharePrompt
                  categoria="salario-y-pagos"
                  motivo="¿Te ofrecieron un salario en la entrevista y te pagaron menos en el contrato?"
                  mensaje="Comparte tu experiencia para advertir a futuros candidatos."
                />
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-mist px-6 py-10 sm:px-8">
              <p className="font-serif text-2xl">Tu salario neto aparecerá aquí</p>
              <p className="mt-2 max-w-prose text-slate">
                Ingresa el salario bruto ofrecido para conocer cuánto te descontarán legalmente de salud, pensión e impuestos.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
