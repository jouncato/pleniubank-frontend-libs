/** Tipos alineados con Core `LoanResponse` / préstamos (PayrollAdvance). */

export interface LoanDto {
  id: string;
  version: number;
  account_id: string;
  product_id: string;
  contract_version_id: string | null;
  customer_id: string;
  employer_id: string;
  amount: string;
  denomination: string;
  status: string;
  instance_parameters: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateLoanRequest {
  customer_id: string;
  employer_id: string;
  account_id: string;
  product_id: string;
  amount: string;
  denomination: string;
  instance_parameters: Record<string, unknown>;
}

export interface UpdateLoanRequest {
  version: number;
  amount?: string;
  denomination?: string;
  instance_parameters?: Record<string, unknown>;
}

export interface PaymentLineDto {
  posting_id: string;
  amount: string;
  denomination: string;
  balance_address: string;
  phase: string;
  booking_timestamp: string;
  type: string;
}

export interface SimulateLoanRequest {
  contract_type: string;
  contract_id?: string | null;
  parameters?: Record<string, unknown>;
}

export interface SimulatedInstallmentDto {
  [key: string]: unknown;
}

export interface SimulateLoanResponse {
  installments: SimulatedInstallmentDto[];
  total_interest: string | number | null;
  total_cost: string | number | null;
  schedule: Record<string, unknown>;
}
