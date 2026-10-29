import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { VALORES_2026 } from '../../lib/liquidacion';
import {
  calcularNomina, factorHora, HORAS_MES_DEFECTO, horasVacias, novedadesVacias, otrosVacios, TIPOS_HORA, valorarHoras,
  type Horas, type TipoHora,
} from '../../lib/nomina';
import { PageHeader } from '../../components/ui';
import {
  ComoSeCalcula, DesprendibleView, MoneyInput, NovedadesFields, NumberInput, OtrosFields, PeriodoFields, periodoActual, pesos, rangoPeriodo,
} from '../../components/nomina';

export default function Administrativos() {
  const [periodo, setPeriodo] = useState(periodoActual());
  const [salario, setSalario] = useState(0);
  const [horasMes, setHorasMes] = useState(HORAS_MES_DEFECTO);
  const [horas, setHoras] = useState<Horas>(horasVacias());
  const [novedades, setNovedades] = useState(novedadesVacias());
  const [otros, setOtros] = useState(otrosVacios());
  const rango = rangoPeriodo(periodo);
  const valorHora = salario / (horasMes || HORAS_MES_DEFECTO);

  const resultado = useMemo(() => {
    if (salario <= 0) return null;
    const r = calcularNomina({
      salarioMensual: salario, diasPeriodo: rango.diasNomina, fechaReferencia: rango.desde, horasMes: horasMes || HORAS_MES_DEFECTO,
      novedades, horasValoradas: { horas, valores: valorarHoras(horas, valorHora, rango.desde) }, otros,
    });
    // Sin fechas solo se puede comparar el total con 12 h por cada semana del período (CST, art. 167A).
    const extrasH = horas.HED + horas.HEN + horas.HEDD + horas.HEDN;
    const maximo = Math.round((12 * rango.diasNomina) / 7);
    if (extrasH > maximo) r.avisos.unshift(`Escribiste ${extrasH} horas extra: en ${rango.diasNomina} días la ley permite como máximo unas ${maximo} (2 al día y 12 a la semana, CST, art. 167A). Aun así, toda hora extra trabajada se debe pagar. Los sectores de seguridad privada y salud están exceptuados.`);
    return r;
  }, [salario, rango.diasNomina, rango.desde, horasMes, novedades, horas, valorHora, otros]);

  return (
    <div className="page py-10">
      <p className="text-sm text-slate"><Link to="/calculadoras" className="hover:text-ink hover:underline">Calculadoras</Link></p>
      <PageHeader title="Nómina para cargos administrativos">
        Para quienes tienen un salario fijo mensual: personal de oficina, auxiliares, analistas, vendedores internos. Escribe tu salario y,
        si los tuviste, tus horas extra, recargos y novedades. El desprendible se actualiza mientras escribes.
      </PageHeader>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()} aria-label="Datos de la nómina">
          <PeriodoFields value={periodo} onChange={setPeriodo} />
          <MoneyInput label="Salario mensual" value={salario} onChange={setSalario}
            hint={`Escribe siempre el salario del mes completo, aunque calcules una quincena. El mínimo de 2026 es ${pesos(VALORES_2026.salarioMinimo)}.`} />

          <fieldset className="space-y-4">
            <legend className="font-sans text-base font-semibold">Horas extra y recargos del período</legend>
            <p className="text-sm text-slate">
              Escribe la cantidad de horas. Valor de tu hora ordinaria: <strong>{pesos(valorHora)}</strong>.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {TIPOS_HORA.map(({ tipo, nombre, explicacion }) => (
                <NumberInput key={tipo} label={`${nombre} (${Math.round(factorHora(tipo, rango.desde) * 100)} %)`} hint={explicacion} suffix="h"
                  value={horas[tipo]} onChange={(n) => setHoras({ ...horas, [tipo as TipoHora]: n })} />
              ))}
            </div>
          </fieldset>

          <NovedadesFields value={novedades} onChange={setNovedades} />
          <OtrosFields value={otros} onChange={setOtros} />

          <details className="rounded border border-line p-4">
            <summary className="cursor-pointer font-semibold">Opciones avanzadas</summary>
            <div className="mt-4">
              <NumberInput label="Horas al mes para el valor de la hora" suffix="h" value={horasMes} onChange={setHorasMes}
                hint="210 = 42 h semanales ÷ 6 días × 30. Si tu empresa usa otro divisor, cámbialo aquí." />
            </div>
          </details>
        </form>

        <section aria-live="polite" aria-label="Desprendible estimado" className="lg:sticky lg:top-6 lg:self-start">
          {resultado ? <DesprendibleView titulo={periodoTitulo(periodo)} d={resultado} /> : <Vacio />}
        </section>
      </div>

      <ComoSeCalcula>
        <h3>Salario del período</h3>
        <p>
          El mes se cuenta como 30 días y la quincena como 15, aunque el mes tenga 28 o 31. Tu salario diario es el salario mensual dividido
          entre 30. Los días de incapacidad, vacaciones, permisos y ausencias se restan de los días laborados y se pagan, o no, según su regla.
        </p>
        <h3>Valor de la hora y recargos</h3>
        <p>
          La jornada máxima es de 42 horas semanales (CST, art. 161). Para el valor de la hora usamos 210 horas al mes (42 ÷ 6 × 30), una
          convención frecuente, no una regla legal. Los recargos se calculan sobre esa hora (CST, arts. 168 y 179):
        </p>
        <ul>
          <li>Nocturno, entre las 7:00 p. m. y las 6:00 a. m.: 35 %.</li>
          <li>Domingo o festivo: 80 % hasta junio de 2026, 90 % desde el 1 de julio de 2026 y 100 % desde el 1 de julio de 2027.</li>
          <li>Hora extra diurna: la hora más el 25 %; nocturna: la hora más el 75 %.</li>
          <li>En domingo o festivo, la hora extra suma también el recargo dominical.</li>
        </ul>
        <p>Las horas extra no pueden pasar de 2 al día ni de 12 a la semana (CST, art. 167A, Ley 2466 de 2025), salvo en seguridad privada y salud.</p>
        <p>Las horas de tu jornada normal que caen de noche o en festivo solo pagan el recargo, porque la hora ya está en tu salario.</p>
        <h3>Auxilio de transporte</h3>
        <p>
          Si ganas hasta 2 salarios mínimos ({pesos(2 * VALORES_2026.salarioMinimo)}), te corresponden {pesos(VALORES_2026.auxilioTransporte)} al mes
          (Decreto 1470 de 2025), solo por los días que trabajas. No se paga en vacaciones, incapacidades ni permisos.
        </p>
        <h3>Incapacidad</h3>
        <p>
          Por enfermedad general se pagan dos terceras partes del salario (CST, art. 227), sin bajar del salario mínimo diario. Los dos
          primeros días los paga el empleador y desde el tercero, la EPS (Decreto 2943 de 2013).
        </p>
        <h3>Descuentos</h3>
        <p>
          Aportas 4 % a salud (Ley 100 de 1993, art. 204) y 4 % a pensión (art. 20) sobre tu base de cotización, que no puede ser menor que el
          salario mínimo. Desde 4 salarios mínimos se suma el Fondo de Solidaridad Pensional (art. 27). Si tus pagos no salariales superan el
          40 % del total, el exceso cuenta para la base (Ley 1393 de 2010, art. 30). La retención en la fuente no se calcula.
        </p>
      </ComoSeCalcula>
    </div>
  );
}

export function periodoTitulo(p: { anio: number; mes: number; periodicidad: string }) {
  const mes = new Date(p.anio, p.mes - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  return p.periodicidad === 'q1' ? `Primera quincena de ${mes}` : p.periodicidad === 'q2' ? `Segunda quincena de ${mes}` : `Nómina de ${mes}`;
}

function Vacio() {
  return (
    <div className="rounded-md bg-mist px-6 py-10 sm:px-8">
      <p className="font-serif text-2xl">Tu desprendible aparecerá aquí</p>
      <p className="mt-2 max-w-prose text-slate">Escribe tu salario mensual para empezar. Cada línea mostrará su cálculo y la norma que la respalda.</p>
    </div>
  );
}
