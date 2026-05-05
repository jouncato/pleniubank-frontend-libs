import { ApiEnvelope } from '@pleniu/shared-http';

/** Matches Identity `DocumentType` */
export type EnterpriseDocumentType = 'CC' | 'CE' | 'NIT' | 'PP' | 'TI';

export interface RegisterEnterprisePersonRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface RegisterEnterpriseRequest {
  business_name: string;
  document_type: EnterpriseDocumentType;
  document_number: string;
  company_email: string;
  company_phone: string;
  /** ID del catálogo Identity `economic_sectors` (obligatorio en registro self-service). */
  economic_sector_id: string;
  /** Deprecado: el backend ignora si viene `economic_sector_id`. */
  sector?: string | null;
  principal: RegisterEnterprisePersonRequest;
  admin: RegisterEnterprisePersonRequest;
  metadata_?: Record<string, unknown>;
}

/** GET /api/v1/economic-sectors (sectores activos). */
export interface EconomicSectorPublicDto {
  sector_id: string;
  code: string;
  label_es: string;
  category: string;
  ui_sort_order: number;
}

export type EconomicSectorsListEnvelope = ApiEnvelope<EconomicSectorPublicDto[]>;

export interface RegisterEnterpriseResponse {
  enterprise_id: string;
  principal_user_id: string;
  admin_user_id: string;
  status: string;
  debug_principal_email_otp?: string | null;
  debug_admin_email_otp?: string | null;
}

export interface VerifyEnterpriseEmailRequest {
  user_id: string;
  code: string;
}

export interface VerifyEnterpriseEmailResponse {
  user_id: string;
  enterprise_id: string;
  email_verified: boolean;
  enterprise_status: string;
  enterprise_emails_complete: boolean;
  principal_email_verified: boolean;
  admin_email_verified: boolean;
  is_active: boolean;
  /** JWT access token for auto-login after successful verification */
  access_token?: string | null;
  token_type?: string;
  /** Token expiration in seconds */
  expires_in?: number | null;
  /** User role for the session */
  role?: string | null;
}

export interface ResendEnterpriseEmailOtpRequest {
  user_id: string;
}

export interface ResendEnterpriseEmailOtpResponse {
  status: string;
}

export interface KybDocumentsRequest {
  references?: Record<string, unknown>;
  waive_all_mvp?: boolean;
}

export interface KybDocumentsResponse {
  enterprise_id: string;
  enterprise_status: string;
  stages: Record<string, unknown>[];
}

/** GET /api/v1/enterprise/me/summary (cuerpo plano). */
export interface EnterpriseMeSummaryResponse {
  enterprise_id: string;
  enterprise_name: string;
  enterprise_status: string;
  kyb_complete: boolean;
  /** Prestadora de nómina (Identity); habilita anticipo en Core. */
  is_payroll_provider?: boolean;
  /** Usuario con rol `enterprise_principal` en Identity (referencia UI solo lectura para administradores). */
  principal_user_id?: string | null;
  principal_full_name?: string | null;
  principal_email?: string | null;
}

export interface InviteUserRequest {
  email: string;
  role_hint?: 'admin' | 'operator' | 'viewer';
}

export interface InviteUserResponse {
  invite_id: string;
  expires_at: string;
  debug_invite_token?: string | null;
}

export interface AcceptInviteRequest {
  token: string;
  password: string;
}

export interface AcceptInviteResponse {
  user_id: string;
  enterprise_id: string;
  email: string;
  role_in_enterprise: string;
}

export interface CreateUserEnterpriseRequest {
  email: string;
  password: string;
  full_name: string;
  role_in_enterprise: 'admin' | 'operator' | 'viewer';
  permissions?: Record<string, unknown>;
}

export interface CreateUserEnterpriseResponse {
  user_id: string;
  user_enterprise_id: string;
  email: string;
  role_in_enterprise: string;
  is_active: boolean;
}

/** Categoría operativa con la que se crea una Unidad (sub-empresa). */
export type BusinessUnitType =
  | 'sucursal'
  | 'planilla'
  | 'operacion'
  | 'franquicia'
  | 'centro_costo';

