// Calculadora por turnos: operativos (5×2, 6×1) y vigilantes (2×2, 3×3, 4×2).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fecha as aFecha } from '../../lib/festivos';
import { VALORES_2026 } from '../../lib/liquidacion';
import {
  avisoLimiteExtras, calcularNomina, calcularTurnos, HORAS_MES_DEFECTO, novedadesVacias, otrosVacios, TIPOS_HORA, type ModoExtras, type Turno,
} from '../../lib/nomina';
import { Field, PageHeader } from '../../components/ui';
import {
  CalendarioTurnos, ComoSeCalcula, DesprendibleView, ExplicacionDescanso, MoneyInput, NovedadesFields, NumberInput, OtrosFields, PeriodoFields, periodoActual,
  pesos, rangoPeriodo, turnosLista, type Turnos,
} from '../../components/nomina';
import { periodoTitulo } from './Administrativos';
import { ResumenClasificacionHoras } from '../../components/ResumenClasificacionHoras';

type Tipo = 'operativos' | 'vigilantes';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const ROTACIONES = {
  '2x2': { dias: 2, noches: 2, descansos: 2, nombre: '2×2: dos días, dos noches y dos de descanso' },
  '3x3': { dias: 3, noches: 3, descansos: 3, nombre: '3×3: tres días, tres noches y tres de descanso' },
  '4x2': { dias: 2, noches: 2, descansos: 2, nombre: '4×2: cuatro turnos (dos de día y dos de noche) y dos de descanso' },
} as const;

