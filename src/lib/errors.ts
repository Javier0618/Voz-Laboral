import { AppError } from './supabase';

type RawError = { message?: string; code?: string; status?: number } | null | undefined;

/**
 * Convierte errores de Supabase/Postgres en mensajes comprensibles.
 * Nunca devuelve detalles internos (nombres de tablas, consultas, trazas).
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const raw = (error ?? {}) as RawError & { name?: string };
  const message = raw?.message ?? '';

  const business = /VL(\d{3}):\s*(.+)$/s.exec(message);
  if (business) {
    const code = business[1];
    const kind = code === '403' ? 'permission' : code === '401' ? 'auth' : code === '404' ? 'not_found' : 'validation';
    const text = code === '403' ? 'No tienes permiso para realizar esta acción.' : business[2].trim();
    return new AppError(kind, text);
  }
  if (raw?.code === '42501' || /permission denied|row-level security/i.test(message)) {
    return new AppError('permission', 'No tienes permiso para realizar esta acción.');
  }
  if (raw?.code === '23505' || /duplicate key/i.test(message)) {
    return new AppError('validation', 'Ese valor ya está en uso. Prueba con otro.');
  }
  if (/Invalid login credentials/i.test(message)) {
    return new AppError('auth', 'El correo o la contraseña no coinciden.');
  }
  if (/Email not confirmed/i.test(message)) {
    return new AppError('auth', 'Confirma tu correo con el enlace que te enviamos antes de iniciar sesión.');
  }
  if (/User already registered/i.test(message)) {
    return new AppError('auth', 'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.');
  }
  if (/Password should be/i.test(message)) {
    return new AppError('validation', 'La contraseña no cumple los requisitos de seguridad.');
  }
  if (/rate limit|too many/i.test(message)) {
    return new AppError('validation', 'Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.');
  }
  if (/Failed to fetch|NetworkError|network/i.test(message) || raw?.name === 'TypeError') {
    return new AppError('network', 'No hay conexión con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.');
  }
  return new AppError('unknown', 'Algo no funcionó como esperábamos. Inténtalo de nuevo en unos minutos.');
}
