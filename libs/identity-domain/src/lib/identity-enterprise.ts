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

export interface CreateSubEnterpriseRequest {
  business_name: string;
  document_type: EnterpriseDocumentType;
  document_number: string;
  company_code: string;
  email: string;
  phone: string;
  metadata_?: Record<string, unknown>;
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
