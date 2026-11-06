// Operaciones del panel de moderación. La autorización real está en la base
// de datos: estas funciones fallan con "permiso" si la cuenta no tiene rol.
import { AppError, requireClient } from './supabase';
import { toAppError } from './errors';
import type { ExperienceStatus } from './api';
import { todayLocal } from './format';

async function run<T>(promise: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  let result: { data: T | null; error: unknown };
  try {
    result = await promise;
  } catch (error) {
    throw toAppError(error);
  }
  if (result.error) throw toAppError(result.error);
  return result.data as T;
}

export interface QueueItem {
  id: string; company_id: string; company_name: string; category_slug: string; title: string | null; body: string;
  period_start: string; period_end: string | null; relationship: string; has_documents: boolean; status: ExperienceStatus;
  status_reason: string | null; auto_flags: string[]; author_alias: string; author_id: string | null; open_reports: number; created_at: string;
  tone: 'positiva' | 'negativa' | 'mixta'; submitted_without_account: boolean;
}

export function moderationQueue(status: ExperienceStatus | null, page = 1) {
  return run<QueueItem[]>(requireClient().rpc('moderation_queue', { p_status: status, p_limit: 50, p_offset: (page - 1) * 50 }));
}

export function moderateExperience(id: string, status: ExperienceStatus, publicReason: string, internalNote: string) {
  return run(
    requireClient().rpc('moderate_experience', {
      p_experience_id: id, p_new_status: status, p_public_reason: publicReason, p_internal_note: internalNote || null,
    }),
  );
}

export function setSuspension(userId: string, suspend: boolean, reason: string) {
  return run(requireClient().rpc('set_account_suspension', { p_user_id: userId, p_suspend: suspend, p_reason: reason }));
}

export interface CommentModerationRow {
  id: string; experience_id: string; experience_title: string; company_name: string; body: string; status: string;
  auto_flags: string[]; author_alias: string; open_reports: number; created_at: string;
}
export function listCommentsForModeration(filter: 'retenido' | 'reportados' | 'ocultos') {
  return run<CommentModerationRow[]>(requireClient().rpc('moderation_comments', { p_filter: filter }));
}
export function moderateComment(id: string, status: 'publicado' | 'oculto', reason: string) {
  return run(requireClient().rpc('moderate_comment', { p_comment_id: id, p_new_status: status, p_reason: reason }));
}

export interface ReportRow { id: string; experience_id: string; comment_id: string | null; reason: string; details: string | null; status: string; resolution_note: string | null; created_at: string }
export function listReports(status: string) {
  return run<ReportRow[]>(
    requireClient().from('content_reports')
      .select('id, experience_id, comment_id, reason, details, status, resolution_note, created_at')
      .eq('status', status).order('created_at').limit(100),
  );
}
export function resolveReport(id: string, status: string, note: string) {
  return run(requireClient().rpc('resolve_report', { p_report_id: id, p_status: status, p_note: note }));
}

export interface ClaimRow {
  id: string; company_id: string; experience_id: string | null; claimant_name: string; claimant_role: string; contact_email: string;
  claim_type: string; description: string; requested_action: string; status: string; resolution_public: string | null; created_at: string;
}
export function listClaims(status: string) {
  return run<ClaimRow[]>(
    requireClient().from('company_claims')
      .select('id, company_id, experience_id, claimant_name, claimant_role, contact_email, claim_type, description, requested_action, status, resolution_public, created_at')
      .eq('status', status).order('created_at').limit(100),
  );
}
export function resolveClaim(id: string, status: string, publicResolution: string, internalNote: string) {
  return run(requireClient().rpc('resolve_claim', { p_claim_id: id, p_status: status, p_public_resolution: publicResolution, p_internal_note: internalNote || null }));
}

export interface AppealRow { id: string; experience_id: string; body: string; status: string; resolution: string | null; created_at: string }
export function listAppeals(status: string) {
  return run<AppealRow[]>(
    requireClient().from('appeals').select('id, experience_id, body, status, resolution, created_at').eq('status', status).order('created_at').limit(100),
  );
}
export function resolveAppeal(id: string, status: string, resolution: string, internalNote: string) {
  return run(requireClient().rpc('resolve_appeal', { p_appeal_id: id, p_status: status, p_resolution: resolution, p_internal_note: internalNote || null }));
}

