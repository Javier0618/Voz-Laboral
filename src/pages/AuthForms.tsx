import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { requireClient, type AppError } from '../lib/supabase';
import { toAppError } from '../lib/errors';
import { emailSchema, passwordSchema } from '../lib/schemas';
import { useAuth } from '../auth/AuthProvider';
import { Alert, Field } from '../components/ui';
import { useTurnstile } from '../components/Turnstile';

type Mode = 'login' | 'registro' | 'recuperar';

/** A dónde volver después de entrar con Google (la redirección de Google siempre llega a /cuenta). */
export const NEXT_AFTER_OAUTH = 'tuvozlaboral:siguiente';

/** Logotipo «G» de Google, con sus colores oficiales (guía de marca de Google Sign-In). */
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export function AuthForms() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>((params.get('modo') as Mode) || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<AppError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const captcha = useTurnstile();
  const navigate = useNavigate();
  const next = params.get('siguiente');

  function switchTo(m: Mode) {
    setMode(m);
    setErrors({});
    setError(null);
    setNotice(null);
  }

  async function google() {
    if (mode === 'registro' && !accepted) {
      setErrors({ accepted: 'Debes aceptar la política de tratamiento de datos para crear la cuenta.' });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (next?.startsWith('/') && !next.startsWith('//')) sessionStorage.setItem(NEXT_AFTER_OAUTH, next);
      const { error: err } = await requireClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/cuenta`, queryParams: { prompt: 'select_account' } },
      });
      if (err) throw err;
      // El navegador sale hacia Google; al volver, Supabase abre la sesión en /cuenta.
    } catch (err) {
      setError(toAppError(err));
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v: Record<string, string> = {};
    const em = emailSchema.safeParse(email);
    if (!em.success) v.email = em.error.issues[0].message;
    if (mode === 'registro') {
      const pw = passwordSchema.safeParse(password);
      if (!pw.success) v.password = pw.error.issues[0].message;
      if (!accepted) v.accepted = 'Debes aceptar la política de tratamiento de datos para crear la cuenta.';
    }
    if (mode === 'login' && !password) v.password = 'Escribe tu contraseña.';
    if (!captcha.ready) v.captcha = 'Completa la verificación anti-robots.';
    setErrors(v);
    if (Object.keys(v).length) return;

    setBusy(true);
    setError(null);
    setNotice(null);
    const client = requireClient();
    const captchaToken = captcha.token;
    try {
      if (mode === 'login') {
        const { error: err } = await client.auth.signInWithPassword({ email: email.trim(), password, options: { captchaToken } });
        if (err) throw err;
        if (next?.startsWith('/') && !next.startsWith('//')) navigate(next);
      } else if (mode === 'registro') {
        const { error: err } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/cuenta`, captchaToken },
        });
        if (err) throw err;
        setNotice('Te enviamos un correo para confirmar la cuenta. Abre el enlace y vuelve para elegir tu alias.');
        setPassword('');
      } else {
        const { error: err } = await client.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/cuenta/nueva-contrasena`,
          captchaToken,
        });
        if (err) throw err;
        // Mismo mensaje exista o no la cuenta: no revela qué correos están registrados.
        setNotice('Si existe una cuenta con ese correo, recibirás un enlace para crear una nueva contraseña.');
      }
    } catch (err) {
      setError(toAppError(err));
    } finally {
      setBusy(false);
      // Cada token de Turnstile sirve una sola vez.
      captcha.reset();
    }
  }

  const title = mode === 'login' ? 'Iniciar sesión' : mode === 'registro' ? 'Crear una cuenta' : 'Recuperar la contraseña';

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,28rem)_1fr]">
      <div>
        <div role="tablist" aria-label="Acceso" className="flex gap-1 border-b border-line">
          {(['login', 'registro'] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold ${mode === m ? 'border-teal text-teal-strong' : 'border-transparent text-slate hover:text-ink'}`}
              onClick={() => switchTo(m)}>
              {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>
        {mode !== 'recuperar' && (
          <div className="mt-6 space-y-3">
            {mode === 'registro' && (
              <div>
                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-teal" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} aria-invalid={Boolean(errors.accepted)} />
                  <span>
                    Acepto la <a href="/politicas/tratamiento-de-datos" target="_blank" className="btn-link">política de tratamiento de datos</a> y los{' '}
                    <a href="/politicas/terminos" target="_blank" className="btn-link">términos de uso</a>.
                  </span>
                </label>
                {errors.accepted && <p className="field-error">{errors.accepted}</p>}
              </div>
            )}
            <button type="button" className="btn w-full border border-line bg-white text-[#1F1F1F] hover:bg-[#F7F8F8] dark:border-white/30" onClick={() => void google()} disabled={busy}>
              <GoogleLogo />
              Continuar con Google
            </button>
            <p className="text-xs text-slate">
              {mode === 'registro'
                ? 'De Google solo usamos tu correo para acceder; tu nombre y tu foto nunca se publican.'
                : <>Si es tu primera vez, se crea una cuenta. Al continuar aceptas la <a href="/politicas/tratamiento-de-datos" target="_blank" className="btn-link">política de tratamiento de datos</a> y los <a href="/politicas/terminos" target="_blank" className="btn-link">términos de uso</a>. Tu nombre y tu foto de Google nunca se publican.</>}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate" aria-hidden="true">
              <span className="h-px flex-1 bg-line" />o con tu correo<span className="h-px flex-1 bg-line" />
            </div>
          </div>
        )}
        <form onSubmit={submit} noValidate className="mt-6 space-y-5" aria-label={title}>
          {mode === 'recuperar' && <h2 className="text-xl">Recuperar la contraseña</h2>}
          <Field label="Correo electrónico" error={errors.email} hint={mode === 'registro' ? 'Solo lo usamos para acceder y avisarte. Nunca se publica.' : undefined}>
            {(p) => <input {...p} type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          {mode !== 'recuperar' && (
            <Field label="Contraseña" error={errors.password} hint={mode === 'registro' ? 'Al menos 10 caracteres, con letras y números.' : undefined}>
              {(p) => (
                <input {...p} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="input"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              )}
            </Field>
          )}
          {captcha.widget && (
            <div>
              {captcha.widget}
              {errors.captcha && <p className="field-error">{errors.captcha}</p>}
            </div>
          )}
          {error && <Alert tone="error">{error.message}</Alert>}
          {notice && <Alert tone="success">{notice}</Alert>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Un momento…' : mode === 'login' ? 'Iniciar sesión' : mode === 'registro' ? 'Crear cuenta' : 'Enviar enlace'}
          </button>
          {mode === 'login' && (
            <button type="button" className="btn-link text-sm" onClick={() => switchTo('recuperar')}>Olvidé mi contraseña</button>
          )}
          {mode === 'recuperar' && (
            <button type="button" className="btn-link text-sm" onClick={() => switchTo('login')}>Volver a iniciar sesión</button>
          )}
        </form>
      </div>
      <section className="text-slate lg:border-l lg:border-line lg:pl-10" aria-labelledby="por-que-cuenta">
        <h2 id="por-que-cuenta" className="text-xl">Por qué pedimos una cuenta</h2>
        <p className="mt-3 max-w-prose">
          La cuenta nos permite limitar el spam, que consultes el estado de tus publicaciones y que puedas editarlas, apelar o retirarlas. No
          pedimos tu nombre real ni documentos de identidad.
        </p>
        <p className="mt-3 max-w-prose">Después de confirmar tu correo elegirás un alias: es lo único que verán otras personas.</p>
      </section>
    </div>
  );
}

export function NewPasswordForm() {
  const { session } = useAuth();
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [error, setError] = useState<AppError | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!session) {
    return <Alert tone="warning" title="El enlace no es válido o caducó">Solicita un nuevo enlace desde «Olvidé mi contraseña».</Alert>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const pw = passwordSchema.safeParse(password);
    if (!pw.success) return setFieldError(pw.error.issues[0].message);
    setFieldError(undefined);
    setBusy(true);
    try {
      const { error: err } = await requireClient().auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
    } catch (err) {
      setError(toAppError(err));
    } finally {
      setBusy(false);
    }
  }

  return done ? (
    <Alert tone="success" title="Contraseña actualizada">Ya puedes seguir usando tu cuenta.</Alert>
  ) : (
    <form onSubmit={submit} noValidate className="max-w-md space-y-5">
      <Field label="Nueva contraseña" error={fieldError} hint="Al menos 10 caracteres, con letras y números.">
        {(p) => <input {...p} type="password" autoComplete="new-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />}
      </Field>
      {error && <Alert tone="error">{error.message}</Alert>}
      <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar contraseña'}</button>
    </form>
  );
}
