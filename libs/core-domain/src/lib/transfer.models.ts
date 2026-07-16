/** Pleniu Colombia S.A. — B2C wallet transfer domain models.
 *
 * Synchronised with `src/api/v1/schemas/transfer_schemas.py` in pleniubank-core
 * (`b2c-transfers` capability, openspec change `b2c-persona-closure`).
 * Covers only internal wallet-first movement (own-account and P2P between
 * PleniuBank customers). External destinations (Bre-B/ACH withdrawal) are
 * explicitly out of scope — the backend rejects `external_account_id` with
 * `EXTERNAL_DESTINATION_NOT_SUPPORTED`; the frontend never sends it.
 *
 * Note: there is no dedicated "resolve destination" preview endpoint — a
 * Bre-B key is resolved server-side only as part of `POST /transfers`.
 */

/** Alineado con el `key_type` de `party.customer_breb_keys` (Core). */
export type TransferKeyType = 'CEDULA' | 'CELULAR' | 'EMAIL';

/**
 * Exactamente uno de `account_id` o (`key_type` + `key_value`) debe estar
 * presente (validado server-side).
 */
export interface TransferDestinationRequest {
  account_id?: string;
  key_type?: TransferKeyType;
  key_value?: string;
}

export interface CreateTransferRequest {
  source_account_id: string;
  destination: TransferDestinationRequest;
  /** Monto como string decimal (evita errores de coma flotante en dinero). */
  amount: string;
  currency?: string;
}

/** `TransferResponse` (Core). */
export interface Transfer {
  id: string;
  source_account_id: string;
  destination_account_id: string;
  source_customer_id: string;
  destination_customer_id: string;
  amount: string;
  currency: string;
  status: string;
  posting_batch_id: string | null;
  created_at: string;
}

export interface TransferListFilters {
  account_id?: string;
  date_from?: string;
  date_to?: string;
  /** Cursor = `created_at` ISO del último elemento visible (no opaco). */
  cursor?: string;
  limit?: number;
}
