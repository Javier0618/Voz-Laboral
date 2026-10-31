import { useState } from 'react';
import { calcularHonorarios, type DatosHonorarios, type ResultadoHonorarios } from '../../lib/honorarios';
import { VALORES_2026 } from '../../lib/liquidacion';
import { Alert, Field, PageHeader } from '../../components/ui';
import { CalcSharePrompt } from '../../components/CalcSharePrompt';
import { PrintButton } from '../../components/PrintButton';

const pesos = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;
const soloDigitos = (s: string) => s.replace(/\D/g, '');
const conMiles = (s: string) => (s ? Number(s).toLocaleString('es-CO') : '');

export default function PrestacionServiciosPage() {
  const [honorarios, setHonorarios] = useState('');
  const [riesgo, setRiesgo] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [aplicaRetencion, setAplicaRetencion] = useState(true);
  const [porcentajeRetencion, setPorcentajeRetencion] = useState(11);
  const [resultado, setResultado] = useState<ResultadoHonorarios | null>(null);

  function calcular(e: React.FormEvent) {
    e.preventDefault();
    const valor = Number(honorarios || 0);
    if (valor <= 0) return;
    const datos: DatosHonorarios = {
      honorariosMensuales: valor,
      claseRiesgoARL: riesgo,
      aplicaRetencion,
      porcentajeRetencion,
      esDeclaranteRenta: true,
    };
    setResultado(calcularHonorarios(datos));
  }

  return (
    <div className="page py-10">
      <PageHeader title="Calculadora para Prestación de Servicios (OPS e Independientes)">
        Calcula cuánto debes pagar de seguridad social (salud, pensión y ARL) sobre el 40 % de tu contrato y cuál es tu ingreso neto real.
      </PageHeader>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <form onSubmit={calcular} noValidate className="space-y-6" aria-label="Datos del contrato de prestación de servicios">
          <Field
            label="Valor mensual de los honorarios antes de descuentos"
            hint={`Si tu contrato es por un valor global, divide el valor total entre los meses de duración. Mínimo 2026: ${pesos(VALORES_2026.salarioMinimo)}.`}
          >
            {(p) => (
              <input
                {...p}
                inputMode="numeric"
                className="input"
                placeholder="$"
                value={conMiles(honorarios)}
                onChange={(e) => {
                  setHonorarios(soloDigitos(e.target.value));
                  setResultado(null);
                }}
              />
            )}
          </Field>

          <Field label="Clase de riesgo ARL">
            {(p) => (
              <select
                {...p}
                className="input"
                value={riesgo}
                onChange={(e) => {
                  setRiesgo(Number(e.target.value) as 1 | 2 | 3 | 4 | 5);
                  setResultado(null);
                }}
              >
                <option value={1}>Clase I (0.522%) – Oficinas, actividades administrativas, docentes</option>
                <option value={2}>Clase II (1.044%) – Comercio, labores agrícolas o manufactureras livianas</option>
                <option value={3}>Clase III (2.436%) – Procesos industriales, transporte, almacenes</option>
                <option value={4}>Clase IV (4.350%) – Transporte pesado, metalmecánica (lo asume contratante)</option>
                <option value={5}>Clase V (6.960%) – Construcción, minería, bomberos (lo asume contratante)</option>
              </select>
            )}
          </Field>

          <div className="space-y-3 rounded border border-line p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-teal"
                checked={aplicaRetencion}
                onChange={(e) => {
                  setAplicaRetencion(e.target.checked);
                  setResultado(null);
                }}
              />
              <span className="font-semibold text-sm">Aplicar retención en la fuente a título de renta</span>
            </label>

            {aplicaRetencion && (
              <div className="pt-2">
                <Field label="Tarifa de retención en la fuente">
                  {(p) => (
                    <select
                      {...p}
                      className="input"
                      value={porcentajeRetencion}
                      onChange={(e) => {
                        setPorcentajeRetencion(Number(e.target.value));
                        setResultado(null);
                      }}
                    >
                      <option value={11}>11 % – Declarantes de renta (servicios calificados / honorarios)</option>
                      <option value={10}>10 % – No declarantes de renta (honorarios estándar)</option>
                      <option value={4}>4 % – Servicios generales (predominio manual o físico)</option>
                      <option value={6}>6 % – Servicios generales no declarantes</option>
                    </select>
                  )}
                </Field>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary px-6">Calcular pagos netos</button>
        </form>

        <section id="resultado" tabIndex={-1} aria-live="polite" className="focus:outline-none">
          {resultado ? (
            <div className="folio p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4 text-sm text-slate">
                <div className="flex items-center gap-3">
                  <span>Desglose mensual de honorarios</span>
                  <PrintButton />
                </div>
                <span>IBC: {pesos(resultado.ibc)} (40 %)</span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between gap-4 border-b border-line pb-2">
                  <span className="font-semibold">Honorarios brutos</span>
                  <span className="tabular-nums font-semibold">{pesos(resultado.honorarios)}</span>
                </div>

                <div>
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate">Seguridad Social (Planilla PILA)</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    <li className="flex justify-between gap-4">
                      <span>Salud (12.5 % de IBC)</span>
                      <span className="tabular-nums text-slate">−{pesos(resultado.salud)}</span>
                    </li>
                    <li className="flex justify-between gap-4">
                      <span>Pensión (16 % de IBC)</span>
                      <span className="tabular-nums text-slate">−{pesos(resultado.pension)}</span>
                    </li>
                    <li className="flex justify-between gap-4">
                      <span>ARL ({resultado.porcentajeArl.toFixed(3)} %)</span>
                      <span className="tabular-nums text-slate">
                        {riesgo >= 4 ? 'A cargo de la empresa ($0)' : `−${pesos(resultado.arl)}`}
                      </span>
                    </li>
                    <li className="flex justify-between gap-4 border-t border-dashed border-line pt-2 font-medium">
                      <span>Total aportes seguridad social</span>
                      <span className="tabular-nums text-danger">−{pesos(resultado.totalSeguridadSocial)}</span>
                    </li>
                  </ul>
                </div>

                {resultado.retencionFuente > 0 && (
                  <div className="border-t border-line pt-3">
                    <div className="flex justify-between gap-4 text-sm">
                      <span>Retención en la fuente ({porcentajeRetencion} %)</span>
                      <span className="tabular-nums text-danger">−{pesos(resultado.retencionFuente)}</span>
                    </div>
                  </div>
                )}

                <div className="border-t-2 border-ink pt-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-serif text-xl">Neto real en tu bolsillo</dt>
                    <dd className="font-serif text-3xl font-semibold tabular-nums text-teal-strong">{pesos(resultado.netoRecibir)}</dd>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {resultado.avisos.map((av) => (
                  <p key={av} className="text-xs text-slate">{av}</p>
                ))}
                <Alert tone="warning" title="¿Subordinación o verdadero contratista?">
                  Si cumples horario fijo, tienes órdenes directas y recibes llamados de atención constantes, podrías estar ante un
                  <strong> contrato de trabajo disfrazado</strong> (principio de primacía de la realidad, CST art. 24).
                </Alert>
                <CalcSharePrompt
                  categoria="contrato-y-condiciones"
                  motivo="¿Te contrataron por prestación de servicios pero te exigen horario y subordinación?"
                  mensaje="Cuenta tu experiencia y ayuda a advertir sobre la tercerización o contratos disfrazados."
                />
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-mist px-6 py-10 sm:px-8">
              <p className="font-serif text-2xl">Tu cálculo de honorarios aparecerá aquí</p>
              <p className="mt-2 max-w-prose text-slate">
                Ingresa el valor mensual pactado para saber exactamente cuánto pagarás en la planilla PILA y cuánto te retiene la empresa.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