export default function TurnosPage({ tipo }: { tipo: Tipo }) {
  const vig = tipo === 'vigilantes';
  const [periodo, setPeriodo] = useState(periodoActual());
  const [salario, setSalario] = useState(0);
  const [turnos, setTurnos] = useState<Turnos>({});
  const [modo, setModo] = useState<'diario' | 'periodo'>(vig ? 'periodo' : 'diario');
  const [horasJornada, setHorasJornada] = useState(vig ? 12 : 8);
  const [umbralMes, setUmbralMes] = useState(HORAS_MES_DEFECTO);
  const [novedades, setNovedades] = useState(novedadesVacias());
  const [otros, setOtros] = useState(otrosVacios());
  const rango = rangoPeriodo(periodo);
  const plantilla: Turno = vig ? { fecha: rango.desde, entrada: '06:00', salida: '18:00', descansoMin: 0 } : { fecha: rango.desde, entrada: '08:00', salida: '16:00', descansoMin: 60 };

  useEffect(() => {
    setTurnos((t) => Object.fromEntries(Object.entries(t).filter(([f]) => f >= rango.desde && f <= rango.hasta)));
  }, [rango.desde, rango.hasta]);

  const umbral = (umbralMes * rango.diasNomina) / 30;
  const extras: ModoExtras = modo === 'diario' ? { modo: 'diario', horasJornada } : { modo: 'periodo', horasUmbral: umbral };
  const valorHora = salario / HORAS_MES_DEFECTO;
  const lista = turnosLista(turnos);
  const resTurnos = calcularTurnos(lista, valorHora, extras);
  const limite = vig ? null : avisoLimiteExtras(resTurnos.excesoLimite);
  const nomina = salario > 0
    ? calcularNomina({
      salarioMensual: salario, diasPeriodo: rango.diasNomina, fechaReferencia: rango.desde, horasMes: HORAS_MES_DEFECTO,
      novedades, horasValoradas: { horas: resTurnos.horas, valores: resTurnos.valores }, otros,
    })
    : null;
  const resultado = nomina && limite ? { ...nomina, avisos: [limite, ...nomina.avisos] } : nomina;

  return (
    <div className="page py-10">
      <p className="text-sm text-slate"><Link to="/calculadoras" className="hover:text-ink hover:underline">Calculadoras</Link></p>
      <PageHeader title={vig ? 'Nómina para vigilantes' : 'Nómina para cargos operativos'}>
        {vig
          ? 'Para turnos rotativos de 12 horas (2×2, 3×3, 4×2). Arma tu calendario con la rotación y corrige los días que cambien: la calculadora separa cada hora en diurna, nocturna, dominical o festiva y en ordinaria o extra.'
          : 'Para enfermería, conducción, producción y otros cargos con turnos (5×2, 6×1, mixtos o de noche). Llena tu calendario con tu horario semanal y corrige los días que cambien.'}
      </PageHeader>

      <div className="mt-10 grid gap-12 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()} aria-label="Datos de la nómina">
          <PeriodoFields value={periodo} onChange={setPeriodo} />
          <MoneyInput label="Salario mensual" value={salario} onChange={setSalario}
            hint={`El salario del mes completo. El mínimo de 2026 es ${pesos(VALORES_2026.salarioMinimo)}.`} />

          <section aria-labelledby="turnos-titulo" className="space-y-4">
            <h2 id="turnos-titulo" className="font-sans text-base font-semibold">Tus turnos del período</h2>
            {vig
              ? <GeneradorRotacion fechas={rango.fechas} onApply={setTurnos} />
              : <GeneradorSemanal fechas={rango.fechas} onApply={setTurnos} />}
            <CalendarioTurnos fechas={rango.fechas} turnos={turnos} onChange={setTurnos} plantilla={plantilla} desglose={resTurnos.porFecha} />
          </section>

          <fieldset className="space-y-4 rounded border border-line p-4">
            <legend className="px-1 font-sans text-base font-semibold">Cómo cuenta tu empresa las horas extra</legend>
            <label className="flex items-start gap-3">
              <input type="radio" name="modo" className="mt-1 h-4 w-4 accent-teal" checked={modo === 'diario'} onChange={() => setModo('diario')} />
              <span>Por cada turno: es extra lo que pasa de tu jornada diaria.</span>
            </label>
            {modo === 'diario' && <NumberInput label="Horas de tu jornada diaria" suffix="h" value={horasJornada} onChange={setHorasJornada} hint="Por ejemplo, 7 h en 6×1 o 8,4 h en 5×2 con 42 horas semanales." />}
            <label className="flex items-start gap-3">
              <input type="radio" name="modo" className="mt-1 h-4 w-4 accent-teal" checked={modo === 'periodo'} onChange={() => setModo('periodo')} />
              <span>Por el total del período: es extra lo que pasa de un número de horas al mes.</span>
            </label>
            {modo === 'periodo' && (
              <NumberInput label="Horas ordinarias al mes" suffix="h" value={umbralMes} onChange={setUmbralMes}
                hint={`Muchas empresas de vigilancia usan 210 h al mes. Es una práctica, no una regla legal. En una quincena se toma la mitad (${(umbralMes / 2).toLocaleString('es-CO')} h).`} />
            )}
          </fieldset>

          <NovedadesFields value={novedades} onChange={setNovedades} />
          <OtrosFields value={otros} onChange={setOtros} />
        </form>

        <section aria-live="polite" aria-label="Desprendible estimado" className="xl:sticky xl:top-6 xl:self-start">
          {resultado ? (
            <DesprendibleView titulo={periodoTitulo(periodo)} d={resultado} extra={<ResumenClasificacionHoras r={resTurnos} compact />} />
          ) : (
            <div className="rounded-md bg-mist px-6 py-10 sm:px-8">
              <p className="font-serif text-2xl">Tu desprendible aparecerá aquí</p>
              <p className="mt-2 max-w-prose text-slate">Escribe tu salario y arma tus turnos. Verás cada hora clasificada y su valor.</p>
            </div>
          )}
        </section>
      </div>

      <ComoSeCalcula>
        <h3>Cómo se clasifica cada hora</h3>
        <p>
          La calculadora recorre cada turno minuto a minuto. Si un turno pasa la medianoche, las horas después de las 12 se cuentan en el día
          siguiente: por eso un turno del sábado a las 6 p. m. tiene horas dominicales a partir de la medianoche.
        </p>
        <ul>
          <li>Diurna: de 6:00 a. m. a 7:00 p. m. Nocturna: de 7:00 p. m. a 6:00 a. m. (CST, art. 160, desde el 25 de diciembre de 2025).</li>
          <li>Dominical o festiva: domingos y los 18 festivos de Colombia, que la calculadora conoce para cada año (Ley 51 de 1983).</li>
          <li>Extra: según cómo cuente tu empresa, lo que pasa de tu jornada diaria o del total de horas del período.</li>
        </ul>
        <ExplicacionDescanso />
        <h3>Ordinaria o extra</h3>
        <p>
          La ley fija 42 horas semanales (CST, art. 161) y permite turnos sucesivos y jornadas flexibles que reparten las horas de forma
          variable. En turnos de 12 horas, muchas empresas solo pagan horas extra cuando se superan 210 horas en el mes y antes pagan los
          recargos. Esa cifra es una práctica, no un umbral legal: si tu contrato dice otra cosa, ajústala.
        </p>
        <h3>Límite de horas extra</h3>
        <p>
          Las horas extra no pueden pasar de 2 al día ni de 12 a la semana (CST, art. 167A, Ley 2466 de 2025).
          {vig
            ? ' Ese límite no aplica al sector de seguridad (Ley 1920 de 2018) ni al de salud, por eso esta calculadora no avisa cuando lo pasas.'
            : ' Si tus turnos lo pasan, el desprendible te avisa. Aun así, toda hora extra trabajada se debe pagar. Los sectores de seguridad privada y salud están exceptuados.'}
        </p>
        <h3>Valor de cada hora</h3>
        <p>La hora ordinaria vale tu salario dividido entre 210. Sobre ella se aplican:</p>
        <ul>
          {TIPOS_HORA.map((t) => <li key={t.tipo}>{t.nombre}: {t.explicacion}</li>)}
        </ul>
        <p>
          Los recargos de la jornada normal pagan solo el porcentaje; las horas extra pagan la hora completa más su recargo (CST, arts. 168 y
          179). El recargo dominical es del 90 % desde el 1 de julio de 2026 y del 100 % desde el 1 de julio de 2027.
        </p>
        <h3>Lo que no calcula</h3>
        <p>
          El descanso compensatorio por trabajar domingos de forma habitual, la retención en la fuente y los acuerdos particulares de tu
          empresa. El descanso de cada turno se resta a mitad del turno: si tu pausa es en otra hora, el reparto entre horas de día y de noche puede variar un poco.
        </p>
      </ComoSeCalcula>
    </div>
  );
}

