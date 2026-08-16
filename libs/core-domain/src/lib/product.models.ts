/** Tipos de producto alineados con Core `ProductType` (StrEnum). */

export const PRODUCT_TYPES = [
  'PAYROLL_ADVANCE',
  'LIBRANZA',
  'CREDIT_CARD',
  'SAVINGS_ACCOUNT',
  'CHECKING_ACCOUNT',
  'TERM_DEPOSIT',
  'PERSONAL_LOAN',
  'MORTGAGE',
  'VEHICLE_LOAN',
] as const;

export type ProductTypeCode = (typeof PRODUCT_TYPES)[number];

/** Product types that are retained for compatibility but not available for new use. */
export const DISABLED_PRODUCT_TYPES: ReadonlySet<string> = new Set(['LIBRANZA', 'PAYROLL_DEDUCTION']);

/** Product types currently exposed to originations and product selectors. */
export const ACTIVE_PRODUCT_TYPES = PRODUCT_TYPES.filter(
  (type) => !DISABLED_PRODUCT_TYPES.has(type),
);

export function isProductTypeActive(type: string | null | undefined): boolean {
  return type == null || !DISABLED_PRODUCT_TYPES.has(type.trim().toUpperCase());
}

/** Respuesta `ProductResponse` en Core. */
export interface ProductDto {
  id: string;
  version: number;
  is_active: boolean;
  valid_from: string;
  valid_to: string | null;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  name: string;
  code: string;
  description: string | null;
  product_type: ProductTypeCode | string;
  template_parameters: Record<string, unknown>;
}

/** Body `POST /api/v1/products` — `ProductCreate` en Core. */
export interface CreateProductRequest {
  name: string;
  product_type: ProductTypeCode | string;
  description?: string | null;
  template_parameters?: Record<string, unknown>;
}

/** Respuesta de `PUT /products/{id}/activate`. */
export interface ProductActivateResultDto {
  id: string;
  is_active: boolean;
}
