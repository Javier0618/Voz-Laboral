# Entrar con Google

En `/cuenta`, el botón **«Continuar con Google»** inicia sesión o crea la cuenta con Google, usando el inicio de sesión de Supabase (`signInWithOAuth`). El código ya está listo. Solo falta configurarlo una vez en Google y en Supabase. Mientras no lo configures, el botón lleva a una página de error de Supabase.

## Cómo funciona

- Al pulsar el botón, el navegador va a Google. Al volver, Supabase abre la sesión en `/cuenta` y la web sigue a la página desde donde se pidió entrar (por ejemplo, la calculadora con los días anotados).
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

### 3. Probar

Abre `https://tuvozlaboral.com/cuenta`, pulsa «Continuar con Google» y elige una cuenta. Debes volver a «Mi cuenta» con la sesión abierta. Una cuenta nueva te pide elegir el alias, igual que con correo.

El secreto del cliente va solo en Supabase. No va en el repositorio, ni en el `.env` del VPS, ni en variables `VITE_*`.
