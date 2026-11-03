// Migración 2600: el redactor solo sube imágenes nuevas a la carpeta de una
// guía, con nombre «redaccion-<uuid>». Se simula storage.objects, que PGlite
// no trae, y se vuelve a aplicar la migración para crear la política.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, createUser, type Db } from './harness';

let db: Db;
let redactor: { id: string };
let persona: { id: string };
const UUID = '0b5c7a3e-8f4d-4c2a-9e1b-2d3f4a5b6c7d';

beforeAll(async () => {
  db = await createDb();
  redactor = await createUser(db, { alias: 'redaccion_img', role: 'redactor' });
  persona = await createUser(db, { alias: 'persona_img' });
  await db.exec(`
    create schema storage;
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text not null, name text not null);
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated;
    grant select, insert, update, delete on storage.objects to authenticated;
  `);
  const sql = readFileSync(join(process.cwd(), 'supabase', 'migrations', '20261103002600_redactor_guide_images.sql'), 'utf8');
  await db.exec(sql);
  await db.exec(sql);
}, 60_000);

const subir = (who: { id: string }, name: string, bucket = 'guias') =>
  as(db, who, () => db.query(`insert into storage.objects (bucket_id, name) values ($1, $2)`, [bucket, name]));

describe('imágenes del redactor', () => {
  it('el redactor sube a la carpeta de la guía con el nombre acordado', async () => {
    await expect(subir(redactor, `pension-de-vejez-requisitos/redaccion-${UUID}.jpg`)).resolves.toBeDefined();
  });

  it('rechaza otras rutas, otros nombres y otros buckets', async () => {
    for (const name of [`redaccion-${UUID}.jpg`, `pension-de-vejez/portada-${UUID}.jpg`, `../x/redaccion-${UUID}.jpg`, `a/b/redaccion-${UUID}.jpg`, `pension/redaccion-${UUID}.gif`])
      await expect(subir(redactor, name), name).rejects.toThrow();
    await expect(subir(redactor, `pension/redaccion-${UUID}.jpg`, 'otro')).rejects.toThrow();
  });

  it('una persona sin el rol de redactor no puede subir', async () => {
    await expect(subir(persona, `pension/redaccion-${UUID}.jpg`)).rejects.toThrow();
  });

  it('el redactor no puede borrar ni reemplazar', async () => {
    await as(db, redactor, async () => {
      const del = await db.query(`delete from storage.objects returning id`);
      expect(del.rows).toEqual([]);
      const upd = await db.query(`update storage.objects set name = 'x/redaccion-${UUID}.png' returning id`);
      expect(upd.rows).toEqual([]);
    });
  });
});
