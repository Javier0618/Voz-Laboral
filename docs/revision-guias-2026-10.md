# Revisión de las guías contra el texto oficial (27 de octubre de 2026)

Se revisaron las 24 guías de «Tus derechos» contra el texto consolidado de la [compilación normativa oficial de Colpensiones](https://normativa.colpensiones.gov.co/colpens/compilacion/docs/codigo_sustantivo_trabajo.htm), que incluye el Código Sustantivo del Trabajo con las reformas de la Ley 2466 de 2025, las leyes y los decretos citados. También se revisaron las sentencias publicadas por la Corte Constitucional. El sitio de la Secretaría del Senado no responde desde el entorno de trabajo, pero sus páginas se mantienen como fuentes.

Las correcciones están en `supabase/contenido/guias-derechos-2026-correcciones.sql`.

## Errores corregidos

| Guía | Decía | Dice el texto oficial |
|---|---|---|
| Despido | La indemnización del contrato a término fijo tiene un mínimo de 15 días. | El mínimo de 15 días es del contrato por obra o labor (art. 64 CST). |
| Cesantías (texto y resumen) | Se consignan «antes del 14 de febrero». | Antes del 15 de febrero (art. 99 Ley 50 de 1990). |
| Cesantías | La sanción por no pagar los intereses se paga una sola vez. | Se paga cada vez que se incumple (art. 2.2.1.3.8 Decreto 1072 de 2015). |
| Vacaciones y liquidación | El pago de las vacaciones al terminar el contrato está en el art. 189 CST. | Ese numeral fue derogado; la regla está en el art. 1 de la Ley 995 de 2005. |
| Maternidad | «La ley prevé una indemnización». | 60 días de salario y presunción de despido por embarazo hasta 18 semanas después del parto (art. 239 CST, Ley 2141 de 2021). |
| Incapacidad | Cita el Decreto 1427 de 2022. | La regla está en el art. 3.2.1.10 del Decreto 780 de 2016; los requisitos, en el art. 2.2.3.3.1 (Decreto 2126 de 2023). |
| Tipos de contrato | Prórroga «si nadie avisa por escrito»; límite de prórrogas sin precisar. | Basta con manifestar la intención de terminar 30 días antes; después de la cuarta prórroga, no menos de un año (art. 46 CST). |
| Accidente de trabajo | El trabajador puede reportar directamente a la ARL. | No se confirmó en la norma; se cambió por lo que sí dicen el art. 62 del Decreto 1295 de 1994 y el art. 30 de la Ley 1562 de 2012. |
| Salario mínimo | «El decreto fue objeto de demandas; confirma el valor». | La suspensión se levantó; el valor sigue siendo $1.750.905 (Decretos 1469 de 2025 y 0159 de 2026). |

## Información que faltaba y se añadió

- **Despido:** el procedimiento disciplinario del art. 115 CST (Ley 2466 de 2025) y el aviso de 15 días del art. 62 CST.
- **Renuncia:**
  - no se debe preaviso si la causa es imputable al empleador (art. 47 CST, parágrafo);
  - el preaviso es de 30 días calendario.
- **Cesantías:**
  - consignación mensual y pago mensual de intereses (Ley 2466 de 2025);
  - pérdida del derecho (art. 250 CST);
  - también se pagan a trabajadores ocasionales (C-823 de 2006).
- **Licencias remuneradas:** luto (5 días hábiles) y cuidado de la niñez (10 días hábiles) (art. 57 CST, numerales 10 y 12).
- **Maternidad y paternidad:** licencia compartida, plazo de 30 días para el registro civil, lactancia (art. 238 CST) y protección del padre cuya pareja está embarazada.
- **Acoso laboral:** protección de 6 meses contra el despido (art. 11) y caducidad de 3 años (art. 18 Ley 1010 de 2006).
- **Acoso sexual (Ley 2365 de 2024):**
  - lugares que cuentan como contexto laboral;
  - obligaciones del empleador;
  - medidas de protección en 5 días hábiles;
  - estabilidad de 6 meses tras la queja.
- **Estabilidad reforzada:**
  - prohibición de despedir por enfermedad o salud mental (art. 59 CST, numeral 15);
  - la protección alcanza a contratistas (SU-049 de 2017);
  - protección de quienes denuncian acoso.
- **Seguridad social:**
  - la ARL cubre desde el día siguiente a la afiliación;
  - tabla de cotización a la ARL;
  - la reforma pensional rige desde el 1 de abril de 2027 (C-264 de 2026).
- **Derecho de petición:** plazo de 15 días y uso ante empresas privadas, EPS y fondos (Ley 1755 de 2015).

## Datos confirmados sin cambios

- Salario: arts. 127, 134 y 143 CST.
- Contrato de trabajo: arts. 23 y 24 CST.
- Órdenes del empleador: art. 59 CST.
- Jornada: arts. 160, 161, 168 y 179 CST, y art. 3 de la Ley 2101 de 2021.
- Vacaciones: arts. 186, 187, 190 y 192 CST.
- Incapacidad por enfermedad: art. 227 CST y C-543 de 2007.
- Dotación: arts. 230 a 234 CST.
- Prima de servicios: art. 306 CST y C-825 de 2006.
- Prescripción: arts. 488 y 489 CST.
- Ministerio del Trabajo: arts. 485 y 486 CST.
- Indemnización moratoria: art. 65 CST.
- Discapacidad: art. 26 de la Ley 361 de 1997.
- Riesgos laborales: arts. 3 y 4 de la Ley 1562 de 2012, y arts. 3 y 4 de la Ley 776 de 2002.
- Cotizaciones: arts. 20 y 204 de la Ley 100 de 1993.
- Caja de compensación: art. 12 de la Ley 21 de 1982.
- Acoso sexual: art. 210A del Código Penal.
- Salario mínimo y auxilio de transporte 2026: Decretos 1469 y 1470 de 2025.

## Puntos para el abogado

- **Indemnización moratoria (art. 65 CST):** depende de la buena fe del empleador según la jurisprudencia. La guía lo dice, pero no detalla los criterios.
- **Estabilidad laboral reforzada por salud:** las cortes no coinciden en quiénes están protegidos. La guía lo advierte sin entrar en detalle.
- **Exoneración de aportes a salud:** la guía cita el art. 114-1 del Estatuto Tributario («menos de 10 salarios mínimos»), que no se pudo abrir desde aquí. El art. 204 de la Ley 100 dice «hasta diez».
- **Licencia de paternidad:** no se verificó si ya se amplió por la baja del desempleo estructural.
