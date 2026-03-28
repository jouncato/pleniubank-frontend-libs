import { ApiEnvelope } from 'shared-http';
import { EnterpriseDocumentType } from './identity-enterprise';

/** Roles permitidos en `POST /api/v1/admin/users` (Identity `UserRole`). */
export type AdminCreateUserRole =
  | 'customer'
  | 'employee'
  | 'admin'
  | 'enterprise_principal'
  | 'enterprise_admin'
  | 'enterprise_operator';

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
  role: string;
  status: 'active' | 'inactive';
  created_at: string;
  enterprise_id?: string | null;
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
  role: string;
  status: 'active' | 'inactive';
  enterprise_id?: string | null;
  customer_id?: string | null;
  two_factor_enabled: boolean;
  identity_verified: boolean;
  created_at: string;
  recent_activity: AdminUserActivityItem[];
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

export type AdminCreateUserEnvelope = ApiEnvelope<AdminCreateUserResponse>;
export type AdminCreateEnterpriseEnvelope = ApiEnvelope<AdminCreateEnterpriseResponse>;
