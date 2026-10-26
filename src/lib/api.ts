// Acceso a datos. Todas las consultas nombran columnas explícitas: la base de
// datos concede privilegios por columna y un "select *" sería rechazado.
import { requireClient } from './supabase';
import { toAppError } from './errors';
import type { ExperienceInput } from './schemas';

export type ExperienceStatus = 'en_revision' | 'publicada' | 'requiere_ajustes' | 'en_disputa' | 'restringida' | 'retirada';

export interface Category { slug: string; name: string; description: string; sort_order: number }
export interface CompanySummary {
  id: string; slug: string; trade_name: string; legal_name: string | null; sector: string; city: string; department: string;
  visible_experiences: number; last_activity: string | null; total_count: number;
}
export interface CompanyProfile {
  company: { id: string; slug: string; trade_name: string; legal_name: string | null; sector: string; city: string; department: string; website: string | null; updated_at: string; aliases: string[] };
  visible_experiences: number;
  breakdown_hidden: boolean;
  categories: { slug: string; name: string; count: number }[];
  period_from_year: number | null;
  period_to_year: number | null;
  open_claims: number;
}
export interface PublicExperience {
  id: string; company_id: string; company_slug: string; company_name: string; category_slug: string; category_name: string;
  period_start: string; period_end: string | null; relationship: string; title: string | null; body: string; has_documents: boolean;
  status: ExperienceStatus; published_at: string | null; author_alias: string; total_count: number;
}
export interface MyExperience {
  id: string; company_id: string; company_slug: string; company_name: string; category_slug: string; category_name: string;
  period_start: string; period_end: string | null; relationship: string; title: string | null; body: string; has_documents: boolean;
  status: ExperienceStatus; status_reason: string | null; published_at: string | null; created_at: string; updated_at: string;
}
export interface CompanyResponse { id: string; experience_id: string | null; representative_label: string; body: string; created_at: string }
export interface LegalResource {
  id: string; slug: string; title: string; summary: string; content: string; category_slug: string | null;
  disclaimer: string; last_verified_at: string | null; updated_at: string;
  legal_resource_sources?: { id: string; label: string; publisher: string; url: string; accessed_at: string }[];
}
export interface Profile {
  id: string; alias: string | null; status: 'activa' | 'suspendida' | 'eliminacion_solicitada' | 'eliminada';
  suspended_reason: string | null; deletion_requested_at: string | null; alias_updated_at: string | null; created_at: string;
}

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

const monthToDate = (m: string) => `${m}-01`;
export const PAGE_SIZE = 20;

// ---------------------------------------------------------------- público
export function listCategories() {
  return run<Category[]>(
    requireClient().from('experience_categories').select('slug, name, description, sort_order').order('sort_order'),
  );
}

export function searchCompanies(params: { query?: string; city?: string; sector?: string; order?: 'relevancia' | 'actividad'; page?: number; pageSize?: number }) {
  const size = params.pageSize ?? PAGE_SIZE;
  return run<CompanySummary[]>(
    requireClient().rpc('search_companies', {
      p_query: params.query || null,
      p_city: params.city || null,
      p_sector: params.sector || null,
      p_order: params.order ?? 'relevancia',
      p_limit: size,
      p_offset: ((params.page ?? 1) - 1) * size,
    }),
  );
}

export function getCompanyById(id: string) {
  return run<{ id: string; slug: string; trade_name: string; sector: string; city: string; department: string } | null>(
    requireClient().from('companies').select('id, slug, trade_name, sector, city, department').eq('id', id).maybeSingle(),
  );
}

export function getCompanyProfile(slug: string) {
  return run<CompanyProfile | null>(requireClient().rpc('company_profile', { p_slug: slug }));
}

export function listExperiences(params: { companyId?: string; category?: string; fromYear?: string; toYear?: string; page?: number; pageSize?: number }) {
  const size = params.pageSize ?? PAGE_SIZE;
  return run<PublicExperience[]>(
    requireClient().rpc('list_experiences', {
      p_company_id: params.companyId || null,
      p_category: params.category || null,
      p_from: params.fromYear ? `${params.fromYear}-01-01` : null,
      p_to: params.toYear ? `${params.toYear}-12-31` : null,
      p_limit: size,
      p_offset: ((params.page ?? 1) - 1) * size,
    }),
  );
}

export function listCompanyResponses(companyId: string) {
  return run<CompanyResponse[]>(
    requireClient()
      .from('company_responses')
      .select('id, experience_id, representative_label, body, created_at')
      .eq('company_id', companyId)
      .eq('status', 'publicada')
      .order('created_at', { ascending: false }),
  );
}

