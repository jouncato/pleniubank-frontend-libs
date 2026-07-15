/** Pleniu Colombia S.A. — B2C wallet transfer domain models.
 *
 * Synchronised with the `b2c-transfers` capability
 * (`pleniubank-core` openspec change `b2c-persona-closure`).
 * Covers only internal wallet-first movement (own-account and P2P
 * between PleniuBank customers). External destinations (Bre-B/ACH
 * withdrawal) are explicitly out of scope — see `EXTERNAL_DESTINATION_NOT_SUPPORTED`.
 */

export type TransferDirection = 'SENT' | 'RECEIVED';

export type TransferStatus = 'COMPLETED' | 'FAILED';

/** Alineado con el `key_type` de `party.customer_breb_keys` (Core). */
export type TransferKeyType = 'CEDULA' | 'CELULAR' | 'EMAIL';

export interface TransferDestinationAccount {
  type: 'account';
  account_id: string;
}

export interface TransferDestinationKey {
  type: 'breb_key';
  key_type: TransferKeyType;
  key_value: string;
}

export type TransferDestinationRequest = TransferDestinationAccount | TransferDestinationKey;

export interface CreateTransferRequest {
  source_account_id: string;
  destination: TransferDestinationRequest;
  /** Monto como string decimal (mismo patrón que `AccountDto`/postings). */
  amount: string;
  currency?: string;
}

export interface Transfer {
  id: string;
  source_account_id: string;
  destination_account_id: string;
  amount: string;
  currency: string;
  status: TransferStatus;
  direction: TransferDirection;
  counterparty_masked_name: string | null;
  initiated_by: string;
  country_code: string;
  created_at: string;
}

export interface TransferListFilters {
  account_id?: string;
  date_from?: string;
  date_to?: string;
  direction?: TransferDirection;
  cursor?: string;
  limit?: number;
}

export interface TransferListResponse {
  items: Transfer[];
  next_cursor: string | null;
}

/** Resultado de resolver una llave Bre-B local (HMAC) como destino. Solo llaves verificadas. */
export interface ResolvedTransferDestination {
  account_id: string;
  masked_holder_name: string;
}
