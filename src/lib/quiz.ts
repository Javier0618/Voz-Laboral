// «¿Mito o realidad?»: juego corto para aprender derechos laborales.
// Cada respuesta sale de una guía publicada y cita su norma. Si cambia la
// norma, se actualiza aquí y en la guía.

export type PreguntaQuiz = {
  afirmacion: string;
  realidad: boolean;
  explicacion: string;
  norma: string;
  guia: { slug: string; label: string };
};

export const QUIZ: PreguntaQuiz[] = [
  {
    afirmacion: 'Si renuncias, pierdes las cesantías.',
    realidad: false,
    explicacion: 'Al renunciar te deben la liquidación completa: cesantías, intereses, prima proporcional y vacaciones pendientes. Lo único que no recibes es la indemnización por despido.',
    norma: 'Ley 50 de 1990, art. 99, y CST, art. 249',
    guia: { slug: 'renuncia-y-preaviso', label: 'Renunciar: preaviso y liquidación' },
  },
  {
    afirmacion: 'Desde julio de 2026, trabajar un domingo o festivo se paga con un recargo del 90 %.',
    realidad: true,
    explicacion: 'La reforma laboral sube el recargo por etapas: 80 % en julio de 2025, 90 % en julio de 2026 y 100 % en julio de 2027.',
    norma: 'CST, art. 179, modificado por la Ley 2466 de 2025',
    guia: { slug: 'descanso-dominical-y-festivos', label: 'Trabajar domingos y festivos' },
  },
  {
    afirmacion: 'La prima solo se paga si trabajaste el semestre completo.',
    realidad: false,
    explicacion: 'Si trabajaste solo una parte del semestre, te pagan la prima en proporción al tiempo trabajado.',
    norma: 'CST, art. 306',
    guia: { slug: 'prima-de-servicios', label: 'Prima de servicios' },
  },
  {
    afirmacion: 'Tu jefe puede descontarte del sueldo una herramienta que se dañó.',
    realidad: false,
    explicacion: 'Sin tu autorización escrita para cada caso, o sin orden de un juez, no te pueden descontar nada. Y los descuentos por daños a herramientas o por faltantes están prohibidos.',
    norma: 'CST, art. 149',
    guia: { slug: 'descuentos-y-embargos-del-salario', label: 'Descuentos y embargos del salario' },
  },
  {
    afirmacion: 'Por cada año trabajado tienes derecho a 15 días hábiles de vacaciones pagadas.',
    realidad: true,
    explicacion: 'Son 15 días hábiles consecutivos. Si el contrato termina antes del año, te pagan las vacaciones en proporción.',
    norma: 'CST, art. 186',
    guia: { slug: 'vacaciones', label: 'Vacaciones' },
  },
  {
    afirmacion: 'En el periodo de prueba te pueden sacar sin pagarte nada.',
    realidad: false,
    explicacion: 'En el periodo de prueba te pueden terminar el contrato sin aviso y sin indemnización, pero te deben el salario y las prestaciones del tiempo que trabajaste.',
    norma: 'CST, art. 80',
    guia: { slug: 'tipos-de-contrato-y-periodo-de-prueba', label: 'Tipos de contrato y periodo de prueba' },
  },
  {
    afirmacion: 'Los dos primeros días de una incapacidad por enfermedad los paga el empleador, no la EPS.',
    realidad: true,
    explicacion: 'El empleador paga los dos primeros días de la incapacidad por enfermedad general. Desde el tercer día paga la EPS.',
    norma: 'Decreto 780 de 2016, modificado por el Decreto 1427 de 2022',
    guia: { slug: 'incapacidad-por-enfermedad', label: 'Incapacidad por enfermedad' },
  },
  {
    afirmacion: 'Las cesantías te las tienen que consignar en el fondo antes del 14 de febrero.',
    realidad: true,
    explicacion: 'El empleador consigna las cesantías del año en el fondo que elijas antes del 14 de febrero. Los intereses, del 12 %, te los paga directamente en enero.',
    norma: 'Ley 50 de 1990, art. 99, y Ley 52 de 1975',
    guia: { slug: 'cesantias-e-intereses', label: 'Cesantías e intereses' },
  },
  {
    afirmacion: 'Si te despiden sin justa causa, no te deben nada más que la liquidación.',
    realidad: false,
    explicacion: 'Además de la liquidación, te deben una indemnización que depende de tu tipo de contrato y del tiempo trabajado.',
    norma: 'CST, art. 64',
    guia: { slug: 'despido-con-y-sin-justa-causa', label: 'Despido con y sin justa causa' },
  },
  {
    afirmacion: 'En Colpensiones, una mujer necesita 1.250 semanas para pensionarse en 2026.',
    realidad: true,
    explicacion: 'La Corte Constitucional ordenó bajar el requisito para las mujeres: 1.250 semanas en 2026, 1.225 en 2027 y así hasta 1.000 en 2036. La edad sigue en 57 años.',
    norma: 'Corte Constitucional, sentencia C-197 de 2023',
    guia: { slug: 'pension-de-vejez-requisitos', label: 'Pensión de vejez' },
  },
];

/** Mensaje según el puntaje: anima a seguir aprendiendo, nunca regaña. */
export function mensajeResultado(aciertos: number, total: number): string {
  const p = aciertos / total;
  if (p === 1) return 'Conoces tus derechos al dedillo. Reta a tus compañeros de trabajo.';
  if (p >= 0.7) return 'Muy bien. Revisa las que fallaste: cada una tiene su guía.';
  if (p >= 0.4) return 'Vas bien, pero hay derechos que te pueden estar quedando sin cobrar. Mira las explicaciones.';
  return 'Tranquilo: para eso está este juego. Revisa las explicaciones y las guías de cada pregunta.';
}
