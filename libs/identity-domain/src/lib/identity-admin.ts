import { ApiEnvelope } from '@pleniu/shared-http';
import { EnterpriseDocumentType } from './identity-enterprise';

/** Roles permitidos en `POST /api/v1/admin/users` (Identity `UserRole`). */
export type AdminCreateUserRole =
  | 'admin'
  | 'employee'
  | 'risk_officer'
  | 'compliance_officer'
  | 'legal_admin';

export interface AdminCreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role: AdminCreateUserRole;
  two_factor_enabled?: boolean;
}

export interface AdminCreateUserResponse {
  user_id: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface AdminUserDto {
  user_id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: string;
  status: 'active' | 'inactive';
  created_at: string;
  enterprise_id?: string | null;
  password_must_change?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  pending_email?: string | null;
}

export interface AdminUserActivityItem {
  event_type: string;
  entity_type: string;
  entity_id?: string | null;
  correlation_id?: string | null;
  created_at: string;
  details?: Record<string, unknown>;
}

export interface AdminUserDetailDto {
  user_id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: string;
  status: 'active' | 'inactive';
  enterprise_id?: string | null;
  customer_id?: string | null;
  two_factor_enabled: boolean;
  identity_verified: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  password_must_change?: boolean;
  pending_email?: string | null;
  created_at: string;
  recent_activity: AdminUserActivityItem[];
}

export interface AdminPatchUserRequest {
  status?: 'active' | 'inactive';
  role?: string;
}

export interface AdminPatchStaffProfileRequest {
  full_name?: string;
  phone?: string | null;
}

export interface AdminPasswordResetResponse {
  status: string;
  user_id: string;
  password_must_change: boolean;
}

export interface AdminStaffEmailChangeRequest {
  new_email: string;
}

export interface AdminStaffEmailChangeResponse {
  status: string;
  user_id: string;
  expires_in_seconds: number;
  debug_code?: string | null;
}

export interface AdminStaffEmailChangeConfirmRequest {
  staff_id: string;
  code: string;
}

export interface AdminUsersListParams {
  email?: string;
  role?: string;
  enterprise_id?: string;
  status?: 'active' | 'inactive';
  cursor?: string;
  limit?: number;
}

export interface CursorPaginationMeta {
  cursor?: string | null;
  total?: number | null;
  has_more?: boolean;
}

export type AdminUsersListEnvelope = ApiEnvelope<AdminUserDto[]>;
export type AdminUserDetailEnvelope = ApiEnvelope<AdminUserDetailDto>;

/** Body de `POST /api/v1/admin/enterprises` (Identity `CreateEnterpriseRequest`). */
export interface AdminCreateEnterpriseRequest {
  business_name: string;
  document_type: EnterpriseDocumentType;
  document_number: string;
  email: string;
  phone: string;
  economic_sector_id?: string | null;
  sector?: string | null;
  metadata_?: Record<string, unknown>;
}

export interface AdminCreateEnterpriseResponse {
  enterprise_id: string;
  business_name: string;
  document_type: string;
  document_number: string;
  status: string;
  created_at: string;
}

export type AdminEnterpriseKybStatus = 'pending_kyb' | 'active' | 'rejected' | string;

export interface AdminEnterpriseSummaryDto {
  enterprise_id: string;
  business_name: string;
  document_number: string;
  economic_sector_id?: string | null;
  sector?: string | null;
  kyb_status: AdminEnterpriseKybStatus;
  created_at: string;
}

export interface AdminEnterprisePersonDto {
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
}

export interface AdminEnterpriseKybStageDto {
  stage: string;
  status: string;
  enabled: boolean;
  updated_at: string;
}

export interface AdminEnterpriseTimelineItemDto {
  event_type: string;
  actor_id?: string | null;
  created_at: string;
  details?: Record<string, unknown>;
}

export interface AdminEnterpriseSubEnterpriseDto {
  sub_enterprise_id: string;
  business_name: string;
  company_code: string;
  document_number: string;
  status: string;
  created_at: string;
}

export interface AdminEnterpriseUserDto {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface AdminEnterpriseDetailDto {
  enterprise_id: string;
  business_name: string;
  document_type: string;
  document_number: string;
  email: string;
  phone: string;
  economic_sector_id?: string | null;
  sector?: string | null;
  is_payroll_provider?: boolean;
  status: AdminEnterpriseKybStatus;
  created_at: string;
  principal?: AdminEnterprisePersonDto | null;
  admin?: AdminEnterprisePersonDto | null;
  kyb_stages: AdminEnterpriseKybStageDto[];
  kyb_timeline: AdminEnterpriseTimelineItemDto[];
  sub_enterprises: AdminEnterpriseSubEnterpriseDto[];
  users: AdminEnterpriseUserDto[];
}

export interface AdminPatchEnterpriseKybRequest {
  action: 'approve' | 'reject';
  reason?: string | null;
}

export interface AdminEnterprisesListParams {
  search?: string;
  status?: AdminEnterpriseKybStatus;
  cursor?: string;
  limit?: number;
}

export type AdminCreateUserEnvelope = ApiEnvelope<AdminCreateUserResponse>;
export type AdminCreateEnterpriseEnvelope = ApiEnvelope<AdminCreateEnterpriseResponse>;
export type AdminEnterprisesListEnvelope = ApiEnvelope<AdminEnterpriseSummaryDto[]>;
export type AdminEnterpriseDetailEnvelope = ApiEnvelope<AdminEnterpriseDetailDto>;

export interface AdminEconomicSectorDto {
  sector_id: string;
  code: string;
  label_es: string;
  category: string;
  ui_sort_order: number;
  is_active: boolean;
  allows_payroll_advance: boolean;
}

export interface AdminPatchEconomicSectorRequest {
  label_es?: string | null;
  category?: string | null;
  ui_sort_order?: number | null;
  is_active?: boolean | null;
  allows_payroll_advance?: boolean | null;
}

export type AdminEconomicSectorsListEnvelope = ApiEnvelope<AdminEconomicSectorDto[]>;
export type AdminEconomicSectorEnvelope = ApiEnvelope<AdminEconomicSectorDto>;
