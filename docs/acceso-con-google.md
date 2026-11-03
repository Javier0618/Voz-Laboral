# Entrar con Google

En `/cuenta` hay un botón para iniciar sesión o crear la cuenta con Google. Funciona de dos maneras:

- **Con `VITE_GOOGLE_CLIENT_ID`** (la recomendada): la web muestra el **botón oficial de Google**. Google abre una ventana emergente a nombre de **tuvozlaboral.com**. La persona no sale del sitio, y la web entrega a Supabase el comprobante de Google (`signInWithIdToken`, con un *nonce* para que no se pueda reutilizar). El script de Google solo se carga en `/cuenta`.
- **Sin esa variable**, o si el script de Google no carga, la web usa la redirección de Supabase (`signInWithOAuth`). Funciona igual, pero Google muestra «Ir a TU-PROYECTO.supabase.co».

El código ya está listo. Solo falta configurarlo una vez en Google, en Supabase y en el `.env` del VPS.

## Cómo funciona

- Al entrar, la web sigue a la página desde donde se pidió entrar (por ejemplo, la calculadora con los días anotados). Con el botón oficial pasa en la misma página. Con la redirección, Supabase abre la sesión en `/cuenta` y desde ahí sigue.
- **Crear cuenta:** en la pestaña «Crear cuenta», hay que marcar antes la casilla de la política de datos. En «Iniciar sesión», el texto bajo el botón avisa que, si es la primera vez, se crea la cuenta y que al continuar se acepta la política. Esa conducta cuenta como autorización (Decreto 1377 de 2013, art. 7).
- **Datos:** Google envía el correo, el nombre y la foto. Supabase Auth los guarda con la cuenta, pero el sitio solo usa el correo. El nombre y la foto no se muestran. Así lo dice la política de tratamiento de datos.
- **Misma persona, dos formas de entrar:** si alguien creó la cuenta con correo y contraseña y después entra con Google con el mismo correo, Supabase une las dos formas de acceso en la misma cuenta.
- **Captcha:** la verificación anti-robots (Turnstile) aplica al correo y la contraseña. Con Google no hace falta, porque Google ya verifica a la persona.

## Configuración (una sola vez)

### 1. Google Cloud

En [console.cloud.google.com](https://console.cloud.google.com), crea un proyecto (por ejemplo, «TuVozLaboral») y después:

1. **Pantalla de consentimiento** (Google Auth Platform → Branding):
   - nombre de la app: `TuVozLaboral`;
   - correo de asistencia: el de la administración;
   - página principal: `https://tuvozlaboral.com`;
   - política de privacidad: `https://tuvozlaboral.com/politicas/tratamiento-de-datos`;
   - términos: `https://tuvozlaboral.com/politicas/terminos`;
   - dominio autorizado: `tuvozlaboral.com`.

   El logo es opcional. Si lo subes (`marca/icono-512.png` sirve), Google revisa la marca antes de mostrarlo, y eso puede tardar unos días.
2. **Público** (Audience): tipo «Externo». Pulsa **Publicar la app** («En producción»). Si la dejas «En prueba», solo pueden entrar los correos que agregues como usuarios de prueba. Los permisos que usa el sitio (correo y perfil básico) no necesitan la verificación de Google.
3. **Cliente OAuth** (Clients → Crear cliente → Aplicación web):
   - orígenes de JavaScript autorizados: `https://tuvozlaboral.com`;
   - URI de redireccionamiento autorizado: `https://TU-PROYECTO.supabase.co/auth/v1/callback`. Cópiala de Supabase en el paso siguiente.

   Guarda el **ID de cliente** y el **secreto del cliente**.

### 2. Supabase

1. **Authentication → Sign In / Providers → Google:**
   - actívalo;
   - pega el ID de cliente y el secreto;
   - guarda.

   Ahí mismo está la «Callback URL» que va en el paso 3 de Google.
2. **Authentication → URL Configuration:**
   - **Site URL:** `https://tuvozlaboral.com`;
   - **Redirect URLs:** agrega `https://tuvozlaboral.com/cuenta`. Si usas también `www`, agrega `https://www.tuvozlaboral.com/cuenta`.

### 3. ID de cliente en la web (para que Google muestre tuvozlaboral.com)

En el `.env` del VPS, agrega el **ID de cliente** de Google, que es público:

```
VITE_GOOGLE_CLIENT_ID=000000000000-xxxxxxxx.apps.googleusercontent.com
```

Después publica con `FORZAR=1 bash scripts/desplegar.sh`. Las variables `VITE_*` se leen al compilar, por eso hay que forzar la compilación. El **secreto** no va en el `.env`: va solo en Supabase.

Si usas la cabecera `Content-Security-Policy` de `docs/despliegue-vps.md`, agrega `https://accounts.google.com` en `script-src`, `frame-src`, `connect-src` y `style-src`.

### 4. Probar

Abre `https://tuvozlaboral.com/cuenta`, pulsa «Iniciar sesión con Google» y elige una cuenta. La ventana de Google debe decir «para continuar a tuvozlaboral.com». Debes volver a «Mi cuenta» con la sesión abierta. Una cuenta nueva te pide elegir el alias, igual que con correo.

El secreto del cliente va solo en Supabase. No va en el repositorio, ni en el `.env` del VPS, ni en variables `VITE_*`.
