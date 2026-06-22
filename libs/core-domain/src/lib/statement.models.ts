/** Pleniu Colombia S.A. — Statement (Extracto) domain models.
 *
 * Synchronised with `src/api/v1/schemas/statement_schemas.py` in pleniubank-core.
 */

export interface StatementSummary {
  date_from: string;
  date_to: string;
  opening_balance: string;
  closing_balance: string;
  total_debits: string;
  total_credits: string;
  entry_count: number;
  currency: string;
}

export interface StatementEntry {
  entry_id: string;
  entry_date: string;
  value_date: string | null;
  concept: string;
  reference: string | null;
  debit: string | null;
  credit: string | null;
  running_balance: string;
  currency: string;
  product_type: string | null;
  product_code: string | null;
  status: string;
  metadata: Record<string, unknown>;
}

export interface StatementResponse {
  customer_id: string;
  account_id: string | null;
  product_type: string | null;
  summary: StatementSummary;
  entries: StatementEntry[];
}

export interface StatementFilters {
  account_id: string;
  date_from?: string;
  date_to?: string;
  product_type?: string;
  limit?: number;
}
