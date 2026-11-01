import { describe, expect, it } from 'vitest';
import { necesitaRevision } from '../../src/lib/guide';

describe('necesitaRevision (Fase 3.3)', () => {
  it('pide revisar una guía publicada verificada hace 6 meses o más', () => {
    expect(necesitaRevision('publicado', '2026-05-01', '2026-11-01')).toBe(true);
    expect(necesitaRevision('publicado', '2026-05-02', '2026-11-01')).toBe(false);
    expect(necesitaRevision('publicado', '2025-12-15', '2026-11-01')).toBe(true);
  });
  it('una publicada sin fecha también se revisa', () => {
    expect(necesitaRevision('publicado', null, '2026-11-01')).toBe(true);
  });
  it('no avisa de borradores, pendientes ni archivadas', () => {
    expect(necesitaRevision('borrador', '2020-01-01', '2026-11-01')).toBe(false);
    expect(necesitaRevision('pendiente_verificacion', null, '2026-11-01')).toBe(false);
    expect(necesitaRevision('archivado', '2020-01-01', '2026-11-01')).toBe(false);
  });
});
