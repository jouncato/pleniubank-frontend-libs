/** Respuesta mínima de Core `GET /customers` y `GET /customers/{id}`. */

export interface CustomerDto {
  id: string;
  version_id: string;
  version: number;
  is_active: boolean;
  valid_from: string;
  valid_to: string | null;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  full_name: string;
  document_type: string;
  document_number: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

/** Body `POST /api/v1/customers` — alineado con `CustomerCreate` en Core. */
export interface CreateCustomerRequest {
  full_name: string;
  document_type: string;
  document_number: string;
  customer_id?: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

/** Body `PUT /api/v1/customers/{id}` — alineado con `CustomerUpdate` en Core. */
export interface UpdateCustomerRequest {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}
