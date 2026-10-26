// Operaciones del panel de moderación. La autorización real está en la base
// de datos: estas funciones fallan con "permiso" si la cuenta no tiene rol.
import { requireClient } from './supabase';
import { toAppError } from './errors';
import type { ExperienceStatus } from './api';

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

export interface ReportRow { id: string; experience_id: string; reason: string; details: string | null; status: string; resolution_note: string | null; created_at: string }
export function listReports(status: string) {
  return run<ReportRow[]>(
    requireClient().from('content_reports')
      .select('id, experience_id, reason, details, status, resolution_note, created_at')
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
