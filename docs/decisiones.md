# Decisiones de arquitectura y diseño

Este documento registra las decisiones tomadas y los supuestos asumidos. Cuando el encargo no especificaba algo, se eligió la alternativa más segura y sencilla.

## Arquitectura

| Decisión | Motivo |
|---|---|
| React 18 + TypeScript + Vite + Tailwind 3; Supabase (Postgres y Auth) | Es el stack pedido. No se usa biblioteca de componentes: los pocos que hacen falta (diálogo, combobox, pestañas) se construyen sobre HTML nativo accesible (`<dialog>` y el patrón combobox de WAI-ARIA), lo que evita dependencias. |
| **La seguridad vive en la base de datos** | RLS en todas las tablas y privilegios **por columna**. Ocultar un botón nunca es la barrera: las pruebas atacan la base de datos directamente. |
| Privilegios por columna en lugar de vistas | `author_id`, `content_hash`, `auto_flags`, `claimant_id`, `reporter_id` y el correo nunca son legibles para `anon` ni `authenticated`. En consecuencia, el frontend nombra las columnas: un `select *` falla. |
| Cambios de estado solo mediante funciones `security definer` | Nadie puede actualizar `status` desde la API. `moderate_experience()` exige rol y motivo, impide moderar el contenido propio y escribe en `moderation_events`. |
| Esquema `private` para funciones internas | La API de Supabase no lo expone. Contiene `is_moderator()`, `is_admin()`, los triggers y el registro de auditoría. |
| `ALTER DEFAULT PRIVILEGES` revoca `EXECUTE` | Supabase concede por defecto `EXECUTE` sobre las funciones de `public`. Aquí cada función recibe su permiso de forma explícita. |
| El NIT va en `company_private_data` | Es una tabla aparte, solo para administración: así el NIT no puede filtrarse por un `select` público. |
| Sugerencias de empresas (`company_suggestions`) | Tabla adicional, no listada en el encargo: los usuarios proponen empresas sin poder crear perfiles públicos. |
| Detección de datos personales en el cliente **y** en el servidor | Ambos usan las mismas expresiones regulares. En el servidor solo marcan (`auto_flags`) para priorizar la revisión humana; nunca rechazan ni deciden. |
| Límites de frecuencia en triggers | 3 experiencias, 10 reportes, reclamaciones o apelaciones y 5 sugerencias por cada 24 h. Cuando se alcanzan, queda registro en `security_events`. |
| Estadísticas con supresión | Las categorías con menos de 3 experiencias se agrupan, y si el total es menor que 3 no se muestra desglose. El periodo se muestra por años. Sin puntuaciones ni rankings. |
| Borrador en `sessionStorage` | Sobrevive a errores y recargas, pero se borra al cerrar la pestaña, lo que protege en equipos compartidos. |
| Fuentes alojadas en el propio proyecto (`@fontsource`) | Evita enviar la IP de cada visitante a Google Fonts. |
| Archivos de respaldo **no habilitados** | `evidence_files` existe con RLS cerrada y sin políticas, y no hay bucket. Se habilitará en la fase 5, cuando estén los controles: tipo real, tamaño, metadatos, acceso temporal y registro de accesos. |
| Pruebas de base de datos con PGlite | El entorno no tiene Docker. PGlite es Postgres real compilado a WASM. El arnés reproduce los roles, `auth.uid()` y los privilegios por defecto de Supabase, y aplica las migraciones reales. Antes de producción conviene repetirlas con `supabase start` (ver `checklist-seguridad.md`). |

## Supuestos

- La relación con la empresa, el periodo (mes y año) y la indicación de que hay documentos son públicos. El resto de metadatos no.
- Las experiencias `en_disputa` siguen visibles con una marca; las `restringida` y `retirada` se ocultan.
- Las respuestas empresariales las publica el equipo de moderación tras verificar al representante. En el MVP no hay cuentas de empresa.
- Las guías de derechos no se precargan porque deben verificarse contra la fuente oficial. Una guía no se puede publicar sin fecha de verificación ni sin al menos una fuente.

## Sistema visual

La dirección es sobria y confiable: ni red social ni portal gubernamental.

- **Color** (en `src/index.css`, `:root`):
  - tinta `#0F2440` y navy `#1B3A5C`;
  - verde azulado `#0F766E` para las acciones, con tinte `#E6F2F1`;
  - niebla `#F3F5F8`, línea `#D9DEE5` y pizarra `#4A5566`;
  - ámbar `#B45309` para advertencias y rojo `#B42318` para errores.
- **Tipografía**: Newsreader (serif) para titulares y para el texto de los relatos, que así ganan un tono de testimonio escrito; Instrument Sans para la interfaz. Escala de tercera mayor sobre 16 px y líneas de 68 caracteres como máximo.
- **Elemento distintivo: las barras de censura.** En la portada, una experiencia de ejemplo, marcada como ilustrativa, muestra los datos privados tapados: explica la protección de identidad sin texto adicional. Las mismas barras forman el logotipo. Son el único movimiento automático del sitio y respetan `prefers-reduced-motion`.
- **Recursos evitados a propósito**:
  - rejillas de tarjetas idénticas;
  - sombras y degradados decorativos;
  - etiquetas en mayúsculas sobre cada título;
  - flechas en los botones;
  - numeración donde no hay una secuencia real. Solo «Cómo funciona la publicación» está numerada, porque es un proceso.
- **Estados de moderación**: chips con texto y un punto de color, nunca solo color. Cada estado tiene su explicación al pasar el cursor y en «Mi cuenta».
