// Herramienta del redactor: conecta con Supabase con la cuenta «redactor» y
// gestiona las sugerencias editoriales (ver docs/sugerencias.md).
//
// Variables (del sistema o de los archivos .env, como Vite):
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY  proyecto de Supabase
//   REDACTOR_EMAIL, REDACTOR_PASSWORD          cuenta con el rol «redactor»
//
// Comandos:
//   node scripts/editorial.mjs guias                     guías existentes (también borradores)
//   node scripts/editorial.mjs guia <slug>               texto de una guía
//   node scripts/editorial.mjs sugerencias [estado]      sugerencias (todas o de un estado)
//   node scripts/editorial.mjs sugerir <archivo.json>    crea sugerencias (lista de objetos)
//   node scripts/editorial.mjs pedidas                   sugerencias pedidas, con indicaciones
//   node scripts/editorial.mjs borrador <id> <archivo.json>       guarda la guía redactada
//   node scripts/editorial.mjs propuesta <id> <archivo.md> "<qué cambia>" [legal|informativa]
//   node scripts/editorial.mjs revisar <archivo.json | archivo.md> [legal|informativa]   revisa calidad y SEO (no se conecta)
//
// «borrador» y «propuesta» ejecutan la misma revisión y no guardan nada si hay
// errores. Los criterios están en CLAUDE.md («Estándar de calidad de las guías»).
//
// Formato de «sugerir» (cada elemento):
//   { "kind": "nueva" | "actualizar", "title": "...", "reason": "...", "demand": "...",
//     "priority": "alta" | "media" | "baja", "topic": "reformas", "keywords": ["..."],
//     "sources": [{ "label": "...", "url": "https://..." }], "target": "slug-si-es-actualizar" }
// Formato de «borrador»:
//   { "tipo": "legal" | "informativa", "topic": "empleo" (tema del índice, opcional),
//     "slug": "...", "title": "...", "summary": "...", "category": "pago-salarios" | null,
//     "content": "texto" o "content_file": "ruta/al/archivo.md",
//     "sources": [{ "label": "...", "publisher": "...", "url": "https://...", "accessed_at": "2026-11-02" }] }
import { existsSync, readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { imprimirRevision, leerGuia, revisarGuia } from './revisar-guia.mjs';

for (const nombre of ['.env.local', '.env']) {
  const ruta = new URL(`../${nombre}`, import.meta.url);
  if (!existsSync(ruta)) continue;
  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(linea);
    if (!m || linea.trim().startsWith('#')) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

if (process.argv[2] === 'revisar') {
  const g = leerGuia(process.argv[3], process.argv[4]);
  process.exit(imprimirRevision(revisarGuia(g, { propuesta: g.propuesta })) ? 0 : 1);
}

const falta = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'REDACTOR_EMAIL', 'REDACTOR_PASSWORD'].filter((v) => !process.env[v]);
if (falta.length) {
  console.error(`Faltan variables: ${falta.join(', ')}. Ver docs/sugerencias.md.`);
  process.exit(1);
}

const supabase = createClient(process.env.VITE_SUPABASE_URL.replace(/\/$/, ''), process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function fallar(error) {
  console.error(error?.message ?? String(error));
  process.exit(1);
}
const leerJson = (ruta) => JSON.parse(readFileSync(ruta, 'utf8'));

const { error: errorAcceso } = await supabase.auth.signInWithPassword({
  email: process.env.REDACTOR_EMAIL, password: process.env.REDACTOR_PASSWORD,
});
if (errorAcceso) fallar(`No se pudo iniciar sesión como redactor: ${errorAcceso.message}`);

const [comando, ...args] = process.argv.slice(2);

switch (comando) {
  case 'guias': {
    const { data, error } = await supabase.rpc('editorial_existing_guides');
    if (error) fallar(error);
    for (const g of data) console.log(`${g.status.padEnd(22)} ${g.slug}  —  ${g.title}${g.last_verified_at ? `  (verificada ${g.last_verified_at})` : ''}`);
    console.log(`\n${data.length} guías`);
    break;
  }
  case 'guia': {
    const { data, error } = await supabase.rpc('editorial_guide_content', { p_slug: args[0] });
    if (error) fallar(error);
    if (!data.length) fallar(`No existe la guía «${args[0]}».`);
    console.log(`# ${data[0].title}\n\n${data[0].summary}\n\n${data[0].content}`);
    break;
  }
  case 'sugerencias':
  case 'pedidas': {
    let query = supabase.from('guide_suggestions')
      .select('id, kind, status, priority, title, instructions, created_at, requested_at, target:legal_resources!guide_suggestions_target_resource_id_fkey(slug)')
      .order('created_at', { ascending: false });
    const estado = comando === 'pedidas' ? 'pedida' : args[0];
    if (estado) query = query.eq('status', estado);
    const { data, error } = await query;
    if (error) fallar(error);
    console.log(JSON.stringify(data, null, 2));
    break;
  }
  case 'sugerir': {
    const lista = leerJson(args[0]);
    for (const s of Array.isArray(lista) ? lista : [lista]) {
      const { data, error } = await supabase.rpc('editorial_add_suggestion', {
        p_kind: s.kind ?? 'nueva', p_title: s.title, p_reason: s.reason, p_demand: s.demand ?? '', p_priority: s.priority ?? 'media',
        p_topic: s.topic ?? '', p_keywords: s.keywords ?? [], p_sources: s.sources ?? [], p_target_slug: s.target ?? null,
      });
      if (error) console.error(`✗ ${s.title}: ${error.message}`);
      else console.log(`✓ ${s.title}  (${data})`);
    }
    break;
  }
  case 'borrador': {
    const [id, ruta] = args;
    const g = leerGuia(ruta);
    const content = g.content;
    if (!imprimirRevision(revisarGuia(g))) fallar('No se guardó: corrige los errores de la revisión.');
    const { data, error } = await supabase.rpc('editorial_save_draft', {
      p_id: id, p_slug: g.slug, p_title: g.title, p_summary: g.summary, p_content: content,
      p_category_slug: g.category ?? null, p_sources: g.sources, p_topic: g.topic ?? null,
    });
    if (error) fallar(error);
    console.log(`Borrador guardado: ${data}`);
    break;
  }
  case 'propuesta': {
    const [id, ruta, notas = '', tipo = 'legal'] = args;
    const texto = readFileSync(ruta, 'utf8');
    if (!imprimirRevision(revisarGuia({ content: texto, tipo }, { propuesta: true }))) fallar('No se guardó: corrige los errores de la revisión.');
    const { error } = await supabase.rpc('editorial_save_proposal', { p_id: id, p_content: texto, p_notes: notas });
    if (error) fallar(error);
    console.log('Propuesta guardada.');
    break;
  }
  default:
    console.error('Comandos: guias | guia <slug> | sugerencias [estado] | sugerir <json> | pedidas | borrador <id> <json> | propuesta <id> <md> "<notas>" | revisar <json|md>');
    process.exit(1);
}
await supabase.auth.signOut();