export function listLegalResources() {
  return run<LegalResource[]>(
    requireClient()
      .from('legal_resources')
      .select('id, slug, title, summary, content, category_slug, disclaimer, last_verified_at, updated_at')
      .eq('status', 'publicado')
      .order('title'),
  );
}

export function getLegalResource(slug: string) {
  return run<LegalResource | null>(
    requireClient()
      .from('legal_resources')
      .select('id, slug, title, summary, content, category_slug, disclaimer, last_verified_at, updated_at, legal_resource_sources(id, label, publisher, url, accessed_at)')
      .eq('slug', slug)
      .eq('status', 'publicado')
      .maybeSingle(),
  );
}

// ---------------------------------------------------------------- cuenta
export function getMyProfile(userId: string) {
  return run<Profile | null>(
    requireClient()
      .from('profiles')
      .select('id, alias, status, suspended_reason, deletion_requested_at, alias_updated_at, created_at')
      .eq('id', userId)
      .maybeSingle(),
  );
}

export async function getMyRoles(userId: string) {
  const rows = await run<{ role: 'moderator' | 'admin' }[]>(requireClient().from('admin_roles').select('role').eq('user_id', userId));
  return rows.map((r) => r.role);
}

export function updateAlias(userId: string, alias: string) {
  return run(requireClient().from('profiles').update({ alias }).eq('id', userId).select('id').single());
}

export function listMyExperiences() {
  return run<MyExperience[]>(requireClient().rpc('my_experiences'));
}

export function getMyExperienceHistory(id: string) {
  return run<{ previous_status: string | null; new_status: string; reason: string; created_at: string }[]>(
    requireClient().rpc('my_experience_history', { p_experience_id: id }),
  );
}

export function withdrawMyExperience(id: string) {
  return run(requireClient().rpc('withdraw_my_experience', { p_experience_id: id }));
}

export function requestAccountDeletion() {
  return run(requireClient().rpc('request_account_deletion'));
}

export function cancelAccountDeletion() {
  return run(requireClient().rpc('cancel_account_deletion'));
}

// ---------------------------------------------------------------- envíos
function experienceRow(input: ExperienceInput) {
  return {
    category_slug: input.category,
    period_start: monthToDate(input.periodStart),
    period_end: input.periodEnd ? monthToDate(input.periodEnd) : null,
    relationship: input.relationship,
    title: input.title || null,
    body: input.body.trim(),
    has_documents: input.hasDocuments,
  };
}

export function createExperience(input: ExperienceInput) {
  return run<{ id: string; status: ExperienceStatus }>(
    requireClient()
      .from('experiences')
      .insert({ ...experienceRow(input), company_id: input.companyId, rules_accepted: input.rulesAccepted })
      .select('id, status')
      .single(),
  );
}

export function updateMyExperience(id: string, input: ExperienceInput) {
  return run<{ id: string; status: ExperienceStatus }>(
    requireClient().from('experiences').update(experienceRow(input)).eq('id', id).select('id, status').single(),
  );
}

export function reportExperience(experienceId: string, reason: string, details: string) {
  return run(requireClient().from('content_reports').insert({ experience_id: experienceId, reason, details: details || null }));
}

export function submitClaim(input: {
  companyId: string; experienceId?: string | null; claimantName: string; claimantRole: string; contactEmail: string;
  claimType: string; description: string; requestedAction: string;
}) {
  return run(
    requireClient().from('company_claims').insert({
      company_id: input.companyId,
      experience_id: input.experienceId || null,
      claimant_name: input.claimantName,
      claimant_role: input.claimantRole,
      contact_email: input.contactEmail,
      claim_type: input.claimType,
      description: input.description,
      requested_action: input.requestedAction,
    }),
  );
}

export interface MyClaim { id: string; company_id: string; claim_type: string; requested_action: string; status: string; resolution_public: string | null; created_at: string }
export function listMyClaims() {
  return run<MyClaim[]>(
    requireClient()
      .from('company_claims')
      .select('id, company_id, claim_type, requested_action, status, resolution_public, created_at')
      .order('created_at', { ascending: false }),
  );
}

export function submitAppeal(experienceId: string, body: string) {
  return run(requireClient().from('appeals').insert({ experience_id: experienceId, body }));
}

export function suggestCompany(input: { tradeName: string; city: string; department?: string; website?: string; note?: string }) {
  return run(
    requireClient().from('company_suggestions').insert({
      trade_name: input.tradeName,
      city: input.city,
      department: input.department || null,
      website: input.website || null,
      note: input.note || null,
    }),
  );
}
