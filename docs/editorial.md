# Sistema editorial — TuVozLaboral

Objetivo: publicar **guías laborales** claras para trabajadores en Colombia sobre **todo lo relacionado con el trabajo**: reformas, contrato, jornada, salud, dignidad, trámites y pagos. No solo nómina.

Jerarquía del producto: **Guías → Experiencias → Calculadoras**.

---

## 1. Plantilla de guía (obligatoria)

Cada guía nueva debe seguir esta estructura (bloques separados por línea en blanco).

**Dónde está el botón:** Moderación → abrir una guía → pestaña **Editar** (no «Vista previa») → junto a «Insertar imagen» aparece **Insertar plantilla de guía**.

```
## Qué dice la ley

Resumen en lenguaje claro de la norma aplicable (CST, decretos, circular). Cita el artículo cuando sea posible.

## En la práctica

Cómo se aplica en el día a día del trabajador. Ejemplos concretos (montos, horarios, plazos).

## Errores comunes

- Confusión frecuente 1
- Confusión frecuente 2

## Qué puedes hacer

1. Paso concreto 1
2. Paso concreto 2
3. Cuándo acudir al Ministerio u otra instancia

> Importante: esta guía es orientativa. No sustituye asesoría jurídica ni una decisión del Ministerio del Trabajo.

## Herramientas y lecturas relacionadas

- [Calculadora relevante](/calculadoras/…)  (solo si aporta)
- [Otra guía](/derechos/slug)
```

### Metadatos mínimos antes de publicar

| Campo | Criterio |
|-------|----------|
| Título | 5–160 caracteres; específico |
| Resumen | 20–400 caracteres; qué aprenderá el lector |
| Tema (categoría) | Obligatorio |
| Fuentes oficiales | Al menos una URL https + editorial + fecha de consulta |
| Portada | Ideal 1200×628; alt descriptivo |
| Fecha de verificación | Actualizada al publicar o revisar |

---

## 2. Taxonomía (temas)

TuVozLaboral habla de **trabajo y trabajadores en general**, no solo de nómina. Los temas están en el código, en `src/lib/temasGuias.ts`, y ordenan el índice `/derechos`, en este orden:

| # | Tema (slug) | Qué incluye |
|---|-------------|-------------|
| 1 | **Reformas y novedades** (`reformas`) | Reforma laboral, reforma pensional, normas nuevas y calendario de cambios |
| 2 | **Contrato y formas de trabajar** (`formas-de-trabajar`) | Tipos de contrato, teletrabajo y trabajo remoto, plataformas, aprendices, trabajo doméstico, campo |
| 3 | **Jornada y descanso** (`jornada`) | Jornada máxima, nocturno, horas extra, dominicales, festivos, vacaciones |
| 4 | **Salud, seguridad y licencias** (`salud`) | Seguridad social, ARL, accidentes, incapacidades, licencias, salud mental |
| 5 | **Igualdad, dignidad y acoso** (`dignidad`) | Discriminación, acoso laboral y sexual, igualdad salarial, inclusión, migrantes |
| 6 | **Sindicatos y derechos colectivos** (`colectivos`) | Asociación sindical, negociación colectiva, huelga, fuero sindical |
| 7 | **Salario y prestaciones** (`salario`) | Salario mínimo, pagos, prima, cesantías |
| 8 | **Fin del contrato** (`terminacion`) | Despido, renuncia, liquidación, estabilidad reforzada |
| 9 | **A dónde acudir** (`tramites`) | Petición, Ministerio del Trabajo, inspección |

**Cómo clasificar una guía nueva:** añade su slug en `GUIA_TEMA` (`src/lib/temasGuias.ts`). Si no lo haces, el sitio la clasifica así:

- en «Reformas y novedades», si el título menciona una reforma, una novedad o la Ley 2466;
- si no, según su categoría de experiencias;
- si nada de lo anterior aplica, en «Otros temas».

La categoría de experiencias se sigue usando para el botón «Ver experiencias sobre…» de cada guía.

Una guía trata un solo tema concreto. El salario importa, pero **no monopoliza** el calendario.

---

## 3. Calendario prioritario