/** Propósito de negocio que habilita productos financieros sobre la Unidad. */
export type BusinessUnitPurpose =
  | 'nomina'
  | 'anticipo_nomina'
  | 'libranza'
  | 'cobranza'
  | 'otro';

/** Región operativa de la Unidad (país obligatorio, ciudad opcional). */
export interface BusinessUnitRegion {
  /** ISO-3166 alpha-2 (ej. "CO", "MX"). */
  country_code: string;
  city?: string;
}

/** Responsable operativo de la Unidad (aparece en auditoría / comunicaciones). */
export interface BusinessUnitOperationsLead {
  full_name: string;
  role?: string;
}

/**
 * Forma recomendada del `metadata_` de una Unidad (sub-empresa).
 * Identity acepta cualquier JSON; estos campos son los que la UI tipa y muestra.
 */
export interface BusinessUnitMetadata {
  unit_type?: BusinessUnitType;
  region?: BusinessUnitRegion;
  /** Razón social legal si es distinta del nombre comercial. */
  legal_name?: string;
  operations_lead?: BusinessUnitOperationsLead;
  operations_purposes?: BusinessUnitPurpose[];
  /** Campos adicionales libres (forwards-compatibility). */
  [key: string]: unknown;
}

export interface CreateSubEnterpriseRequest {
  business_name: string;
  document_type: EnterpriseDocumentType;
  document_number: string;
  company_code: string;
  email: string;
  phone: string;
  metadata_?: BusinessUnitMetadata;
}

export interface CreateSubEnterpriseResponse {
  sub_enterprise_id: string;
  enterprise_id: string;
  business_name: string;
  company_code: string;
  status: string;
  created_at: string;
}

export type RegisterEnterpriseEnvelope = ApiEnvelope<RegisterEnterpriseResponse>;
export type VerifyEnterpriseEmailEnvelope = ApiEnvelope<VerifyEnterpriseEmailResponse>;
export type ResendEnterpriseEmailOtpEnvelope = ApiEnvelope<ResendEnterpriseEmailOtpResponse>;
export type KybDocumentsEnvelope = ApiEnvelope<KybDocumentsResponse>;
export type InviteUserEnvelope = ApiEnvelope<InviteUserResponse>;
export type AcceptInviteEnvelope = ApiEnvelope<AcceptInviteResponse>;
export type CreateUserEnterpriseEnvelope = ApiEnvelope<CreateUserEnterpriseResponse>;
export type CreateSubEnterpriseEnvelope = ApiEnvelope<CreateSubEnterpriseResponse>;

/** Lightweight row used in sub-enterprise (business unit) listings. */
export interface SubEnterpriseSummaryDto {
  sub_enterprise_id: string;
  enterprise_id: string;
  business_name: string;
  company_code: string;
  document_type: EnterpriseDocumentType;
  document_number: string;
  email: string;
  phone: string;
  status: string;
  /** Present when the list API includes business-unit metadata (e.g. unit_type). */
  metadata_?: BusinessUnitMetadata;
  created_at: string;
  updated_at?: string | null;
}

/** Full detail of a business unit, including user count and metadata. */
export interface SubEnterpriseDetailDto {
  sub_enterprise_id: string;
  enterprise_id: string;
  business_name: string;
  document_type: EnterpriseDocumentType;
  document_number: string;
  company_code: string;
  email: string;
  phone: string;
  status: string;
  user_count: number;
  metadata_?: BusinessUnitMetadata;
  created_at: string;
  updated_at?: string | null;
}

/** PATCH payload for a business unit. All fields optional but at least one should be set. */
export interface UpdateSubEnterpriseRequest {
  business_name?: string;
  document_type?: EnterpriseDocumentType;
  document_number?: string;
  email?: string;
  phone?: string;
}

/** Query params for listing business units under a parent enterprise. */
export interface SubEnterprisesListParams {
  status?: 'active' | 'inactive';
  search?: string;
  limit?: number;
}

export type SubEnterprisesListEnvelope = ApiEnvelope<SubEnterpriseSummaryDto[]>;
export type SubEnterpriseDetailEnvelope = ApiEnvelope<SubEnterpriseDetailDto>;
