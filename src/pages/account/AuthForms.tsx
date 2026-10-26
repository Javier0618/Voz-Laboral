import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { Checkbox, TextField } from '../../components/Field';
import { PageHeader } from '../../components/PageHeader';
import { Notice } from '../../components/States';
import { SupabaseGate } from '../../components/SupabaseGate';
import { useToast } from '../../components/Toast';
import { friendlyError } from '../../lib/errors';
import { requireClient } from '../../lib/supabase';
import { emailSchema, fieldErrors, passwordSchema, signUpSchema } from '../../shared/schemas';

const redirect = (path: string) => `${window.location.origin}${path}`;

function Shell({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="container-page max-w-xl">
      <PageHeader title={title}>{intro}</PageHeader>
      <SupabaseGate>
        <div className="py-6">{children}</div>
      </SupabaseGate>
    </div>
  );
}

export function SignIn() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/cuenta';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to={from} replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await requireClient().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) setError(friendlyError(err));
    else navigate(from, { replace: true });
  }

  return (
    <Shell title="Ingresar">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <TextField label="Correo electrónico" type="email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        <TextField label="Contraseña" type="password" autoComplete="current-password" value={password}
          onChange={(e) => setPassword(e.target.value)} required />
        {error && <Notice tone="danger" role="alert">{error}</Notice>}
        <button type="submit" className="btn-primary" disabled={busy} aria-busy={busy}>
          {busy ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
      <ul className="mt-6 space-y-1">
        <li><Link className="inline-flex min-h-11 items-center" to="/cuenta/recuperar">Olvidé mi contraseña</Link></li>
        <li><Link className="inline-flex min-h-11 items-center" to="/cuenta/registro">Crear una cuenta</Link></li>
      </ul>
    </Shell>
  );
}

export function SignUp() {
  const [form, setForm] = useState({ email: '', password: '', alias: '', acceptPolicy: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    setError(null);
    const { error: err } = await requireClient().auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { alias: parsed.data.alias }, emailRedirectTo: redirect('/cuenta/confirmada') },
    });
    setBusy(false);
    if (err) setError(friendlyError(err));
    else setSent(true);
  }

  if (sent) {
    return (
      <Shell title="Revisa tu correo">
        <Notice tone="success" role="status" title="Te enviamos un enlace de confirmación">
          Abre el enlace que llegó a tu correo para activar la cuenta. Si no lo ves, revisa la carpeta de spam.
        </Notice>
      </Shell>
    );
  }

  return (
    <Shell title="Crear cuenta" intro="Tu correo solo sirve para entrar. En la plataforma solo se ve tu alias.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <TextField label="Correo electrónico" type="email" autoComplete="email" value={form.email} error={errors.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <TextField label="Contraseña" type="password" autoComplete="new-password" value={form.password}
          error={errors.password} hint="Al menos 10 caracteres."
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <TextField label="Alias público" value={form.alias} error={errors.alias} autoComplete="off"
          hint="Entre 3 y 30 caracteres. No uses tu nombre ni algo parecido a tu correo."
          onChange={(e) => setForm({ ...form, alias: e.target.value })} />
        <Checkbox
          label="Acepto la política de tratamiento de datos"
          checked={form.acceptPolicy}
          error={errors.acceptPolicy}
          onChange={(e) => setForm({ ...form, acceptPolicy: e.target.checked })}
          hint={<>Lee la <Link to="/politica-de-datos">política de datos</Link>.</>}
        />
        {error && <Notice tone="danger" role="alert">{error}</Notice>}
        <button type="submit" className="btn-primary" disabled={busy} aria-busy={busy}>
          {busy ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </Shell>
  );
}

export function EmailConfirmed() {
  const { session, loading } = useAuth();
  return (
    <Shell title="Correo confirmado">
      {loading ? (
        <p role="status">Comprobando…</p>
      ) : session ? (
        <Notice tone="success" role="status" title="Tu cuenta está activa">
          <Link to="/cuenta">Ir a Mi cuenta</Link>
        </Notice>
      ) : (
        <Notice tone="info" title="Ya puedes ingresar">
          Si el enlace expiró, vuelve a registrarte o <Link to="/cuenta/ingresar">ingresa</Link>.
        </Notice>
      )}
    </Shell>
  );
}

export function RecoverPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await requireClient().auth.resetPasswordForEmail(parsed.data, {
      redirectTo: redirect('/cuenta/nueva-contrasena'),
    });
    setBusy(false);
    if (err) setError(friendlyError(err));
    else setSent(true);
  }

  return (
    <Shell title="Recuperar contraseña">
      {sent ? (
        <Notice tone="success" role="status">
          Si existe una cuenta con ese correo, te llegará un enlace para crear una contraseña nueva.
        </Notice>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextField label="Correo electrónico" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} error={error ?? undefined} />
          <button type="submit" className="btn-primary" disabled={busy} aria-busy={busy}>
            {busy ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      )}
    </Shell>
  );
}

export function ResetPassword() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await requireClient().auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (err) setError(friendlyError(err));
    else {
      toast.show('Contraseña actualizada');
      navigate('/cuenta');
    }
  }

  return (
    <Shell title="Nueva contraseña">
      {loading ? (
        <p role="status">Comprobando el enlace…</p>
      ) : !session ? (
        <Notice tone="warning">
          El enlace no es válido o expiró. <Link to="/cuenta/recuperar">Pide uno nuevo</Link>.
        </Notice>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextField label="Contraseña nueva" type="password" autoComplete="new-password" value={password}
            hint="Al menos 10 caracteres." onChange={(e) => setPassword(e.target.value)} error={error ?? undefined} />
          <button type="submit" className="btn-primary" disabled={busy} aria-busy={busy}>
            {busy ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      )}
    </Shell>
  );
}
