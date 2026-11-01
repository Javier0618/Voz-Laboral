# Sistema editorial — VozLaboral

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

VozLaboral habla de **trabajo y trabajadores en general**, no solo de nómina. Los temas están en el código, en `src/lib/temasGuias.ts`, y ordenan el índice `/derechos`, en este orden:

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

### Redactadas, pendientes de tu revisión (parte 5)

Archivo: `supabase/contenido/guias-trabajo-2026-parte-5.sql`. Entran como «pendiente de verificación».

| # | Guía | Tema |
|---|------|------|
| 1 | Reforma laboral de 2025: qué cambió para quienes trabajan | Reformas y novedades |
| 2 | Teletrabajo, trabajo remoto, trabajo en casa y derecho a desconectarte | Contrato y formas de trabajar |
| 3 | Repartidores de plataformas digitales: qué dice la reforma laboral | Contrato y formas de trabajar |
| 4 | Aprendices SENA y contrato de aprendizaje después de la reforma | Contrato y formas de trabajar |
| 5 | Sindicatos, negociación colectiva y huelga: tus derechos | Sindicatos y derechos colectivos |

Se redactaron sin acceso a los portales oficiales. Antes de publicar:

- revisa los puntos marcados «(pendiente de verificación)»;
- abre cada enlace de fuentes.

### Por crear (en orden)

| # | Tema | Eje |
|---|------|-----|
| 1 | Reforma pensional: qué cambia y desde cuándo | Reformas |
| 2 | Licencias nuevas de la reforma laboral | Reformas |
| 3 | OPS vs. contrato laboral | Formas de trabajar |
| 4 | Salud mental y riesgo psicosocial | Salud |
| 5 | Inclusión laboral y cuota de discapacidad | Dignidad |
| 6 | Trabajo doméstico: derechos | Formas de trabajar |
| 7 | Trabajadores migrantes: derechos laborales | Dignidad |
| 8 | Inspección de trabajo | A dónde acudir |
| 9 | Calendario laboral del año | Reformas |
| 10 | Trabajo en el campo: jornal y contrato agropecuario | Formas de trabajar |

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
