import { requireClient } from './supabase';
import type {
  Category,
  Company,
  CompanySearchRow,
  CompanyStats,
  ExperienceStatus,
  PublicExperience,
  Relationship,
  ReportReason,
} from '../shared/domain';

// Capa de acceso a datos. Las columnas se piden de forma explícita: varias
// tablas solo conceden SELECT sobre columnas concretas.

const PUBLIC_EXPERIENCE_COLUMNS =
  'id, company_id, company_name, company_slug, category_id, category_name, period_start, period_end, relationship, title, account_direct, account_third_party, has_documents, status, published_at, author_alias';

function check<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data as T;
}

export async function listCategories(): Promise<Category[]> {
  return check(
    await requireClient().from('experience_categories').select('id, slug, name').order('sort_order'),
  ) as Category[];
}

export interface CompanySearchParams {
  query?: string;
  city?: string;
  sector?: string;
  page: number;
  pageSize: number;
}

export async function searchCompanies(p: CompanySearchParams): Promise<{ rows: CompanySearchRow[]; total: number }> {
  const data = check(
    await requireClient().rpc('search_companies', {
      p_query: p.query || null,
      p_city: p.city || null,
      p_sector: p.sector || null,
      p_limit: p.pageSize,
      p_offset: (p.page - 1) * p.pageSize,
    }),
  ) as CompanySearchRow[];
  return { rows: data, total: data[0] ? Number(data[0].total_count) : 0 };
}

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  const data = check(
    await requireClient().from('companies').select('id, name, slug, city, sector').eq('slug', slug).maybeSingle(),
  );
  return data as Company | null;
}

export async function getCompanyStats(companyId: string): Promise<CompanyStats> {
  return check(await requireClient().rpc('company_stats', { p_company_id: companyId })) as CompanyStats;
}

export async function getGlobalStats(): Promise<CompanyStats> {
  return check(await requireClient().rpc('category_stats')) as CompanyStats;
}

export interface ExperienceFilters {
  companyId?: string;
  categoryId?: number;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export async function listPublicExperiences(f: ExperienceFilters): Promise<{ rows: PublicExperience[]; total: number }> {
  let q = requireClient()
    .from('public_experiences')
    .select(PUBLIC_EXPERIENCE_COLUMNS, { count: 'exact' })
    .order('published_at', { ascending: false });
  if (f.companyId) q = q.eq('company_id', f.companyId);
  if (f.categoryId) q = q.eq('category_id', f.categoryId);
  if (f.from) q = q.gte('period_start', f.from);
  if (f.to) q = q.lte('period_start', f.to);
  const start = (f.page - 1) * f.pageSize;
  const res = await q.range(start, start + f.pageSize - 1);
  if (res.error) throw res.error;
  return { rows: (res.data ?? []) as unknown as PublicExperience[], total: res.count ?? 0 };
}

export interface CompanyResponse {
  id: string;
  experience_id: string;
  body: string;
  published_at: string;
}

export async function listCompanyResponses(companyId: string): Promise<CompanyResponse[]> {
  return check(
    await requireClient()
      .from('public_company_responses')
      .select('id, experience_id, body, published_at')
      .eq('company_id', companyId),
  ) as CompanyResponse[];
}

export async function findCompaniesForSelect(query: string): Promise<CompanySearchRow[]> {
  return (await searchCompanies({ query, page: 1, pageSize: 8 })).rows;
}

export async function proposeCompany(name: string, city: string, sector: string): Promise<string> {
  return check(
    await requireClient().rpc('propose_company', { p_name: name, p_city: city || null, p_sector: sector || null }),
  ) as string;
}

export interface NewExperience {
  authorId: string;
  companyId: string;
  categoryId: number;
  periodStart: string;
  periodEnd: string | null;
  relationship: Relationship;
  title: string | null;
  accountDirect: string;
  accountThirdParty: string | null;
  hasDocuments: boolean;
}

export async function createExperience(e: NewExperience): Promise<{ id: string; status: ExperienceStatus }> {
  const res = await requireClient()
    .from('experiences')
    .insert({
      author_id: e.authorId,
      company_id: e.companyId,
      category_id: e.categoryId,
      period_start: e.periodStart,
      period_end: e.periodEnd,
      relationship: e.relationship,
      title: e.title,
      account_direct: e.accountDirect,
      account_third_party: e.accountThirdParty,
      has_documents: e.hasDocuments,
    })
    .select('id, status')
    .single();
  return check(res) as { id: string; status: ExperienceStatus };
}

export interface OwnExperience {
  id: string;
  title: string | null;
  status: ExperienceStatus;
  moderation_reason: string | null;
  created_at: string;
  published_at: string | null;
  company_id: string;
  category_id: number;
  account_direct: string;
  account_third_party: string | null;
  period_start: string;
  period_end: string | null;
  relationship: Relationship;
  has_documents: boolean;
}

export async function listOwnExperiences(userId: string): Promise<OwnExperience[]> {
  return check(
    await requireClient()
      .from('experiences')
      .select(
        'id, title, status, moderation_reason, created_at, published_at, company_id, category_id, account_direct, account_third_party, period_start, period_end, relationship, has_documents',
      )
      .eq('author_id', userId)
      .order('created_at', { ascending: false }),
  ) as OwnExperience[];
}

export async function updateOwnExperience(
  id: string,
  fields: { account_direct: string; account_third_party: string | null; title: string | null },
): Promise<void> {
  const res = await requireClient().from('experiences').update(fields).eq('id', id).select('id');
  const rows = check(res) as { id: string }[];
  if (rows.length === 0) throw new Error('Esta experiencia ya no se puede editar');
}

export async function reportContent(p: {
  reporterId: string;
  experienceId?: string;
  responseId?: string;
  reason: ReportReason;
  details: string;
}): Promise<void> {
  check(
    await requireClient().from('content_reports').insert({
      reporter_id: p.reporterId,
      experience_id: p.experienceId ?? null,
      company_response_id: p.responseId ?? null,
      reason: p.reason,
      details: p.details || null,
    }),
  );
}

export async function createAppeal(p: { appellantId: string; experienceId: string; reason: string }): Promise<void> {
  check(
    await requireClient()
      .from('appeals')
      .insert({ appellant_id: p.appellantId, experience_id: p.experienceId, reason: p.reason }),
  );
}

export async function createClaim(p: {
  claimantId: string;
  companyId: string;
  experienceId?: string | null;
  claimType: 'representacion' | 'correccion';
  claimantName: string;
  claimantPosition: string;
  contactEmail: string;
  message: string;
}): Promise<void> {
  check(
    await requireClient().from('company_claims').insert({
      claimant_id: p.claimantId,
      company_id: p.companyId,
      experience_id: p.experienceId ?? null,
      claim_type: p.claimType,
      claimant_name: p.claimantName,
      claimant_position: p.claimantPosition,
      contact_email: p.contactEmail,
      message: p.message,
    }),
  );
}

export interface LegalResource {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string | null;
  verification_status: 'pendiente_verificacion' | 'verificado';
  verified_at: string | null;
  legal_resource_sources: {
    id: string;
    citation: string;
    url: string | null;
    verification_status: 'pendiente_verificacion' | 'verificado';
  }[];
}

export async function listLegalResources(): Promise<LegalResource[]> {
  return check(
    await requireClient()
      .from('legal_resources')
      .select(
        'id, slug, title, summary, body, verification_status, verified_at, legal_resource_sources (id, citation, url, verification_status)',
      )
      .eq('is_published', true)
      .order('sort_order'),
  ) as LegalResource[];
}
