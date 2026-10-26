import { describe, expect, it } from 'vitest';
import { aliasSchema, detectPersonalData, experienceSchema } from '../../src/lib/schemas';
import { toAppError } from '../../src/lib/errors';

const body = 'Relato de prueba con suficiente longitud para cumplir el mínimo exigido. '.repeat(4);
const base = {
  companyId: '7b0f8a3e-2c2f-4f43-9a55-0c6a1d1e5b10',
  tone: 'mixta',
  category: 'pago-salarios',
  periodStart: '2024-03',
  periodEnd: '',
  relationship: 'anterior',
  title: '',
  body,
  hasDocuments: false,
  rulesAccepted: true,
};

describe('detección de datos personales', () => {
  it('detecta correos, teléfonos colombianos y números de documento', () => {
    expect(detectPersonalData('escribe a jefe@empresa.co')).toContain('correo');
    expect(detectPersonalData('llama al 310 555 1234')).toContain('telefono');
    expect(detectPersonalData('cédula 1.023.456.789')).toContain('documento');
    expect(detectPersonalData('un documento de uso interno')).toContain('confidencial');
  });

  it('no marca un relato normal', () => {
    expect(detectPersonalData('En 2023 trabajé 12 horas diarias durante 3 meses.')).toEqual([]);
  });
});

describe('alias', () => {
  it('acepta alias válidos', () => {
    expect(aliasSchema.safeParse('turno_de_noche').success).toBe(true);
  });
  it('rechaza alias que suplantan cuentas oficiales o con formato inválido', () => {
    expect(aliasSchema.safeParse('Moderador.Oficial').success).toBe(false);
    expect(aliasSchema.safeParse('MinTrabajo').success).toBe(false);
    expect(aliasSchema.safeParse('ab').success).toBe(false);
    expect(aliasSchema.safeParse('correo@dominio').success).toBe(false);
  });
});

describe('formulario de experiencia', () => {
  it('acepta una experiencia completa', () => {
    expect(experienceSchema.safeParse(base).success).toBe(true);
  });
  it('exige aceptar las reglas y un relato mínimo', () => {
    const r = experienceSchema.safeParse({ ...base, rulesAccepted: false, body: 'corto' });
    expect(r.success).toBe(false);
    const paths = r.success ? [] : r.error.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(['rulesAccepted', 'body']));
  });
  it('rechaza periodos futuros o invertidos', () => {
    expect(experienceSchema.safeParse({ ...base, periodStart: '2999-01' }).success).toBe(false);
    expect(experienceSchema.safeParse({ ...base, periodStart: '2024-05', periodEnd: '2024-01' }).success).toBe(false);
  });
});

describe('mensajes de error', () => {
  it('muestra el texto de negocio sin el código interno', () => {
    expect(toAppError({ message: 'VL033: Puedes enviar hasta 3 experiencias cada 24 horas.' }).message).toBe('Puedes enviar hasta 3 experiencias cada 24 horas.');
  });
  it('no filtra detalles internos de la base de datos', () => {
    const e = toAppError({ message: 'permission denied for table experiences', code: '42501' });
    expect(e.kind).toBe('permission');
    expect(e.message).not.toMatch(/experiences|table/);
    const unknown = toAppError({ message: 'syntax error at or near "select" in public.secret_function' });
    expect(unknown.message).not.toMatch(/secret|select/);
  });
});
