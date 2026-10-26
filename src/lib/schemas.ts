// Esquemas de validación compartidos. Los mismos límites están impuestos en la
// base de datos (CHECK y triggers): el cliente solo los anticipa para dar
// mensajes claros, nunca es la única barrera.
import { z } from 'zod';

export const BODY_MIN = 200;
export const BODY_MAX = 5000;

export const RESERVED_ALIAS_WORDS = [
  'admin', 'administrador', 'moderador', 'moderator', 'vozlaboral', 'soporte', 'support',
  'oficial', 'ministerio', 'mintrabajo', 'gobierno', 'staff', 'root', 'sistema', 'equipo',
];

export function normalizeText(t: string): string {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export const aliasSchema = z
  .string()
  .trim()
  .regex(/^[\p{L}\p{N}_.-]{3,24}$/u, 'Usa entre 3 y 24 caracteres: letras, números, punto, guion o guion bajo.')
  .refine((v) => !RESERVED_ALIAS_WORDS.some((w) => normalizeText(v).replace(/ /g, '').includes(w)), {
    message: 'Ese alias puede confundirse con una cuenta oficial. Elige otro.',
  });

export const passwordSchema = z
  .string()
  .min(10, 'Usa al menos 10 caracteres.')
  .max(72, 'Usa como máximo 72 caracteres.')
  .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), 'Combina letras y números.');

export const emailSchema = z.string().trim().email('Escribe un correo válido, por ejemplo nombre@dominio.com.');

const monthString = z.string().regex(/^\d{4}-\d{2}$/, 'Elige el mes y el año.');

export const experienceSchema = z
  .object({
    companyId: z.string().uuid('Elige la empresa del catálogo.'),
    tone: z.enum(['positiva', 'negativa', 'mixta'], { errorMap: () => ({ message: 'Indica si tu experiencia fue buena, mala o mixta.' }) }),
    category: z.string().min(1, 'Elige la categoría que mejor describe la situación.'),
    periodStart: monthString,
    periodEnd: z.union([monthString, z.literal('')]),
    relationship: z.enum(['actual', 'anterior', 'prefiero_no_decir'], { errorMap: () => ({ message: 'Indica tu relación con la empresa.' }) }),
    title: z.union([z.string().trim().min(5, 'El título debe tener al menos 5 caracteres.').max(120, 'El título admite hasta 120 caracteres.'), z.literal('')]),
    body: z
      .string()
      .trim()
      .min(BODY_MIN, `Cuenta tu experiencia con al menos ${BODY_MIN} caracteres.`)
      .max(BODY_MAX, `El relato admite hasta ${BODY_MAX} caracteres.`),
    hasDocuments: z.boolean(),
    rulesAccepted: z.literal(true, { errorMap: () => ({ message: 'Confirma que leíste las reglas de publicación.' }) }),
  })
  .superRefine((v, ctx) => {
    const now = new Date();
    const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (v.periodStart > current) ctx.addIssue({ code: 'custom', path: ['periodStart'], message: 'El periodo no puede estar en el futuro.' });
    if (v.periodStart < '1990-01') ctx.addIssue({ code: 'custom', path: ['periodStart'], message: 'Elige un periodo desde 1990.' });
    if (v.periodEnd && v.periodEnd < v.periodStart) ctx.addIssue({ code: 'custom', path: ['periodEnd'], message: 'El fin no puede ser anterior al inicio.' });
    if (v.periodEnd && v.periodEnd > current) ctx.addIssue({ code: 'custom', path: ['periodEnd'], message: 'El periodo no puede estar en el futuro.' });
  });

export type ExperienceInput = z.infer<typeof experienceSchema>;

export const COMMENT_MAX = 1000;
export const commentSchema = z
  .string()
  .trim()
  .min(2, 'Escribe tu comentario.')
  .max(COMMENT_MAX, `El comentario admite hasta ${COMMENT_MAX} caracteres.`);

export const claimSchema = z.object({
  claimantName: z.string().trim().min(3, 'Escribe tu nombre.').max(120),
  claimantRole: z.string().trim().min(2, 'Indica tu cargo o relación con la empresa.').max(120),
  contactEmail: emailSchema,
  claimType: z.enum(['error_verificable', 'datos_privados', 'desacuerdo_opinion', 'datos_empresa', 'otro'], {
    errorMap: () => ({ message: 'Elige el tipo de solicitud.' }),
  }),
  requestedAction: z.enum(['correccion', 'revision', 'retiro_datos_privados', 'respuesta_publica'], {
    errorMap: () => ({ message: 'Elige qué solicitas.' }),
  }),
  description: z.string().trim().min(50, 'Explica la solicitud con al menos 50 caracteres.').max(4000, 'Admite hasta 4000 caracteres.'),
});

export const reportSchema = z.object({
  reason: z.enum(['datos_personales', 'amenaza', 'falso_o_enganoso', 'contenido_confidencial', 'spam', 'otro'], {
    errorMap: () => ({ message: 'Elige el motivo del reporte.' }),
  }),
  details: z.string().trim().max(1000, 'Admite hasta 1000 caracteres.'),
});

export type PersonalDataFlag = 'correo' | 'telefono' | 'documento' | 'confidencial';

export const personalDataMessages: Record<PersonalDataFlag, string> = {
  correo: 'Parece que incluiste un correo electrónico.',
  telefono: 'Parece que incluiste un número de teléfono.',
  documento: 'Parece que incluiste un número de documento o de identificación.',
  confidencial: 'Mencionas información confidencial o de uso interno.',
};

/** Mismas reglas que private.detect_personal_data() en la base de datos. */
export function detectPersonalData(text: string): PersonalDataFlag[] {
  const flags: PersonalDataFlag[] = [];
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) flags.push('correo');
  if (/(\+?57[ -]?)?3\d{2}[ -]?\d{3}[ -]?\d{4}/.test(text)) flags.push('telefono');
  if (/\d{1,3}\.\d{3}\.\d{3}/.test(text) || /(^|\D)\d{8,10}(\D|$)/.test(text)) flags.push('documento');
  if (/(confidencial|reservado|uso interno)/i.test(text)) flags.push('confidencial');
  return flags;
}

/** Errores de zod como { campo: mensaje } para mostrarlos junto a cada campo. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
