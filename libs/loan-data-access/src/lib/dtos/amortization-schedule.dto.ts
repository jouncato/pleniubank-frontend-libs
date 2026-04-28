export interface GenerateScheduleRequest {
  amortization_type: string;
  force?: boolean;
}

export interface AmortizationScheduleResponse {
  id: string;
  version: number;
  is_active: boolean;
  valid_from: string;
  valid_to?: string;
  lending_arrangement_id?: string;
  generated_for_version: number;
  amortization_type: string;
  num_cuota: number;
  fecha_vencimiento: string;
  capital: string;
  interes: string;
  late_fee: string;
  saldo_insoluto: string;
  status: string;
  fecha_pago?: string;
  paid_capital: string;
  paid_interest: string;
  paid_late_fee: string;
  paid_total: string;
  payment_applied_at?: string;
  payment_reference?: string;
  correlation_id?: string;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
}