Publicar **una guía nueva o una reescritura fuerte cada 7–10 días**. La lista de guías por crear está en el código, en `GUIAS_A_CREAR` (`src/lib/guiasPrioritarias.ts`).

### Verificadas contra el texto oficial (partes 5 y 6)

Las guías de la parte 5 se contrastaron el 1 de noviembre de 2026 con los textos oficiales que compila Colpensiones. Las correcciones están en `supabase/contenido/guias-trabajo-2026-parte-6.sql`.

| # | Guía | Tema | Estado |
|---|------|------|--------|
| 1 | Reforma laboral de 2025: qué cambió para quienes trabajan | Reformas y novedades | Publicada, corregida en la parte 6 |
| 2 | Teletrabajo, trabajo remoto, trabajo en casa y derecho a desconectarte | Contrato y formas de trabajar | Publicada, corregida en la parte 6 |
| 3 | Repartidores de plataformas digitales: qué dice la reforma laboral | Contrato y formas de trabajar | Publicada, corregida en la parte 6 |
| 4 | Aprendices SENA y contrato de aprendizaje después de la reforma | Contrato y formas de trabajar | Publicada, corregida en la parte 6 |
| 5 | Sindicatos, negociación colectiva y huelga: tus derechos | Sindicatos y derechos colectivos | Publicada, corregida en la parte 6 |
| 6 | Reforma pensional: qué cambia y desde cuándo | Reformas y novedades | Publicada |
| 7 | Prestación de servicios o contrato laboral: cómo saber cuál tienes | Contrato y formas de trabajar | Nueva (parte 7), pendiente de tu revisión |
| 8 | Salud mental en el trabajo y riesgo psicosocial: lo que debe hacer tu empresa | Salud, seguridad y licencias | Nueva (parte 8), pendiente de tu revisión |
| 9 | Inclusión laboral de personas con discapacidad: cuota de empleo, ajustes y protección | Igualdad, dignidad y acoso | Nueva (parte 9), pendiente de tu revisión |
| 10 | Si te quedas sin empleo: subsidio de desempleo y cómo pedirlo | Fin del contrato | Nueva (parte 10), pendiente de tu revisión |
| 11 | Cómo reclamar tus derechos laborales: conciliación, demanda y tutela | A dónde acudir | Nueva (parte 11), pendiente de tu revisión |

**Fuente de referencia:** la compilación normativa de Colpensiones (`normativa.colpensiones.gov.co`) incluye los textos con notas de vigencia y es accesible desde el entorno de trabajo.

### Por crear (en orden)

Prioridad: temas generales que le pasan a casi cualquier trabajador. Los de grupos específicos van después.

| # | Tema | Eje |
|---|------|-----|
| 1 | Cómo leer tu desprendible de nómina | Salario y prestaciones |
| 2 | Calendario laboral del año: fechas de pago y cambios | Reformas |
| 3 | Tu primer empleo: lo que debe pasar desde el primer día | Formas de trabajar |
| 4 | Trabajo doméstico: derechos | Formas de trabajar |
| 5 | Trabajadores migrantes: derechos laborales | Dignidad |
| 6 | Trabajo en el campo: jornal y contrato agropecuario | Formas de trabajar |

### Ya publicadas

Para saber qué reescribir o reforzar, mira `docs/inventario-guias.md`.

---

## 4. Flujo de publicación

```
Moderación → Nueva guía o abrir borrador
  → Pestaña Editar → Insertar plantilla de guía
  → Completar secciones + fuentes oficiales
  → Portada 1200×628
  → Vista previa → Guardar → Publicar
```

Checklist al publicar: lenguaje claro, fuente oficial, secciones cubiertas, portada si es posible, resumen útil para SEO.

---

## 5. Criterios de calidad

**Sí:** frases cortas; distinguir ley vs. práctica; fecha de verificación; disclaimer orientativo.

**No:** prometer resultados legales; copiar textos legales largos sin explicar; mezclar OPS y laboral sin aclarar.

Revisión: cada **6 meses** o cuando cambie la norma.

---

## 6. Relación con el resto del sitio

- Guía → calculadoras solo si el tema es de montos.
- Calculadora → guía de la norma.
- Experiencias: CTA al final de la guía.

Documento vivo: actualizar este archivo cuando cambie la taxonomía o el calendario.