function GeneradorSemanal({ fechas, onApply }: { fechas: string[]; onApply: (t: Turnos) => void }) {
  const [dias, setDias] = useState([true, true, true, true, true, true, false]);
  const [h, setH] = useState({ entrada: '08:00', salida: '16:00', descanso: 60 });
  const preset = (n: '5x2' | '6x1') => {
    setDias(n === '5x2' ? [true, true, true, true, true, false, false] : [true, true, true, true, true, true, false]);
    setH(n === '5x2' ? { entrada: '08:00', salida: '17:24', descanso: 60 } : { entrada: '08:00', salida: '16:00', descanso: 60 });
  };
  const aplicar = () => {
    const t: Turnos = {};
    for (const f of fechas) {
      const idx = (aFecha(f).getDay() + 6) % 7;
      t[f] = dias[idx] ? { fecha: f, entrada: h.entrada, salida: h.salida, descansoMin: h.descanso } : 'descanso';
    }
    onApply(t);
  };
  return (
    <div className="space-y-3 rounded border border-line p-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={() => preset('6x1')}>Semana 6×1 (7 h diarias)</button>
        <button type="button" className="btn-secondary" onClick={() => preset('5x2')}>Semana 5×2 (8,4 h diarias)</button>
      </div>
      <fieldset>
        <legend className="label">Días que trabajas</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {DIAS_SEMANA.map((d, i) => (
            <label key={d} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-teal" checked={dias[i]} onChange={(e) => setDias(dias.map((x, j) => (j === i ? e.target.checked : x)))} />
              {d}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Entrada">{(p) => <input {...p} type="time" className="input" value={h.entrada} onChange={(e) => setH({ ...h, entrada: e.target.value })} />}</Field>
        <Field label="Salida">{(p) => <input {...p} type="time" className="input" value={h.salida} onChange={(e) => setH({ ...h, salida: e.target.value })} />}</Field>
        <Field label="Almuerzo (min)" hint="No cuenta como trabajo (CST, art. 167).">{(p) => <input {...p} inputMode="numeric" className="input" value={h.descanso || ''} onChange={(e) => setH({ ...h, descanso: Number(e.target.value.replace(/\D/g, '')) || 0 })} />}</Field>
      </div>
      <button type="button" className="btn-primary" onClick={aplicar}>Llenar el calendario</button>
    </div>
  );
}

function GeneradorRotacion({ fechas, onApply }: { fechas: string[]; onApply: (t: Turnos) => void }) {
  const [rot, setRot] = useState<keyof typeof ROTACIONES>('2x2');
  const [inicio, setInicio] = useState(fechas[0]);
  const [dia, setDia] = useState({ entrada: '06:00', salida: '18:00' });
  const [noche, setNoche] = useState({ entrada: '18:00', salida: '06:00' });
  const c = ROTACIONES[rot];
  const aplicar = () => {
    const ciclo = c.dias + c.noches + c.descansos;
    const t: Turnos = {};
    for (const f of fechas) {
      const dif = Math.round((aFecha(f).getTime() - aFecha(inicio).getTime()) / 86_400_000);
      if (dif < 0) continue;
      const pos = dif % ciclo;
      t[f] = pos < c.dias ? { fecha: f, ...dia, descansoMin: 0 } : pos < c.dias + c.noches ? { fecha: f, ...noche, descansoMin: 0 } : 'descanso';
    }
    onApply(t);
  };
  return (
    <div className="space-y-3 rounded border border-line p-4">
      <Field label="Rotación">
        {(p) => (
          <select {...p} className="input" value={rot} onChange={(e) => setRot(e.target.value as keyof typeof ROTACIONES)}>
            {Object.entries(ROTACIONES).map(([k, v]) => <option key={k} value={k}>{v.nombre}</option>)}
          </select>
        )}
      </Field>
      <Field label="Primer día del ciclo" hint="El día en que empezaste el primer turno de día de la rotación.">
        {(p) => <input {...p} type="date" className="input" value={inicio} onChange={(e) => setInicio(e.target.value)} />}
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="label">Turno de día</legend>
          <input aria-label="Entrada turno de día" type="time" className="input" value={dia.entrada} onChange={(e) => setDia({ ...dia, entrada: e.target.value })} />
          <input aria-label="Salida turno de día" type="time" className="input" value={dia.salida} onChange={(e) => setDia({ ...dia, salida: e.target.value })} />
        </fieldset>
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="label">Turno de noche</legend>
          <input aria-label="Entrada turno de noche" type="time" className="input" value={noche.entrada} onChange={(e) => setNoche({ ...noche, entrada: e.target.value })} />
          <input aria-label="Salida turno de noche" type="time" className="input" value={noche.salida} onChange={(e) => setNoche({ ...noche, salida: e.target.value })} />
        </fieldset>
      </div>
      <button type="button" className="btn-primary" onClick={aplicar}>Llenar el calendario</button>
      <p className="text-xs text-slate">Si tu rotación es distinta, llena el calendario y corrige los días a mano.</p>
    </div>
  );
}
