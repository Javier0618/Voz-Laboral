// Traduce errores de Supabase/Postgres a mensajes claros. Los mensajes que ya
// vienen en español desde nuestras funciones se muestran tal cual.
interface PgLikeError {
  message?: string;
  code?: string;
  details?: string;
}

export function friendlyError(error: unknown): string {
  const e = (error ?? {}) as PgLikeError;
  const msg = e.message ?? '';
  if (e.code === '23505' || /duplicate key/i.test(msg)) {
    if (/alias/i.test(msg)) return 'Ese alias ya está en uso. Elige otro.';
    if (/content_hash|author_hash/i.test(msg)) return 'Ya enviaste un relato idéntico.';
    if (/content_reports/i.test(msg)) return 'Ya reportaste este contenido y está en revisión.';
    if (/appeals/i.test(msg)) return 'Ya hay una apelación pendiente para esta experiencia.';
    if (/company_claims/i.test(msg)) return 'Ya enviaste una solicitud igual que está pendiente.';
    return 'Ese registro ya existe.';
  }
  if (e.code === '42501' && /row-level security|permission denied/i.test(msg)) {
    return 'No tienes permiso para hacer esto.';
  }
  if (e.code === '23514' || /violates check constraint/i.test(msg)) {
    if (/account_length/.test(msg)) return 'El relato debe tener entre 200 y 5000 caracteres.';
    if (/alias_format/.test(msg)) return 'El alias tiene caracteres no permitidos.';
    return 'Algún dato no cumple el formato esperado.';
  }
  if (/Failed to fetch|NetworkError|network/i.test(msg)) {
    return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
  }
  if (/Invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.';
  if (/Email not confirmed/i.test(msg)) return 'Confirma tu correo antes de iniciar sesión.';
  if (/User already registered/i.test(msg)) return 'Ya existe una cuenta con ese correo.';
  if (/rate limit/i.test(msg)) return 'Demasiados intentos. Espera unos minutos.';
  if (msg && /[áéíóúñ¿]|^(No |Solo |Elige|Escribe|Llegaste|Necesitas|Indica|Activa|La |El |Esta )/.test(msg)) return msg;
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
