// Borrador local del formulario de experiencia. Se guarda en el navegador de
// la persona (no en el servidor) y solo se borra tras un envío exitoso.
const PREFIX = 'vozlaboral:borrador:';

export function loadDraft<T>(userId: string): T | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + userId);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveDraft<T>(userId: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + userId, JSON.stringify(value));
  } catch {
    // Sin almacenamiento disponible (modo privado): el formulario sigue funcionando.
  }
}

export function clearDraft(userId: string): void {
  try {
    window.localStorage.removeItem(PREFIX + userId);
  } catch {
    // Ignorado a propósito.
  }
}
