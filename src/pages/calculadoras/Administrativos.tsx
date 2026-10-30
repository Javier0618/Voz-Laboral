import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { VALORES_2026 } from '../../lib/liquidacion';
import {
  calcularNomina, factorHora, HORAS_MES_DEFECTO, horasVacias, novedadesVacias, otrosVacios, TIPOS_HORA, valorarHoras,
  type Horas, type TipoHora,
} from '../../lib/nomina';
import { PageHeader } from '../../components/ui';
import { setPageMeta } from '../../lib/meta';
import { calculadoraPorPath, metaCalculadora } from '../../lib/calculadoras';
import {
  ComoSeCalcula, DesprendibleView, MoneyInput, NovedadesFields, NumberInput, OtrosFields, PeriodoFields, periodoActual, pesos, rangoPeriodo,
} from '../../components/nomina';

export default function Administrativos() {
  useEffect(() => {
    const info = calculadoraPorPath('/calculadoras/administrativos');
    if (info) setPageMeta(metaCalculadora(info));
    return () => setPageMeta(null);
  }, []);

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
        si los tuviste, tus horas extra, recargos y novedades. El desprendible se arma con las normas laborales colombianas vigentes en 2026.
      </PageHeader>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          <PeriodoFields value={periodo} onChange={setPeriodo} />
          <fieldset className="space-y-4 rounded border border-line p-4">
            <legend className="px-1 text-sm font-semibold">Salario y jornada</legend>
            <MoneyInput label="Salario mensual" value={salario} onChange={setSalario} />
            <NumberInput label="Horas al mes del contrato" value={horasMes} onChange={setHorasMes} min={1} max={240} />
            <p className="text-sm text-slate">Valor hora ordinaria: {salario > 0 ? pesos(valorHora) : '—'}. Por defecto usamos 220 horas al mes (CST, art. 161 y 134).</p>
          </fieldset>
          <fieldset className="space-y-3 rounded border border-line p-4">
            <legend className="px-1 text-sm font-semibold">Horas extra y recargos en el período</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {TIPOS_HORA.map((t: TipoHora) => (
                <NumberInput key={t} label={t} value={horas[t]} onChange={(n) => setHoras({ ...horas, [t]: n })} min={0} max={200} step={0.5} />
              ))}
            </div>
          </fieldset>
          <NovedadesFields value={novedades} onChange={setNovedades} />
          <OtrosFields value={otros} onChange={setOtros} />
        </form>
        <section className="lg:sticky lg:top-6 lg:self-start">
          {resultado ? <DesprendibleView titulo={periodoTitulo(periodo)} d={resultado} /> : (
            <div className="rounded-md bg-mist px-6 py-10 sm:px-8">
              <p className="font-serif text-2xl">Tu desprendible aparecerá aquí</p>
              <p className="mt-2 max-w-prose text-slate">Escribe tu salario mensual para empezar. Cada línea mostrará su cálculo y la norma que la respalda.</p>
            </div>
          )}
        </section>
      </div>

      <ComoSeCalcula>
        <h3>Salario y valor de la hora</h3>
        <p>El valor de la hora ordinaria es el salario mensual dividido entre las horas del mes del contrato (por defecto 220). Las horas extra y los recargos se calculan sobre esa base (CST, arts. 134, 160, 168 y 179).</p>
        <h3>Auxilio de transporte</h3>
        <p>Si tu salario no supera dos salarios mínimos, corresponde el auxilio de transporte del Decreto 1470 de 2025, en proporción a los días del período.</p>
        <h3>Seguridad social y retenciones</h3>
        <p>Aportes a salud y pensión del trabajador (4 % cada uno) y fondo de solidaridad pensional cuando aplica. Esta estimación no incluye retenciones de renta ni embargos.</p>
        <h3>Prestaciones</h3>
        <p>Para cesantías, prima y vacaciones al terminar el contrato usa la <Link to="/liquidacion" className="btn-link">calculadora de liquidación</Link>.</p>
      </ComoSeCalcula>
    </div>
  );
}

export function periodoTitulo(p: { anio: number; mes: number; periodicidad: string }) {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const base = `${meses[p.mes - 1]} de ${p.anio}`;
  if (p.periodicidad === 'primera') return `Primera quincena de ${base}`;
  if (p.periodicidad === 'segunda') return `Segunda quincena de ${base}`;
  return base.charAt(0).toUpperCase() + base.slice(1);
}
