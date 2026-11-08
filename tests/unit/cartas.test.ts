import { describe, expect, it } from 'vitest';
import { CARTAS, cartaComoTexto, fechaLarga, generarCarta } from '../../src/lib/cartas';

const datos = {
  ciudad: 'Palmira',
  fecha: '2026-11-08',
  nombre: 'Persona de prueba',
  documento: '123456',
  empresa: 'Empresa de ejemplo',
  cargo: 'Auxiliar',
  ultimoDia: '2026-11-30',
  periodo: '2026',
  desde: '2026-12-01',
  hasta: '2026-12-22',
  motivo: 'documentos',
  hechos: 'Necesito copias de las planillas.',
  periodos: 'Enero de 2021 a marzo de 2021',
  administradora: 'Colpensiones',
};

describe('Cartas laborales: contenido orientativo y consistencia', () => {
  it('ofrece cinco modelos con textos independientes', () => {
    expect(CARTAS.map((c) => c.slug)).toEqual([
      'derecho-de-peticion', 'carta-de-renuncia', 'renuncia-por-justa-causa',
      'solicitud-de-vacaciones', 'correccion-historia-laboral',
    ]);
    for (const carta of CARTAS) {
      const texto = cartaComoTexto(generarCarta(carta.slug, datos));
      expect(texto).toContain('Persona de prueba');
      expect(texto).toContain('8 de noviembre de 2026');
      expect(texto).toContain('Asunto:');
      expect(texto).toContain('C. C. 123456');
      expect(texto).not.toContain('undefined');
    }
  });

  it('distingue el plazo general del plazo de documentos en el derecho de petición', () => {
    const texto = cartaComoTexto(generarCarta('derecho-de-peticion', datos));
    expect(texto).toContain('15 días hábiles');
    expect(texto).toContain('10 días hábiles');
    expect(texto).toContain('derechos laborales debidamente identificados');
  });

  it('no promete reconocimiento automático de indemnización por justa causa', () => {
    const texto = cartaComoTexto(generarCarta('renuncia-por-justa-causa', {
      ...datos, hechos: 'Incumplimiento específico documentado.',
    }));
    expect(texto).toContain('en caso de acreditarse la justa causa');
  });

  it('rechaza fechas calendario imposibles y conserva las fechas válidas', () => {
    expect(fechaLarga('2026-02-30')).toBe('___');
    expect(fechaLarga('2026-13-01')).toBe('___');
    expect(fechaLarga('2024-02-29')).toBe('29 de febrero de 2024');
  });
});