export interface ModerationEventRow {
  id: number; target_type: string; target_id: string; previous_status: string | null; new_status: string | null;
  reason: string; internal_note: string | null; actor_id: string | null; created_at: string;
}
export function listModerationEvents(targetId?: string) {
  let q = requireClient().from('moderation_events')
    .select('id, target_type, target_id, previous_status, new_status, reason, internal_note, actor_id, created_at')
    .order('created_at', { ascending: false }).limit(100);
  if (targetId) q = q.eq('target_id', targetId);
  return run<ModerationEventRow[]>(q);
}

export interface SuggestionRow { id: string; trade_name: string; city: string; department: string | null; website: string | null; note: string | null; status: string; created_at: string }
export function listSuggestions() {
  return run<SuggestionRow[]>(
    requireClient().from('company_suggestions')
      .select('id, trade_name, city, department, website, note, status, created_at')
      .eq('status', 'pendiente').order('created_at').limit(100),
  );
}
export function resolveSuggestion(id: string, status: string, note: string, companyId?: string) {
  return run(requireClient().rpc('resolve_company_suggestion', { p_suggestion_id: id, p_status: status, p_note: note, p_company_id: companyId || null }));
}

export interface NewCompany { slug: string; trade_name: string; legal_name?: string; sector: string; city: string; department: string; website?: string }
export function createCompany(input: NewCompany) {
  return run<{ id: string }>(
    requireClient().from('companies').insert({
      ...input, legal_name: input.legal_name || null, website: input.website || null,
    }).select('id').single(),
  );
}
export function addCompanyAlias(companyId: string, alias: string) {
  return run(requireClient().from('company_aliases').insert({ company_id: companyId, alias }));
}

export function publishCompanyResponse(input: { companyId: string; experienceId?: string; claimId?: string; label: string; body: string }) {
  return run(
    requireClient().rpc('publish_company_response', {
      p_company_id: input.companyId, p_experience_id: input.experienceId || null, p_claim_id: input.claimId || null,
      p_representative_label: input.label, p_body: input.body,
    }),
  );
}

// Relación uno a uno: PostgREST la devuelve como objeto, pero sin tipos generados se infiere como lista.
type Stats = { views: number; last_view_at?: string | null } | { views: number; last_view_at?: string | null }[] | null;
export function guideViews(stats: Stats) {
  const s = Array.isArray(stats) ? stats[0] : stats;
  return { views: s?.views ?? 0, lastViewAt: s?.last_view_at ?? null };
}

export type GuideStatus = 'borrador' | 'pendiente_verificacion' | 'publicado' | 'archivado';
export interface GuideRow {
  id: string; slug: string; title: string; summary: string; status: GuideStatus; last_verified_at: string | null; updated_at: string;
  category_slug: string | null; topic: string | null;
  legal_resource_sources: { id: string }[];
  legal_resource_stats: Stats;
}
export function listGuides() {
  return run<GuideRow[]>(
    requireClient().from('legal_resources')
      .select('id, slug, title, summary, status, last_verified_at, updated_at, category_slug, topic, legal_resource_sources(id), legal_resource_stats(views)')
      .order('title'),
  );
}
/** Publicar exige fecha de verificación: se registra hoy y quién publica. */
export function setGuideStatus(id: string, status: GuideStatus, userId: string) {
  const patch = status === 'publicado'
    ? { status, last_verified_at: todayLocal(), verified_by: userId }
    : { status };
  return run(requireClient().from('legal_resources').update(patch).eq('id', id));
}

