# Sistema editorial — VozLaboral

Objetivo: publicar **guías laborales** claras para trabajadores en Colombia, con ritmo sostenido y calidad uniforme.

Jerarquía del producto: **Guías → Experiencias → Calculadoras**.

---

## 1. Plantilla de guía (obligatoria)

Cada guía nueva debe seguir esta estructura (bloques separados por línea en blanco). El editor puede insertarla con **Insertar plantilla**.

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

- [Calculadora relevante](/calculadoras/…)
- [Otra guía](/derechos/slug)
```

### Metadatos mínimos antes de publicar

| Campo | Criterio |
|-------|----------|
| Título | 5–160 caracteres; específico («Recargo dominical y festivo») |
| Resumen | 20–400 caracteres; qué aprenderá el lector |
| Tema (categoría) | Obligatorio |
| Fuentes oficiales | Al menos una URL https + editorial + fecha de consulta |
| Portada | Ideal 1200×628; alt descriptivo |
| Fecha de verificación | Actualizada al publicar o revisar |

---

## 2. Taxonomía (temas)

Usar las categorías de la base cuando existan. Agrupación editorial recomendada:

| Grupo editorial | Temas típicos |
|-----------------|---------------|
| **Jornada y recargos** | Horas extra, nocturno, dominical, festivos, límites |
| **Salario y pagos** | Salario mínimo, auxilio de transporte, descuentos, neto vs bruto |
| **Prestaciones** | Prima, cesantías, intereses, vacaciones |
| **Terminación** | Liquidación, despido, renuncia, justas causas |
| **Seguridad social y salud** | EPS, ARL, incapacidad, accidente de trabajo |
| **Contrato** | Término fijo/indefinido, OPS, periodo de prueba |
| **Trámites** | Derecho de petición, Ministerio del Trabajo, inspección |
| **Novedades** | Cambios normativos 2025–2027, reforma laboral (resumen actualizado) |

Una guía = un tema concreto. Evitar “todo sobre el salario” en un solo artículo.

---

## 3. Calendario prioritario (primeras 10)

Publicar o reforzar **una cada 7–10 días**. Orden por impacto de búsqueda y utilidad:

| # | Tema | Slug sugerido | Calculadora relacionada |
|---|------|---------------|-------------------------|
| 1 | Recargo dominical y festivo | `recargo-dominical-y-festivo` | Turnos / Administrativos |
| 2 | Horas extra y límites legales | `horas-extra-y-limites` | Turnos / Por días |
| 3 | Liquidación al terminar el contrato | `liquidacion-al-terminar` | `/liquidacion` |
| 4 | Auxilio de transporte | `auxilio-de-transporte` | — |
| 5 | Incapacidad: quién paga | `incapacidad-quien-paga` | — |
| 6 | Derecho de petición y a dónde acudir | (ya existe: reforzar) | — |
| 7 | Accidente de trabajo y enfermedad laboral | (ya existe: reforzar) | — |
| 8 | Contrato a término fijo vs indefinido | `contrato-fijo-vs-indefinido` | — |
| 9 | Prima, cesantías e intereses (calendario del año) | `prima-cesantias-intereses` | Prima / Cesantías |
| 10 | Qué cambió en la norma reciente (resumen) | `novedades-laborales-2026` | — |

Al reforzar una guía existente: actualizar verificación, fuentes, portada y enlaces a calculadoras.

---

## 4. Flujo de publicación

```
Borrador en Moderación → Editor
  → Insertar plantilla / escribir
  → Fuentes oficiales
  → Portada 1200×628
  → Vista previa
  → Guardar
  → Publicar (solo si fuentes y contenido revisados)
```

Checklist al pulsar **Publicar**:

- [ ] Lenguaje claro, Colombia, sin jerga innecesaria
- [ ] Norma o fuente citada (artículo / entidad)
- [ ] Al menos una fuente oficial con URL
- [ ] Secciones de la plantilla cubiertas (o justificado si no aplican)
- [ ] Enlace a calculadora u otra guía cuando aporte
- [ ] Portada o decisión consciente de no usarla
- [ ] Resumen SEO útil (qué resuelve la guía)

Retirar con **Retirar para revisar** si cambia la norma o hay error.

---

## 5. Criterios de calidad

**Sí**

- Frases cortas; ejemplos en pesos o días
- Distinguir “lo que dice la ley” de “lo que suele pasar en la empresa”
- Fecha de verificación visible
- Disclaimer de orientación general

**No**

- Prometer resultados legales
- Copiar textos legales largos sin explicar
- Afirmar montos de salario mínimo sin año
- Mezclar OPS y contrato laboral sin aclarar

Revisión sugerida: cada **6 meses** o cuando cambie la norma.

---

## 6. Relación con el resto del sitio

- Desde la guía: bloque de calculadoras relacionadas (ya en código).
- Desde la calculadora: enlace “Cómo se calcula” → guía.
- Experiencias: CTA al final de la guía, no al inicio.

---

## 7. Ritmo editorial sugerido

| Semana | Acción |
|--------|--------|
| Impar | Publicar o reescribir 1 guía prioritaria |
| Par | Actualizar fuentes de 1–2 guías viejas + portadas |

Documento vivo: actualizar este archivo cuando cambie la taxonomía o el calendario.
