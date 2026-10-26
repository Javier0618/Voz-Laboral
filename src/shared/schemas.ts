import { z } from 'zod';
import { MAX_ACCOUNT, MIN_ACCOUNT, relationships, reportReasons } from './domain';

// Reflejan las reglas de la base de datos para dar errores claros antes de
// enviar. La base de datos sigue siendo la que impone las reglas.

const RESERVED = [
  'admin', 'administrador', 'administracion', 'moderador', 'moderadora', 'moderator',
  'moderacion', 'vozlaboral', 'soporte', 'support', 'staff', 'oficial', 'official',
  'root', 'sistema', 'system', 'equipo', 'superuser',
];

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[_-]/g, '');

export function aliasResemblesEmail(alias: string, email: string): boolean {
  const a = normalize(alias).replace(/[^a-z0-9]/g, '');
  const local = normalize(email.split('@')[0] ?? '').replace(/[^a-z0-9]/g, '');
  if (alias.includes('@')) return true;
  if (!local) return false;
  return a === local || (local.length >= 4 && a.includes(local)) || (a.length >= 4 && local.includes(a));
}

export const aliasSchema = z
  .string()
  .trim()
  .min(3, 'El alias debe tener al menos 3 caracteres')
  .max(30, 'El alias puede tener hasta 30 caracteres')
  .regex(/^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ_-]+$/, 'Usa solo letras, números, guion o guion bajo')
  .refine((v) => !RESERVED.some((w) => normalize(v).includes(w)), 'El alias contiene una palabra reservada');

export const emailSchema = z.string().trim().email('Escribe un correo válido');
export const passwordSchema = z
  .string()
  .min(10, 'La contraseña debe tener al menos 10 caracteres')
  .max(72, 'La contraseña puede tener hasta 72 caracteres');

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    alias: aliasSchema,
    acceptPolicy: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar la política de datos' }) }),
  })
  .superRefine((v, ctx) => {
    if (aliasResemblesEmail(v.alias, v.email)) {
      ctx.addIssue({ code: 'custom', path: ['alias'], message: 'El alias no puede parecerse a tu correo' });
    }
  });

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Elige mes y año');

export const experienceSchema = z
  .object({
    companyId: z.string().uuid('Elige una empresa'),
    categoryId: z.coerce.number().int().min(1, 'Elige una categoría').max(10, 'Elige una categoría'),
    periodStart: monthSchema,
    periodEnd: z.union([monthSchema, z.literal('')]),
    relationship: z.enum(relationships, { errorMap: () => ({ message: 'Elige tu relación con la empresa' }) }),
    title: z.string().trim().max(120, 'El título puede tener hasta 120 caracteres'),
    accountDirect: z.string(),
    accountThirdParty: z.string(),
    hasDocuments: z.boolean(),
    acceptRules: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar las reglas de publicación' }) }),
  })
  .superRefine((v, ctx) => {
    const total = v.accountDirect.length + v.accountThirdParty.length;
    if (total < MIN_ACCOUNT) {
      ctx.addIssue({
        code: 'custom',
        path: ['accountDirect'],
        message: `El relato debe tener al menos ${MIN_ACCOUNT} caracteres en total (llevas ${total})`,
      });
    }
    if (total > MAX_ACCOUNT) {
      ctx.addIssue({
        code: 'custom',
        path: ['accountDirect'],
        message: `El relato puede tener hasta ${MAX_ACCOUNT} caracteres en total (llevas ${total})`,
      });
    }
    if (v.title.length > 0 && v.title.length < 3) {
      ctx.addIssue({ code: 'custom', path: ['title'], message: 'El título debe tener al menos 3 caracteres' });
    }
    if (v.periodEnd && v.periodEnd < v.periodStart) {
      ctx.addIssue({ code: 'custom', path: ['periodEnd'], message: 'El final no puede ser anterior al inicio' });
    }
    const now = new Date();
    const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (v.periodStart > current) {
      ctx.addIssue({ code: 'custom', path: ['periodStart'], message: 'El periodo no puede estar en el futuro' });
    }
    if (v.periodStart < '1990-01') {
      ctx.addIssue({ code: 'custom', path: ['periodStart'], message: 'El periodo debe ser desde 1990' });
    }
  });

export type ExperienceInput = z.infer<typeof experienceSchema>;

export const reportSchema = z.object({
  reason: z.enum(reportReasons, { errorMap: () => ({ message: 'Elige un motivo' }) }),
  details: z.string().trim().max(2000, 'Hasta 2000 caracteres'),
});

export const appealSchema = z.object({
  reason: z.string().trim().min(20, 'Explica tu apelación en al menos 20 caracteres').max(2000, 'Hasta 2000 caracteres'),
});

export const claimSchema = z.object({
  claimType: z.enum(['representacion', 'correccion']),
  claimantName: z.string().trim().min(3, 'Escribe tu nombre').max(120),
  claimantPosition: z.string().trim().min(2, 'Escribe tu cargo').max(120),
  contactEmail: emailSchema,
  message: z.string().trim().min(20, 'Escribe al menos 20 caracteres').max(3000, 'Hasta 3000 caracteres'),
});

export const companyProposalSchema = z.object({
  name: z.string().trim().min(2, 'Escribe el nombre de la empresa').max(160),
  city: z.string().trim().max(80),
  sector: z.string().trim().max(80),
});

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