export interface GuideSource { id: string; label: string; publisher: string; url: string; accessed_at: string }
export interface GuideDetail {
  id: string; slug: string; title: string; summary: string; content: string; category_slug: string | null;
  status: GuideStatus; last_verified_at: string | null; updated_at: string; cover_url: string | null; cover_alt: string; topic: string;
  legal_resource_sources: GuideSource[];
  legal_resource_stats: Stats;
}
export function getGuide(id: string) {
  return run<GuideDetail | null>(
    requireClient().from('legal_resources')
      .select('id, slug, title, summary, content, category_slug, status, last_verified_at, updated_at, cover_url, cover_alt, topic, legal_resource_sources(id, label, publisher, url, accessed_at), legal_resource_stats(views, last_view_at)')
      .eq('id', id).maybeSingle(),
  );
}
export function updateGuide(id: string, patch: { title: string; summary: string; content: string; category_slug: string | null; topic: string }) {
  return run(requireClient().from('legal_resources').update(patch).eq('id', id).select('id').single());
}
export function addGuideSource(resourceId: string, s: Omit<GuideSource, 'id'>) {
  return run(requireClient().from('legal_resource_sources').insert({ resource_id: resourceId, ...s }));
}
export function deleteGuideSource(id: string) {
  return run(requireClient().from('legal_resource_sources').delete().eq('id', id));
}
/** Sube una imagen al bucket público «guias» y devuelve su URL pública. */
export async function uploadGuideImage(guideSlug: string, file: File) {
  const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[file.type];
  if (!ext) throw toAppError({ message: 'VL090: Usa una imagen PNG, JPG o WebP.' });
  if (file.size > 2 * 1024 * 1024) throw toAppError({ message: 'VL091: La imagen supera 2 MB. Redúcela e inténtalo de nuevo.' });
  const path = `${guideSlug}/${crypto.randomUUID()}.${ext}`;
  const bucket = requireClient().storage.from('guias');
  const { error } = await bucket.upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw toAppError(error);
  return bucket.getPublicUrl(path).data.publicUrl;
}

/** Ruta dentro del bucket «guias» de una URL pública, o null si es de otro sitio. */
function guideImagePath(url: string | null) {
  const marker = '/storage/v1/object/public/guias/';
  const i = url?.indexOf(marker) ?? -1;
  return url && i >= 0 ? decodeURIComponent(url.slice(i + marker.length)) : null;
}

/** Guarda la portada de una guía (o la quita con url null) y borra el archivo anterior. */
export async function setGuideCover(id: string, cover: { url: string | null; alt: string }, previousUrl: string | null) {
  await run(requireClient().from('legal_resources').update({ cover_url: cover.url, cover_alt: cover.alt.trim() }).eq('id', id));
  const old = guideImagePath(previousUrl);
  if (old && previousUrl !== cover.url) {
    // Si falla el borrado, el archivo queda huérfano pero la guía ya está bien.
    await requireClient().storage.from('guias').remove([old]).catch(() => undefined);
  }
}

/**
 * Borra una guía de forma definitiva (queda registro en moderación) y después
 * intenta limpiar sus imágenes del bucket «guias».
 */
export async function deleteGuide(id: string) {
  const client = requireClient();
  // Se envía el motivo por defecto para que funcione con cualquiera de las dos
  // versiones de la función (20261101001800 lo exige; 20261101001900 no).
  const { data, error } = await client.rpc('delete_legal_resource', { p_id: id, p_reason: 'Guía borrada desde el panel' });
  let slug = data as string | null;
  if (error) {
    // Si la base de datos aún no tiene la función (migraciones pendientes),
    // se intenta el borrado directo, que el esquema anterior permitía a la
    // administración. Si tampoco se puede, se explica qué falta.
    if (!isMissingFunction(error)) throw toAppError(error);
    const direct = await client.from('legal_resources').delete().eq('id', id).select('slug');
    if (direct.error) {
      throw new AppError(
        'unknown',
        'No se pudo borrar: falta aplicar en Supabase las migraciones 20261101001800_delete_guide.sql y 20261101001900_delete_guide_no_reason.sql.',
      );
    }
    if (!direct.data?.length) throw new AppError('permission', 'No tienes permiso para borrar esta guía, o ya se había borrado.');
    slug = direct.data[0].slug as string;
  }
  if (slug) {
    // Si falla la limpieza, quedan archivos huérfanos pero la guía ya se borró.
    try {
      const bucket = client.storage.from('guias');
      const { data: files } = await bucket.list(slug, { limit: 1000 });
      const paths = (files ?? []).map((f) => `${slug}/${f.name}`);
      if (paths.length) await bucket.remove(paths);
    } catch {
      /* sin acción */
    }
  }
  return slug;
}

/** PostgREST responde PGRST202 (404) cuando la función no existe en el esquema. */
function isMissingFunction(error: unknown) {
  const e = error as { code?: string; message?: string };
  return e?.code === 'PGRST202' || /Could not find the function/i.test(e?.message ?? '');
}

