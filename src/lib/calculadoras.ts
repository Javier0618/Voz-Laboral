/** Catálogo de calculadoras: meta SEO y vínculos desde las guías. */
import { brand } from '../config/brand';
import type { PageMeta } from './meta';

export type CalculadoraInfo = {
  path: string;
  title: string;
  description: string;
  /** Términos en slug, título o tema de una guía para sugerir esta herramienta */
  match: string[];
};

export const CALCULADORAS: CalculadoraInfo[] = [
  {
    path: '/calculadoras/administrativos',
    title: 'Nómina para cargos administrativos',
    description:
      'Calcula tu nómina con salario fijo: horas extra, recargos nocturnos y dominicales, y novedades. Valores 2026 en Colombia.',
    match: ['salario', 'hora extra', 'horas extra', 'recargo', 'nocturn', 'dominical', 'festivo', 'jornada', 'sueldo', 'desprendible', 'administrativ'],
  },
  {
    path: '/calculadoras/operativos',
    title: 'Nómina para cargos operativos',
    description:
      'Estima el pago con turnos 5×2, 6×1 o mixtos: el calendario clasifica horas ordinarias, nocturnas y extras según la ley colombiana.',
    match: ['turno', 'operativ', '5x2', '6x1', 'rotacion', 'rotación', 'producción', 'planta'],
  },
  {
    path: '/calculadoras/vigilantes',
    title: 'Nómina para vigilantes',
    description:
      'Nómina para seguridad privada con rotaciones 2×2, 3×3 y 4×2, recargos nocturnos, dominicales y festivos (Colombia 2026).',
    match: ['vigilant', 'seguridad', '2x2', '3x3', '4x2', 'escolta', 'celad'],
  },
  {
    path: '/calculadoras/por-dias',
    title: 'Nómina por días',
    description:
      'Calcula el pago si trabajas algunos días del mes o cobras por jornada, con cotización ordinaria o por semanas.',
    match: ['por dia', 'por día', 'jornal', 'medio tiempo', 'dias trabaj', 'días trabaj', 'obra labor'],
  },
  {
    path: '/calculadoras/prima',
    title: 'Prima de servicios (Junio y Diciembre)',
    description:
      'Calcula tu prima semestral con salario básico, recargos variables y auxilio de transporte en Colombia.',
    match: ['prima', 'semestre', 'junio', 'diciembre', 'prestaciones', 'salario'],
  },
  {
    path: '/calculadoras/cesantias',
    title: 'Cesantías e Intereses de cesantías',
    description:
      'Estima lo que debe consignar tu empresa al fondo antes del 14 de febrero y los intereses en enero.',
    match: ['cesantia', 'cesantía', 'cesantias', 'intereses', 'fondo', 'febrero', 'ahorro'],
  },
  {
    path: '/calculadoras/salario-neto',
    title: 'Salario neto vs. bruto (Oferta laboral)',
    description:
      'Descubre cuánto entra realmente a tu bolsillo tras salud, pensión, fondo de solidaridad y retención en la fuente.',
    match: ['salario neto', 'sueldo neto', 'cuanto me queda', 'retencion', 'oferta', 'bruto', 'impuesto'],
  },
  {
    path: '/calculadoras/prestacion-servicios',
    title: 'Contrato por prestación de servicios (OPS e Independientes)',
    description:
      'Estima aportes de seguridad social (salud, pensión, ARL en PILA) y retención en la fuente sobre honorarios.',
    match: ['prestacion de servicios', 'honorarios', 'ops', 'independiente', 'cuenta de cobro', 'pila', 'contratista'],
  },
  {
    path: '/liquidacion',
    title: 'Liquidación al terminar el contrato',
    description:
      'Estima cesantías, intereses, prima, vacaciones e indemnización por despido sin justa causa en Colombia.',
    match: ['liquidacion', 'liquidación', 'cesantia', 'cesantía', 'prima', 'vacacion', 'despido', 'indemnizacion', 'indemnización', 'retiro', 'finiquito', 'contrato'],
  },
];

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** Calculadoras relacionadas con el texto de una guía (slug, título, resumen, tema). */
export function calculadorasRelacionadas(...parts: (string | null | undefined)[]): CalculadoraInfo[] {
  const hay = normalize(parts.filter(Boolean).join(' '));
  if (!hay.trim()) return [];
  const scored = CALCULADORAS.map((c) => {
    const hits = c.match.filter((m) => hay.includes(normalize(m))).length;
    return { c, hits };
  }).filter((x) => x.hits > 0);
  scored.sort((a, b) => b.hits - a.hits);
  return scored.slice(0, 3).map((x) => x.c);
}

export function metaCalculadora(info: CalculadoraInfo): PageMeta {
  return {
    title: `${info.title} · ${brand.name}`,
    description: info.description,
    path: info.path,
    type: 'website',
  };
}

export function calculadoraPorPath(path: string): CalculadoraInfo | undefined {
  return CALCULADORAS.find((c) => c.path === path);
}
