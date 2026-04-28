export interface DisburseRequest {
  amount: string;
  currency: string;
  disbursement_account_id: string;
}

export interface ApplyPaymentRequest {
  amount: string;
  currency: string;
  payment_date: string;
  source: string;
  reference?: string;
}

export interface PaymentDto {
  id: string;
  arrangement_id: string;
  amount: string;
  currency: string;
  payment_date: string;
  source: string;
  reference?: string;
  status: string;
  applied_at: string;
  created_by: string;
}
