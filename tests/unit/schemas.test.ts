import { describe, expect, it } from 'vitest';
import { aliasResemblesEmail, aliasSchema, experienceSchema, signUpSchema } from '../../src/shared/schemas';

const base = {
  companyId: '0b8f6a2e-1c3d-4e5f-8a9b-0c1d2e3f4a5b',
  categoryId: 1,
  periodStart: '2024-01',
  periodEnd: '',
  relationship: 'anterior',
  title: '',
  accountDirect: 'a'.repeat(200),
  accountThirdParty: '',
  hasDocuments: false,
  acceptRules: true,
};

describe('alias', () => {
  it('acepta alias válidos', () => {
    expect(aliasSchema.safeParse('Operaria_Norte').success).toBe(true);
  });
  it('rechaza palabras reservadas sin importar mayúsculas o tildes', () => {
    expect(aliasSchema.safeParse('ModeradOR1').success).toBe(false);
    expect(aliasSchema.safeParse('Voz-Laboral').success).toBe(false);
  });
  it('rechaza alias parecidos al correo', () => {
    expect(aliasResemblesEmail('Ana_Torres', 'anatorres@example.test')).toBe(true);
    expect(aliasResemblesEmail('Operaria_Norte', 'anatorres@example.test')).toBe(false);
    const r = signUpSchema.safeParse({ email: 'anatorres@example.test', password: 'x'.repeat(10), alias: 'anatorres', acceptPolicy: true });
    expect(r.success).toBe(false);
  });
});

describe('experiencia', () => {
  it('acepta un relato de 200 caracteres', () => {
    expect(experienceSchema.safeParse(base).success).toBe(true);
  });
  it('suma el relato directo y el de terceros para el límite', () => {
    expect(experienceSchema.safeParse({ ...base, accountDirect: 'a'.repeat(150), accountThirdParty: 'b'.repeat(50) }).success).toBe(true);
    expect(experienceSchema.safeParse({ ...base, accountDirect: 'a'.repeat(199) }).success).toBe(false);
    expect(experienceSchema.safeParse({ ...base, accountDirect: 'a'.repeat(5001) }).success).toBe(false);
  });
  it('exige aceptar las reglas y un periodo coherente', () => {
    expect(experienceSchema.safeParse({ ...base, acceptRules: false }).success).toBe(false);
    expect(experienceSchema.safeParse({ ...base, periodEnd: '2023-12' }).success).toBe(false);
    expect(experienceSchema.safeParse({ ...base, periodStart: '2999-01' }).success).toBe(false);
  });
});