const NEW_GUIDE_CONTENT = `## Qué dice la ley
Escribe aquí el contenido de la guía. Cita el artículo y la norma de cada afirmación.

## Qué puedes hacer
- Primer paso
- Segundo paso`;

/** Crea una guía en borrador y devuelve su id. Si la dirección ya existe, añade un sufijo. */
export async function createGuide(input: { title: string; summary: string; category_slug: string | null }, slugBase: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? slugBase : `${slugBase.slice(0, 75)}-${attempt + 1}`;
    const { data, error } = await requireClient()
      .from('legal_resources')
      .insert({ ...input, slug, content: NEW_GUIDE_CONTENT, status: 'borrador' })
      .select('id')
      .single();
    if (!error) return (data as { id: string }).id;
    if ((error as { code?: string }).code !== '23505') throw toAppError(error);
  }
  throw toAppError({ message: 'VL072: Ya existe una guía con un título muy parecido. Cambia el título.' });
}

// ---------------------------------------------------------------- sugerencias editoriales
export type SuggestionStatus = 'nueva' | 'pedida' | 'redactada' | 'descartada' | 'existente';
type GuideRef = { id: string; slug: string; title: string; status: GuideStatus } | null;
export interface GuideSuggestion {
  id: string; kind: 'nueva' | 'actualizar'; title: string; reason: string; demand: string; priority: 'alta' | 'media' | 'baja';
  topic: string; keywords: string[]; sources: { label: string; url: string }[]; status: SuggestionStatus; instructions: string;
  proposal: string | null; proposal_notes: string; requested_at: string | null; drafted_at: string | null; decided_at: string | null;
  created_at: string; target: GuideRef; draft: GuideRef;
}
export function listGuideSuggestions() {
  return run<GuideSuggestion[]>(
    requireClient().from('guide_suggestions')
      .select('id, kind, title, reason, demand, priority, topic, keywords, sources, status, instructions, proposal, proposal_notes, requested_at, drafted_at, decided_at, created_at, target:legal_resources!guide_suggestions_target_resource_id_fkey(id, slug, title, status), draft:legal_resources!guide_suggestions_draft_resource_id_fkey(id, slug, title, status)')
      .order('created_at', { ascending: false })
      .limit(200)
      .returns<GuideSuggestion[]>(),
  );
}
/** Borra de forma definitiva una sugerencia descartada o marcada como «ya la tenemos». */
export function deleteSuggestion(id: string) {
  return run(requireClient().rpc('editorial_delete_suggestion', { p_id: id }));
}
export function setSuggestionStatus(id: string, status: SuggestionStatus, instructions?: string) {
  return run(requireClient().rpc('editorial_set_status', { p_id: id, p_status: status, p_instructions: instructions ?? null }));
}
/** Aplica a la guía el texto que propuso el redactor. Devuelve la dirección de la guía. */
export function applySuggestionProposal(id: string) {
  return run<string>(requireClient().rpc('editorial_apply_proposal', { p_id: id }));
}

// ---------------------------------------------------------------- búsquedas sin resultado
export interface SearchGap { term: string; searches: number; results: number; last_seen: string }

export function listSearchGaps(days = 30) {
  return run<SearchGap[]>(requireClient().rpc('editorial_search_gaps', { p_days: days, p_max_results: 0 }));
}

/** Crea una sugerencia editorial nueva sin redactar ni publicar contenido. */
export interface NewEditorialSuggestion {
  kind: 'nueva' | 'actualizar';
  title: string;
  reason: string;
  demand?: string;
  priority: 'alta' | 'media' | 'baja';
  topic?: string;
  keywords?: string[];
  sources: { label: string; url: string }[];
  target?: string | null;
}
export function createEditorialSuggestion(input: NewEditorialSuggestion) {
  return run<string>(requireClient().rpc('editorial_add_suggestion', {
    p_kind: input.kind,
    p_title: input.title,
    p_reason: input.reason,
    p_demand: input.demand ?? '',
    p_priority: input.priority,
    p_topic: input.topic ?? '',
    p_keywords: input.keywords ?? [],
    p_sources: input.sources,
    p_target_slug: input.target ?? null,
  }));
}
