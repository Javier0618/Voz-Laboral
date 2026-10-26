import { requireClient } from './supabase';
import type { ExperienceStatus } from '../shared/domain';

// Lecturas y RPC del panel de moderación. La base de datos rechaza todas
// estas operaciones si la cuenta no tiene rol.

function check<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data as T;
}

export interface QueueExperience {
  id: string;
  title: string | null;
  status: ExperienceStatus;
  account_direct: string;
  account_third_party: string | null;
  has_documents: boolean;
  created_at: string;
  author_id: string | null;
  companies: { name: string; status: string } | null;
  experience_categories: { name: string } | null;
  profiles: { alias: string | null } | null;
}

export async function listQueue(status: ExperienceStatus): Promise<QueueExperience[]> {
  return check(
    await requireClient()
      .from('experiences')
      .select(
        'id, title, status, account_direct, account_third_party, has_documents, created_at, author_id, companies (name, status), experience_categories (name), profiles (alias)',
      )
      .eq('status', status)
      .order('created_at', { ascending: true })
      .limit(50),
  ) as unknown as QueueExperience[];
}

export async function moderateExperience(id: string, status: ExperienceStatus, reason: string, note: string) {
  check(
    await requireClient().rpc('moderate_experience', {
      p_experience_id: id,
      p_new_status: status,
      p_reason: reason,
      p_internal_note: note || null,
    }),
  );
}

export interface ProposedCompany {
  id: string;
  name: string;
  city: string | null;
  sector: string | null;
  status: string;
  created_at: string;
}

export async function listProposedCompanies(): Promise<ProposedCompany[]> {
  return check(
    await requireClient()
      .from('companies')
      .select('id, name, city, sector, status, created_at')
      .eq('status', 'propuesta')
      .order('created_at'),
  ) as ProposedCompany[];
}

export async function setCompanyStatus(id: string, status: 'activa' | 'oculta' | 'propuesta', reason: string) {
  check(
    await requireClient().rpc('set_company_status', {
      p_company_id: id,
      p_new_status: status,
      p_reason: reason,
      p_internal_note: null,
    }),
  );
}

export interface OpenReport {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  experience_id: string | null;
  company_response_id: string | null;
}

export async function listOpenReports(): Promise<OpenReport[]> {
  return check(
    await requireClient()
      .from('content_reports')
      .select('id, reason, details, status, created_at, experience_id, company_response_id')
      .in('status', ['abierto', 'en_revision'])
      .order('created_at'),
  ) as OpenReport[];
}

export async function resolveReport(id: string, status: 'resuelto' | 'descartado' | 'en_revision', note: string) {
  check(
    await requireClient().rpc('resolve_report', {
      p_report_id: id,
      p_new_status: status,
      p_resolution_note: note,
      p_internal_note: null,
    }),
  );
}

export interface PendingAppeal {
  id: string;
  reason: string;
  created_at: string;
  experience_id: string;
}

export async function listPendingAppeals(): Promise<PendingAppeal[]> {
  return check(
    await requireClient()
      .from('appeals')
      .select('id, reason, created_at, experience_id')
      .eq('status', 'pendiente')
      .order('created_at'),
  ) as PendingAppeal[];
}

export async function resolveAppeal(id: string, status: 'aceptada' | 'rechazada', note: string) {
  check(
    await requireClient().rpc('resolve_appeal', {
      p_appeal_id: id,
      p_new_status: status,
      p_resolution_note: note,
      p_internal_note: null,
    }),
  );
}

export interface PendingClaim {
  id: string;
  claim_type: string;
  claimant_name: string;
  claimant_position: string;
  contact_email: string;
  message: string;
  created_at: string;
  experience_id: string | null;
  companies: { name: string } | null;
}

export async function listPendingClaims(): Promise<PendingClaim[]> {
  return check(
    await requireClient()
      .from('company_claims')
      .select('id, claim_type, claimant_name, claimant_position, contact_email, message, created_at, experience_id, companies (name)')
      .eq('status', 'pendiente')
      .order('created_at'),
  ) as unknown as PendingClaim[];
}

export async function reviewClaim(id: string, status: 'aprobada' | 'rechazada', note: string) {
  check(
    await requireClient().rpc('review_company_claim', {
      p_claim_id: id,
      p_new_status: status,
      p_resolution_note: note,
      p_internal_note: null,
    }),
  );
}

export interface PendingResponse {
  id: string;
  body: string;
  created_at: string;
  experience_id: string;
  companies: { name: string } | null;
}

export async function listPendingResponses(): Promise<PendingResponse[]> {
  return check(
    await requireClient()
      .from('company_responses')
      .select('id, body, created_at, experience_id, companies (name)')
      .eq('status', 'en_revision')
      .order('created_at'),
  ) as unknown as PendingResponse[];
}

export async function moderateResponse(id: string, status: 'publicada' | 'retirada', reason: string) {
  check(
    await requireClient().rpc('moderate_company_response', {
      p_response_id: id,
      p_new_status: status,
      p_reason: reason,
      p_internal_note: null,
    }),
  );
}
