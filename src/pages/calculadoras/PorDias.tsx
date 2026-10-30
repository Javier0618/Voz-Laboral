import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { calcularPorDias, type Turno } from '../../lib/nomina';
import { PageHeader } from '../../components/ui';
import { setPageMeta } from '../../lib/meta';
import { calculadoraPorPath, metaCalculadora } from '../../lib/calculadoras';
import {
  CalendarioTurnos, ComoSeCalcula, DesprendibleView, ExplicacionDescanso, MoneyInput, NumberInput, PeriodoFields, periodoActual, rangoPeriodo, turnosLista,
  type Turnos,
} from '../../components/nomina';
import { periodoTitulo } from './Administrativos';

export default function PorDias() {
  useEffect(() => {
    const info = calculadoraPorPath('/calculadoras/por-dias');
    if (info) setPageMeta(metaCalculadora(info));
    return () => setPageMeta(null);
  }, []);

  const [periodo, setPeriodo] = useState(periodoActual());
  const [forma, setForma] = useState<'dia' | 'mensual'>('dia');
  const [valor, setValor] = useState(0);
  const [horasJornada, setHorasJornada] = useState(8);
  const [turnos, setTurnos] = useState<Turnos>({});
  const [cotizacion, setCotizacion] = useState<'ordinaria' | 'semanas'>('ordinaria');
  const [otrosIngresos, setOtrosIngresos] = useState(0);
  const [otrosDescuentos, setOtrosDescuentos] = useState(0);
  const rango = rangoPeriodo({ ...periodo, periodicidad: 'mensual' });
  const valorDia = forma === 'dia' ? valor : valor / 30;
  const plantilla: Turno = { fecha: rango.desde, entrada: '08:00', salida: '17:00', descansoMin: 60 };
  const lista = turnosLista(turnos).filter((t) => t.fecha >= rango.desde && t.fecha <= rango.hasta);
  const r = valorDia > 0 && horasJornada > 0
    ? calcularPorDias({ valorDia, horasJornada, turnos: lista, cotizacion, otrosIngresos, otrosDescuentos })
    : null;

  return (
    <div className="page py-10">
      <p className="text-sm text-slate"><Link to="/calculadoras" className="hover:text-ink hover:underline">Calculadoras</Link></p>
      <PageHeader title="Nómina por días">
        Para quienes trabajan algunos días del mes o cobran por jornada: servicio doméstico por días, meseros, personal de eventos, ayudantes
        de construcción, reemplazos. Marca los días que trabajaste y la calculadora suma jornadas, recargos y descuentos.
      </PageHeader>

      <div className="mt-10 grid gap-12 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()} aria-label="Datos de la nómina por días">
          <PeriodoFields value={periodo} onChange={setPeriodo} quincenas={false} />

          <fieldset className="space-y-4">
            <legend className="font-sans text-base font-semibold">¿Cómo te pagan?</legend>
            <div className="flex flex-wrap gap-2">
              {([['dia', 'Por día trabajado'], ['mensual', 'Salario mensual (prorrateado)']] as const).map(([v, l]) => (
                <button key={v} type="button" aria-pressed={forma === v} onClick={() => setForma(v)}
                  className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold ${forma === v ? 'border-ink bg-ink text-white' : 'border-line bg-paper'}`}>
                  {l}
                </button>
              ))}
            </div>
            <MoneyInput label={forma === 'dia' ? 'Valor por día' : 'Salario mensual'} value={valor} onChange={setValor}
              hint={forma === 'mensual' ? 'Se divide entre 30 para obtener el valor del día.' : undefined} />
            <NumberInput label="Horas de tu jornada por día" suffix="h" value={horasJornada} onChange={setHorasJornada}
              hint="Sirve para calcular recargos y horas extra cuando el turno se alarga." />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="font-sans text-base font-semibold">Días trabajados</legend>
            <p className="text-sm text-slate">Toca cada día trabajado y confirma la hora de entrada, salida y descanso (el almuerzo no cuenta como trabajo). Llevas {lista.length} {lista.length === 1 ? 'día' : 'días'}.</p>
            <CalendarioTurnos fechas={rango.fechas} turnos={turnos} onChange={setTurnos} plantilla={plantilla} />
          </fieldset>

          <fieldset className="space-y-3 rounded border border-line p-4">
            <legend className="px-1 text-sm font-semibold">Cotización a seguridad social</legend>
            <div className="flex flex-wrap gap-2">
              {([['ordinaria', 'Ordinaria (4 % salud y 4 % pensión)'], ['semanas', 'Por semanas (menos de 30 días)']] as const).map(([v, l]) => (
                <button key={v} type="button" aria-pressed={cotizacion === v} onClick={() => setCotizacion(v)}
                  className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold ${cotizacion === v ? 'border-ink bg-ink text-white' : 'border-line bg-paper'}`}>
                  {l}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <MoneyInput label="Otros ingresos del período" value={otrosIngresos} onChange={setOtrosIngresos} />
            <MoneyInput label="Otros descuentos" value={otrosDescuentos} onChange={setOtrosDescuentos} />
          </div>
        </form>

        <section aria-live="polite" aria-label="Desprendible estimado" className="lg:sticky lg:top-6 lg:self-start">
          {r ? <DesprendibleView titulo={periodoTitulo({ ...periodo, periodicidad: 'mensual' })} d={r} /> : (
            <div className="rounded-md bg-mist px-6 py-10 sm:px-8">
              <p className="font-serif text-2xl">Tu desprendible aparecerá aquí</p>
              <p className="mt-2 max-w-prose text-slate">Escribe cuánto te pagan y marca los días que trabajaste.</p>
            </div>
          )}
        </section>
      </div>

      <ComoSeCalcula>
        <h3>Pago de las jornadas</h3>
        <p>
          Cada día marcado se paga con tu valor por día. Si te pagan un salario mensual, el valor del día es ese salario dividido entre 30. El
          valor de la hora es el del día dividido entre las horas de tu jornada.
        </p>
        <ExplicacionDescanso />
        <h3>Recargos y horas extra</h3>
        <p>
          Las horas de noche (de 7:00 p. m. a 6:00 a. m.) pagan un 35 % más; las de domingo o festivo, un 90 % más desde julio de 2026; y lo
          que pasa de tu jornada, como hora extra (CST, arts. 160, 168 y 179). Las horas extra no pueden pasar de 2 al día ni de 12 a la
          semana (CST, art. 167A); si las pasas, el desprendible te avisa.
        </p>
        <h3>Auxilio de transporte</h3>
        <p>
          Si tu salario equivalente al mes no pasa de 2 salarios mínimos, recibes el auxilio en proporción a los días trabajados (Decreto 1470
          de 2025).
        </p>
        <h3>Seguridad social</h3>
        <p>
          En la cotización ordinaria aportas 4 % a salud y 4 % a pensión, con una base mínima de un salario mínimo (Ley 100 de 1993). Si
          trabajas menos de 30 días y ganas menos de un mínimo, tu empleador puede cotizar por semanas: la base de pensión es una cuarta parte
          del mínimo por cada semana, según los días trabajados (1 a 7 días, una; 8 a 14, dos; 15 a 21, tres; más de 21, cuatro), y no se
          descuenta salud (Decreto 2616 de 2013, arts. 5 y 6).
        </p>
        <h3>Prestaciones</h3>
        <p>
          Trabajar por días no quita el derecho a prima, cesantías y vacaciones en proporción al tiempo trabajado (CST, art. 306). Puedes
          estimarlas en la <Link to="/liquidacion" className="btn-link">calculadora de liquidación</Link>.
        </p>
        <h3>Si trabajas por tu cuenta</h3>
        <p>Esta calculadora es para trabajadores con empleador. Si eres independiente, tus aportes se calculan con otras reglas.</p>
      </ComoSeCalcula>
    </div>
  );
}
