# Activar el puente editorial de ChatGPT

La función `supabase/functions/editorial-bridge/index.ts` no se activa solo con hacer push al repositorio. Debe desplegarse como Supabase Edge Function y recibir secretos del entorno.

## 1. Secretos

Configura en Supabase:

- `REDACTOR_EMAIL`: correo de la cuenta con rol `redactor`.
- `REDACTOR_PASSWORD`: contraseña de esa cuenta. No debe estar en GitHub.
- `EDITORIAL_BRIDGE_TOKEN`: token largo y aleatorio que se usará para autenticar al cliente externo.

La función usa `SUPABASE_URL` y `SUPABASE_ANON_KEY` del proyecto. No usa ni necesita `service_role`.

## 2. Despliegue

Desde el proyecto, con Supabase CLI autenticado:

```bash
supabase functions deploy editorial-bridge
```

Configura los secretos antes del despliegue con `supabase secrets set` o desde el panel de Supabase.

## 3. Endpoint

La URL tendrá esta forma:

```
https://TU_PROYECTO.supabase.co/functions/v1/editorial-bridge
```

Usa el archivo `docs/integraciones/chatgpt-editorial.openapi.yaml` para configurar una acción/API privada en el cliente de ChatGPT.

## 4. Permisos

El puente solo expone lectura editorial, creación de sugerencias, borradores y propuestas.

No expone:

- publicación;
- aplicación de propuestas;
- borrado;
- administración de usuarios;
- modificación de roles;
- SQL;
- service_role.

La cuenta editorial se autentica dentro de la función y las RPC de Supabase vuelven a comprobar el rol `redactor`. Hay dos capas de protección.

## 5. Importante

El token `EDITORIAL_BRIDGE_TOKEN` no debe escribirse en este repositorio, en el código del frontend ni en el archivo OpenAPI.

Después de desplegar, prueba primero `GET /health` y después `GET /guias`. Si ambos funcionan, configura la acción de ChatGPT con el esquema OpenAPI.
