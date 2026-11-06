# Puente editorial para ChatGPT

Esta carpeta contiene el contrato y la especificación de seguridad para exponer el flujo editorial de VozLaboral a un asistente externo.

## Objetivo

Permitir que un asistente pueda consultar material editorial y crear sugerencias, borradores o propuestas, sin capacidad de publicar, borrar contenido, modificar usuarios o administrar roles.

## Operaciones permitidas

- `listar_guias`
- `leer_guia`
- `consultar_sugerencias`
- `consultar_busquedas`
- `crear_sugerencia`
- `guardar_borrador`
- `guardar_propuesta`

La subida de imágenes queda fuera del primer contrato.

## Operaciones prohibidas

El puente nunca debe exponer:

- publicación de guías;
- aplicación de propuestas a contenido publicado;
- eliminación de guías;
- eliminación de sugerencias;
- modificación de `admin_roles`;
- acceso a `auth.users`;
- acceso a datos privados de usuarios;
- ejecución de SQL arbitrario;
- uso de la clave `service_role`.

## Autenticación y secretos

El servidor del puente usa estas variables, configuradas únicamente como secretos del entorno de Supabase:

- `SUPABASE_URL` y `SUPABASE_ANON_KEY`: las proporciona Supabase al entorno de Edge Functions.
- `REDACTOR_EMAIL`: correo de la cuenta con rol `redactor`.
- `REDACTOR_PASSWORD`: contraseña de esa cuenta.
- `EDITORIAL_BRIDGE_TOKEN`: token largo y aleatorio que autentica al cliente externo.

No guardes credenciales en el repositorio, en el frontend ni en el esquema OpenAPI. Nunca registres estos valores ni los devuelvas en respuestas.

## Regla de seguridad

El endpoint comprueba `EDITORIAL_BRIDGE_TOKEN` y, después, inicia sesión en Supabase como la cuenta editorial. Las RPC vuelven a comprobar el rol `redactor`. No se utiliza una clave de servicio ni se concede privilegio adicional a la cuenta.

La verificación JWT del gateway de Edge Functions debe desactivarse para esta función al desplegarla, porque el cliente externo presenta el token propio del puente, no un JWT de Supabase. Esto no deja el endpoint abierto: la función rechaza cualquier petición que no incluya el token correcto.

## Flujo

ChatGPT -> endpoint editorial -> token privado -> autenticación Supabase como redactor -> RPC editorial -> Supabase.

La publicación continúa siendo una acción humana desde Moderación.

