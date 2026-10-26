// Estados y etiquetas compartidas entre la interfaz y la base de datos.
export const experienceStatuses = [
  'en_revision',
  'publicada',
  'requiere_ajustes',
  'en_disputa',
  'restringida',
  'retirada',
] as const;
export type ExperienceStatus = (typeof experienceStatuses)[number];

export const statusLabels: Record<ExperienceStatus, string> = {
  en_revision: 'En revisión',
  publicada: 'Publicada',
  requiere_ajustes: 'Requiere ajustes',
  en_disputa: 'En disputa',
  restringida: 'Restringida',
  retirada: 'Retirada',
};

export const statusDescriptions: Record<ExperienceStatus, string> = {
  en_revision: 'La moderación todavía no la revisa. Nadie más la ve.',
  publicada: 'Visible para cualquier persona con tu alias.',
  requiere_ajustes: 'Debes editarla antes de que se publique.',
  en_disputa: 'Visible, con una disputa abierta por parte de la empresa.',
  restringida: 'Oculta mientras se revisa. Puedes apelar.',
  retirada: 'Retirada de la plataforma. Puedes apelar.',
};

export const relationships = ['actual', 'anterior', 'prefiero_no_decir'] as const;
export type Relationship = (typeof relationships)[number];
export const relationshipLabels: Record<Relationship, string> = {
  actual: 'Trabajo ahí actualmente',
  anterior: 'Trabajé ahí antes',
  prefiero_no_decir: 'Prefiero no decirlo',
};

export const reportReasons = [
  'datos_personales',
  'informacion_falsa',
  'lenguaje_ofensivo',
  'acoso',
  'empresa_equivocada',
  'otro',
] as const;
export type ReportReason = (typeof reportReasons)[number];
export const reportReasonLabels: Record<ReportReason, string> = {
  datos_personales: 'Expone datos personales',
  informacion_falsa: 'Parece información falsa',
  lenguaje_ofensivo: 'Lenguaje ofensivo',
  acoso: 'Acoso o ataque personal',
  empresa_equivocada: 'Está en la empresa equivocada',
  otro: 'Otro motivo',
};

export const MIN_ACCOUNT = 200;
export const MAX_ACCOUNT = 5000;

export interface Category {
  id: number;
  slug: string;
  name: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  sector: string | null;
}

export interface CompanySearchRow extends Company {
  experience_count: number;
  total_count: number;
}

export interface PublicExperience {
  id: string;
  company_id: string;
  company_name: string;
  company_slug: string;
  category_id: number;
  category_name: string;
  period_start: string;
  period_end: string | null;
  relationship: Relationship;
  title: string | null;
  account_direct: string;
  account_third_party: string | null;
  has_documents: boolean;
  status: ExperienceStatus;
  published_at: string;
  author_alias: string;
}

export interface CompanyStats {
  visible_count: number;
  period_from: string | null;
  period_to: string | null;
  categories: { category_id: number; name: string; count: number }[];
  hidden_categories: number;
}
