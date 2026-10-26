// Avisos (no bloqueos) cuando el relato parece contener datos personales.
export type SensitiveKind = 'email' | 'telefono' | 'cedula';

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]{2,}/;
// Celulares colombianos (3xx xxx xxxx) y fijos con indicativo, con o sin +57.
const PHONE = /(?:\+?57[\s.-]?)?(?:3\d{2}|60\d)[\s.-]?\d{3}[\s.-]?\d{4}\b/;
// Cédula: la palabra o abreviatura seguida de un número, o 6 a 10 dígitos
// con separadores de miles típicos (1.234.567.890).
const CEDULA = /\b(?:c[ée]dula|c\.?\s?c\.?|cc)\s*(?:n[o°º.]*\s*)?:?\s*\d[\d.\s]{5,13}\d\b|\b\d{1,3}(?:\.\d{3}){2,3}\b/i;

export function detectSensitiveData(text: string): SensitiveKind[] {
  const found: SensitiveKind[] = [];
  if (EMAIL.test(text)) found.push('email');
  if (PHONE.test(text)) found.push('telefono');
  if (CEDULA.test(text)) found.push('cedula');
  return found;
}

export const sensitiveLabels: Record<SensitiveKind, string> = {
  email: 'un correo electrónico',
  telefono: 'un número de teléfono',
  cedula: 'un número de cédula',
};
