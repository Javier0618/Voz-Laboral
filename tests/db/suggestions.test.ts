// Sugerencias editoriales (migración 2200): el redactor propone y redacta
// borradores; la administración decide. Nadie más las ve ni las toca.
import { beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, createUser, errorOf, type Db } from './harness';

let db: Db;
let admin: { id: string };
let redactor: { id: string };
let moderator: { id: string };
let user: { id: string };

const fuentes = JSON.stringify([{ label: 'Decreto 0991 de 2026', url: 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/decreto_0991_2026.htm' }]);

async function add(who: { id: string }, title: string, extra: { kind?: string; target?: string | null; sources?: string } = {}) {
  const { rows } = await as(db, who, () =>
    db.query<{ id: string }>(
      `select public.editorial_add_suggestion($1, $2, $3, 'Muchas preguntas en foros tras el decreto.', 'alta', 'formas-de-trabajar', array['repartidores', 'seguridad social'], $4::jsonb, $5) as id`,
      [extra.kind ?? 'nueva', title, 'El Decreto 0991 de 2026 cambió cómo cotizan los repartidores de plataformas.', extra.sources ?? fuentes, extra.target ?? null],
    ),
  );
  return rows[0].id;
}

const statusOf = async (id: string) =>
  (await db.query<{ status: string }>(`select status from public.guide_suggestions where id = $1`, [id])).rows[0].status;

beforeAll(async () => {
  db = await createDb();
  admin = await createUser(db, { alias: 'coordinacion_s', role: 'admin' });
  redactor = await createUser(db, { alias: 'redaccion_s', role: 'redactor' });
  moderator = await createUser(db, { alias: 'moderacion_s', role: 'moderator' });
  user = await createUser(db, { alias: 'lector_s' });
  await db.exec(`insert into public.legal_resources (slug, title, summary, content, status)
    values ('plataformas-digitales-de-reparto', 'Trabajo en plataformas digitales de reparto', 'Resumen de prueba suficientemente largo para la guía.', '${'Contenido de prueba de la guía de plataformas. '.repeat(3)}', 'borrador')`);
}, 60_000);

describe('sugerencias editoriales', () => {
  it('el redactor crea sugerencias y no se duplican por mayúsculas o tildes', async () => {
    const a = await add(redactor, 'Seguridad social de los repartidores');
    const b = await add(redactor, 'SEGURIDAD SOCIAL DE LOS REPARTÍDORES');
    expect(b).toBe(a);
    expect(await statusOf(a)).toBe('nueva');
  });

  it('solo el redactor y la administración crean o ven sugerencias', async () => {
    expect(await errorOf(add(user, 'Tema propuesto por un usuario'))).toMatch(/VL403/);
    expect(await errorOf(add(moderator, 'Tema propuesto por moderación'))).toMatch(/VL403/);
    expect(await errorOf(as(db, 'anon', () => db.query(`select * from public.guide_suggestions`)))).toMatch(/permission denied/);
    const vistas = await as(db, user, () => db.query(`select id from public.guide_suggestions`));
    expect(vistas.rows).toEqual([]);
    const admin_ve = await as(db, admin, () => db.query(`select id from public.guide_suggestions`));
    expect(admin_ve.rows.length).toBeGreaterThan(0);
    expect(await errorOf(as(db, redactor, () => db.query(`update public.guide_suggestions set status = 'pedida'`)))).toMatch(/permission denied/);
  });

  it('rechaza fuentes sin dirección http(s) y actualizaciones sin guía', async () => {
    expect(await errorOf(add(redactor, 'Fuente mala', { sources: JSON.stringify([{ label: 'Sin enlace', url: 'javascript:alert(1)' }]) }))).toMatch(/VL080/);
    expect(await errorOf(add(redactor, 'Actualizar sin guía', { kind: 'actualizar' }))).toMatch(/VL082/);
  });

  it('el redactor no puede pedir ni redactar lo que la administración no pidió', async () => {
    const id = await add(redactor, 'Licencia de luto para padres de crianza');
    expect(await errorOf(as(db, redactor, () => db.query(`select public.editorial_set_status($1, 'pedida')`, [id])))).toMatch(/VL403/);
    expect(await errorOf(as(db, redactor, () =>
      db.query(`select public.editorial_save_draft($1, 'licencia-de-luto', 'Licencia de luto: cuántos días', 'Resumen suficientemente largo de la guía.', $2, null, $3::jsonb)`,
        [id, 'Contenido de prueba. '.repeat(5), fuentes]))),
    ).toMatch(/VL085/);
  });

  it('pedida → borrador con fuentes, nunca publicado', async () => {
    const id = await add(redactor, 'Cotización de repartidores en 2026');
    await as(db, admin, () => db.query(`select public.editorial_set_status($1, 'pedida', 'Incluye un ejemplo con cifras.')`, [id]));
    const { rows } = await as(db, redactor, () =>
      db.query<{ r: string }>(`select public.editorial_save_draft($1, 'plataformas-digitales-de-reparto', 'Cuánto cotizan los repartidores de plataformas', 'Desde el Decreto 0991 de 2026 la plataforma paga una parte de la seguridad social.', $2, 'pago-salarios', $3::jsonb) as r`,
        [id, '## Qué dice la ley\nTexto de prueba de la guía redactada por el redactor.', fuentes]),
    );
    const guia = await db.query<{ slug: string; status: string; fuentes: number }>(
      `select r.slug, r.status, (select count(*)::int from public.legal_resource_sources s where s.resource_id = r.id) as fuentes from public.legal_resources r where r.id = $1`, [rows[0].r]);
    expect(guia.rows[0]).toEqual({ slug: 'plataformas-digitales-de-reparto-2', status: 'borrador', fuentes: 1 });
    const s = await db.query<{ status: string; instructions: string; draft_resource_id: string }>(`select status, instructions, draft_resource_id from public.guide_suggestions where id = $1`, [id]);
    expect(s.rows[0]).toEqual({ status: 'redactada', instructions: 'Incluye un ejemplo con cifras.', draft_resource_id: rows[0].r });
  });

  it('las transiciones no válidas se rechazan y se puede reabrir lo descartado', async () => {
    const id = await add(redactor, 'Prima de servicios en diciembre');
    expect(await errorOf(as(db, admin, () => db.query(`select public.editorial_set_status($1, 'redactada')`, [id])))).toMatch(/VL084/);
    await as(db, admin, () => db.query(`select public.editorial_set_status($1, 'descartada')`, [id]));
    expect(await statusOf(id)).toBe('descartada');
    await as(db, admin, () => db.query(`select public.editorial_set_status($1, 'nueva')`, [id]));
    expect(await statusOf(id)).toBe('nueva');
  });

  it('actualización: propuesta del redactor y la administración la aplica', async () => {
    const id = await add(redactor, 'Actualizar la guía de plataformas con el Decreto 0991', { kind: 'actualizar', target: 'plataformas-digitales-de-reparto' });
    await as(db, admin, () => db.query(`select public.editorial_set_status($1, 'pedida')`, [id]));
    const nuevo = '## Qué dice la ley\nTexto actualizado con el Decreto 0991 de 2026 y sus porcentajes de cotización.';
    await as(db, redactor, () => db.query(`select public.editorial_save_proposal($1, $2, 'Añade la cotización 60/40.')`, [id, nuevo]));
    expect(await errorOf(as(db, redactor, () => db.query(`select public.editorial_apply_proposal($1)`, [id])))).toMatch(/VL403/);
    await as(db, admin, () => db.query(`select public.editorial_apply_proposal($1)`, [id]));
    const { rows } = await db.query<{ content: string }>(`select content from public.legal_resources where slug = 'plataformas-digitales-de-reparto'`);
    expect(rows[0].content).toBe(nuevo);
  });

  it('el rol redactor se asigna con admin_set_role y no da acceso de moderación', async () => {
    const otro = await createUser(db, { alias: 'redaccion_dos' });
    await as(db, admin, () => db.query(`select public.admin_set_role($1, 'redactor', true)`, [otro.id]));
    const { rows } = await as(db, otro, () => db.query<{ m: boolean; r: boolean }>(`select private.is_moderator() as m, private.is_redactor() as r`));
    expect(rows[0]).toEqual({ m: false, r: true });
    expect(await errorOf(as(db, otro, () => db.query(`select * from public.moderation_queue()`)))).toMatch(/VL403|permission|42501/);
  });

  it('el borrador guarda el tema de la sugerencia', async () => {
    const id = await add(redactor, 'Cómo preparar una entrevista de trabajo');
    await db.query(`update public.guide_suggestions set topic = 'empleo' where id = $1`, [id]);
    await as(db, admin, () => db.query(`select public.editorial_set_status($1, 'pedida')`, [id]));
    const { rows } = await as(db, redactor, () =>
      db.query<{ r: string }>(`select public.editorial_save_draft($1, 'entrevista-de-trabajo', 'Cómo preparar una entrevista de trabajo', 'Consejos prácticos para preparar una entrevista de trabajo en Colombia.', $2, null, $3::jsonb) as r`,
        [id, '## Antes de la entrevista\nTexto de prueba suficientemente largo para la guía.', fuentes]),
    );
    const { rows: g } = await db.query<{ topic: string }>(`select topic from public.legal_resources where id = $1`, [rows[0].r]);
    expect(g[0].topic).toBe('empleo');
  });

  it('solo la administración borra sugerencias, y solo descartadas o existentes', async () => {
    const id = await add(redactor, 'Tema que se va a borrar del panel');
    expect(await errorOf(as(db, admin, () => db.query(`select public.editorial_delete_suggestion($1)`, [id])))).toMatch(/VL089/);
    await as(db, admin, () => db.query(`select public.editorial_set_status($1, 'descartada')`, [id]));
    expect(await errorOf(as(db, redactor, () => db.query(`select public.editorial_delete_suggestion($1)`, [id])))).toMatch(/VL403/);
    await as(db, admin, () => db.query(`select public.editorial_delete_suggestion($1)`, [id]));
    const { rows } = await db.query(`select id from public.guide_suggestions where id = $1`, [id]);
    expect(rows).toEqual([]);
  });

  it('el tema de una guía solo admite un slug', async () => {
    expect(await errorOf(db.query(`update public.legal_resources set topic = 'Tema Inválido' where slug = 'plataformas-digitales-de-reparto'`))).toMatch(/topic_slug/);
  });
});
