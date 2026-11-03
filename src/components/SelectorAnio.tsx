import { PRIMER_ANIO, ULTIMO_ANIO, valoresDe } from '../lib/liquidacion';
import { Field } from './ui';

const pesos = (n: number) => `$${n.toLocaleString('es-CO')}`;
const ANIOS = Array.from({ length: ULTIMO_ANIO - PRIMER_ANIO + 1 }, (_, i) => ULTIMO_ANIO - i);

/** Año del cálculo: define el salario mínimo y el auxilio de transporte que se usan. */
export function SelectorAnio({ anio, onChange, label = 'Año que vas a calcular' }: { anio: number; onChange: (a: number) => void; label?: string }) {
  const v = valoresDe(anio);
  return (
    <Field label={label} hint={`En ${anio}: salario mínimo ${pesos(v.salarioMinimo)} (${v.decretoSalario}) y auxilio de transporte ${pesos(v.auxilioTransporte)} (${v.decretoAuxilio}).`}>
      {(p) => (
        <select {...p} className="input" value={anio} onChange={(e) => onChange(Number(e.target.value))}>
          {ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      )}
    </Field>
  );
}
