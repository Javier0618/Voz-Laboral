// Herramientas: cartas, calendario laboral, diagnóstico, quiz y glosario.
import { describe, expect, it } from 'vitest';
import { CARTAS, cartaComoTexto, fechaLarga, generarCarta, MOTIVOS_PETICION } from '../../src/lib/cartas';
import { calendarioLaboral, enlaceGoogleCalendar, generarIcs } from '../../src/lib/calendarioLaboral';
import { DIAGNOSTICO, resultadoDiagnostico } from '../../src/lib/diagnostico';
import { mensajeResultado, QUIZ } from '../../src/lib/quiz';
import { GLOSARIO, partesGlosario } from '../../src/lib/glosario';

/** Un hueco por llenar es «___» suelto; la línea de la firma es más larga. */
const HUECO = /(^|[^_])___(?!_)/m;

describe('cartas', () => {
  const base = { ciudad: 'Bogotá', fecha: '2026-11-03', nombre: 'Ana Pérez', documento: '52123456', empresa: 'Comercial XYZ S. A. S.', cargo: 'Cajera' };

  it('formatea la fecha en palabras y deja «___» si falta', () => {
    expect(fechaLarga('2026-11-03')).toBe('3 de noviembre de 2026');
    expect(fechaLarga('')).toBe('___');
  });

  it('el derecho de petición cita la Constitución, la Ley 1755 y el plazo de 15 días', () => {
    const c = generarCarta('derecho-de-peticion', { ...base, motivo: 'prima', periodo: 'segundo semestre de 2026', hechos: 'No me han pagado la prima.\nLa pedí verbalmente el 1 de noviembre.' });
    const t = cartaComoTexto(c);
    expect(t).toContain('Bogotá, 3 de noviembre de 2026');
    expect(t).toContain('artículo 23 de la Constitución Política');
    expect(t).toContain('artículo 306 del Código Sustantivo del Trabajo');
    expect(t).toContain('segundo semestre de 2026');
    expect(cartaComoTexto(generarCarta('derecho-de-peticion', { ...base, motivo: 'prima', periodo: 'el primer semestre de 2026', hechos: 'x' }))).toContain('correspondiente al primer semestre de 2026');
    expect(t).toContain('15 días');
    expect(t).toContain('2. No me han pagado la prima.');
    expect(t).toContain('3. La pedí verbalmente el 1 de noviembre.');
    expect(t).toContain('C. C. 52123456');
  });

  it('cada motivo de petición produce una petición sin huecos', () => {
    for (const m of MOTIVOS_PETICION.filter((x) => x.value !== 'otro')) {
      const c = generarCarta('derecho-de-peticion', { ...base, motivo: m.value, hechos: 'Hecho.' });
      expect(c.cuerpo.join(' '), m.value).not.toMatch(HUECO);
    }
  });

  it('todas las cartas se generan con solo los campos obligatorios llenos, sin huecos', () => {
    const llenos: Record<string, string> = { ...base, motivo: 'certificado', hechos: 'Hecho concreto.', ultimoDia: '2026-12-01', agradecimiento: 'si', periodo: '2025-2026', desde: '2026-12-14', hasta: '2027-01-05', administradora: 'Colpensiones', periodos: 'Empresa ABC, 2015 a 2016' };
    for (const carta of CARTAS) {
      for (const campo of carta.campos) if (!campo.optional) expect(llenos[campo.name], `${carta.slug}.${campo.name}`).toBeTruthy();
      const t = cartaComoTexto(generarCarta(carta.slug, llenos));
      expect(t, carta.slug).not.toMatch(HUECO);
      expect(t).toContain('Ana Pérez');
    }
  });

  it('la renuncia por justa causa cita los artículos 62, 64 y 66', () => {
    const t = cartaComoTexto(generarCarta('renuncia-por-justa-causa', { ...base, ultimoDia: '2026-11-10', hechos: 'Me pagan tarde.' }));
    expect(t).toMatch(/artículo 62, literal b\)/);
    expect(t).toContain('artículo 64');
    expect(t).toContain('artículo 66');
  });
});

