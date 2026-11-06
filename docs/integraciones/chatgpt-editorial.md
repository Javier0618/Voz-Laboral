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

La subida de imágenes queda fuera del primer contrato. Se incorporará después de endurecer la política de Storage.

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

## Autenticación

El servidor del puente debe mantener las credenciales fuera del navegador y fuera del repositorio. Las variables deben configurarse únicamente como secretos del entorno:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `REDACTOR_EMAIL`
- `REDACTOR_PASSWORD`

Nunca registrar estas variables ni devolverlas en respuestas.

## Regla de seguridad

El puente debe autenticarse como la cuenta editorial `redactor` y usar exclusivamente las RPC existentes diseñadas para ese rol. No debe conceder privilegios adicionales mediante una clave de servicio.

## Flujo

ChatGPT -> endpoint/MCP editorial -> autenticación Supabase como redactor -> RPC editorial -> Supabase.

La publicación continúa siendo una acción humana desde Moderación.

## Estado

Esta especificación es deliberadamente independiente del cliente ChatGPT. Sirve como contrato para implementar después un endpoint HTTP o un servidor MCP sin modificar el flujo editorial existente.
