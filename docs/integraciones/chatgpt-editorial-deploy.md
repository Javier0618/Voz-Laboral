# Activar el puente editorial de ChatGPT

La función `supabase/functions/editorial-bridge/index.ts` no se activa solo con hacer push al repositorio. Debe desplegarse como Supabase Edge Function y recibir secretos del entorno.

## 1. Secretos

Configura en Supabase, en Edge Functions → Secrets:

- `REDACTOR_EMAIL`: correo de la cuenta con rol `redactor`.
- `REDACTOR_PASSWORD`: contraseña de esa cuenta. No debe estar en GitHub.
- `EDITORIAL_BRIDGE_TOKEN`: token largo, aleatorio y exclusivo para este puente.

La función usa `SUPABASE_URL` y `SUPABASE_ANON_KEY` que Supabase proporciona al entorno. No usa ni necesita `service_role`.

## 2. Despliegue

Desde la raíz del repositorio, con Supabase CLI instalado y autenticado, vincula el proyecto una sola vez:

```bash
supabase link --project-ref TU_PROJECT_REF
```

El archivo `supabase/config.toml` establece `verify_jwt = false` únicamente para `editorial-bridge`. Es necesario porque el cliente externo utiliza el token Bearer propio del puente y no un JWT de Supabase. La propia función comprueba ese token antes de aceptar cualquier operación.

Despliega la función:

```bash
supabase functions deploy editorial-bridge
```

También puedes indicar explícitamente `--no-verify-jwt`; la configuración del repositorio ya deja ese comportamiento establecido para esta función.

Configura los secretos antes de probar el endpoint. Puedes hacerlo desde el panel de Supabase o con `supabase secrets set`; no escribas los valores en archivos del repositorio.

## 3. Endpoint

La URL tendrá esta forma:

```
https://TU_PROJECT_REF.supabase.co/functions/v1/editorial-bridge
```

Usa el archivo `docs/integraciones/chatgpt-editorial.openapi.yaml` para configurar una acción/API privada en ChatGPT y reemplaza el servidor de ejemplo por la URL real del proyecto.

## 4. Permisos

El puente solo expone lectura editorial, creación de sugerencias, borradores y propuestas.

No expone:

- publicación;
- aplicación de propuestas;
- borrado;
- administración de usuarios;
- modificación de roles;
- SQL;
- `service_role`.

La cuenta editorial se autentica dentro de la función y las RPC de Supabase vuelven a comprobar el rol. Hay dos capas de protección.

## 5. Prueba

Usa el token Bearer configurado en Supabase para probar primero:

- `GET /health`: confirma que la función responde.
- `GET /guias`: confirma que la autenticación de la cuenta editorial y la RPC funcionan.

Si `/health` responde pero `/guias` falla, revisa las credenciales de la cuenta editorial y que su perfil esté activo y tenga el rol correspondiente.

El token nunca debe escribirse en este repositorio, en el archivo OpenAPI ni en el frontend. Si se expone, rótalo en los secretos de Supabase.