describe('calendario laboral', () => {
  const c2027 = calendarioLaboral(2027);

  it('incluye los plazos de pago del año en orden', () => {
    const fechas = c2027.map((f) => f.fecha);
    expect(fechas).toEqual([...fechas].sort());
    for (const f of ['2027-01-31', '2027-02-14', '2027-04-30', '2027-06-30', '2027-08-31', '2027-12-20']) expect(fechas).toContain(f);
  });

  it('incluye los festivos y los cambios de norma de ese año', () => {
    expect(c2027.find((f) => f.fecha === '2027-01-11')?.tipo).toBe('festivo');
    expect(c2027.find((f) => f.fecha === '2027-04-01')?.tipo).toBe('cambio');
    expect(c2027.find((f) => f.fecha === '2027-07-01')?.titulo).toMatch(/100 %/);
    expect(calendarioLaboral(2028).some((f) => f.tipo === 'cambio')).toBe(false);
  });

  it('genera un .ics válido: eventos de día completo y líneas de máximo 75 octetos', () => {
    const ics = generarIcs(c2027, 'https://tuvozlaboral.com', new Date('2026-11-03T12:00:00Z'));
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(c2027.length);
    expect(ics).toContain('DTSTART;VALUE=DATE:20270214');
    expect(ics).toContain('DTEND;VALUE=DATE:20270215');
    for (const linea of ics.split('\r\n')) expect(new TextEncoder().encode(linea).length).toBeLessThanOrEqual(75);
    const uids = ics.match(/^UID:.*$/gm)!;
    expect(new Set(uids).size).toBe(uids.length);
  });

  it('arma el enlace de Google Calendar con la fecha de día completo', () => {
    const url = enlaceGoogleCalendar(c2027.find((f) => f.fecha === '2027-02-14')!, 'https://tuvozlaboral.com');
    expect(url).toContain('dates=20270214%2F20270215');
  });
});

describe('diagnóstico', () => {
  it('separa lo que está bien, lo que hay que revisar y las dudas', () => {
    const r = resultadoDiagnostico({ afiliacion: 'si', minimo: 'no', transporte: 'na', prima: 'nose' });
    expect(r.ok.map((p) => p.id)).toEqual(['afiliacion']);
    expect(r.revisar.map((p) => p.id)).toEqual(['minimo']);
    expect(r.dudas.map((p) => p.id)).toEqual(['prima']);
  });

  it('cada pregunta lleva al menos un enlace interno', () => {
    for (const p of DIAGNOSTICO) {
      expect(p.enlaces.length, p.id).toBeGreaterThan(0);
      for (const e of p.enlaces) expect(e.to).toMatch(/^\/(derechos|calculadoras|herramientas)\//);
    }
  });
});

describe('quiz', () => {
  it('tiene 10 afirmaciones, con mitos y realidades, y cada una cita su norma y su guía', () => {
    expect(QUIZ).toHaveLength(10);
    expect(QUIZ.some((q) => q.realidad)).toBe(true);
    expect(QUIZ.some((q) => !q.realidad)).toBe(true);
    for (const q of QUIZ) {
      expect(q.norma.length).toBeGreaterThan(5);
      expect(q.guia.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('el mensaje final nunca regaña', () => {
    expect(mensajeResultado(10, 10)).toMatch(/dedillo/);
    expect(mensajeResultado(0, 10)).toMatch(/Tranquilo/);
  });
});

describe('glosario', () => {
  it('marca solo la primera aparición de cada término y respeta los bordes de palabra', () => {
    const vistos = new Set<string>();
    const a = partesGlosario('Las cesantías y las cesantías otra vez; recargos.', vistos);
    expect(a.filter((p) => typeof p !== 'string')).toEqual([{ texto: 'cesantías', id: 'cesantias' }, { texto: 'recargos', id: 'recargo' }]);
    expect(partesGlosario('Más cesantías.', vistos).every((p) => typeof p === 'string')).toBe(true);
    expect(partesGlosario('Los aprendices desprendidos.', new Set()).every((p) => typeof p === 'string')).toBe(true);
  });

  it('prefiere la forma más larga', () => {
    const p = partesGlosario('Está en el régimen de prima media.', new Set());
    expect(p).toContainEqual({ texto: 'régimen de prima media', id: 'prima-media' });
  });

  it('reconstruye el texto original sin perder nada', () => {
    const texto = 'Tu IBL y tu historia laboral deciden la pensión; pide un derecho de petición.';
    const partes = partesGlosario(texto, new Set());
    expect(partes.map((p) => (typeof p === 'string' ? p : p.texto)).join('')).toBe(texto);
  });

  it('los identificadores no se repiten', () => {
    expect(new Set(GLOSARIO.map((t) => t.id)).size).toBe(GLOSARIO.length);
  });
});

describe('mapa del sitio', () => {
  it('incluye todas las herramientas y todas las cartas', async () => {
    const { readFileSync } = await import('node:fs');
    const { HERRAMIENTAS } = await import('../../src/lib/herramientas');
    const sitemap = readFileSync('scripts/generar-sitemap.mjs', 'utf8');
    for (const h of HERRAMIENTAS) expect(sitemap, h.path).toContain(`'${h.path}'`);
    for (const c of CARTAS) expect(sitemap, c.slug).toContain(`'/herramientas/cartas/${c.slug}'`);
  });
});
