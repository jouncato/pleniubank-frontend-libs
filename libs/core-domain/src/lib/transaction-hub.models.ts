/** Tipos alineados a Core `transaction_hub_schemas.py` y respuestas del Hub Transaccional. */

/** Sistema origen que generó la transacción. */
export type SourceSystem = 'CORE_ACCOUNT' | 'CORE_LENDING' | 'PAYMENTHUB' | 'RULES_ENGINE';

/** Dominio de negocio al que pertenece la transacción. */
export type TransactionDomain = 'ACCOUNT' | 'LENDING' | 'PAYMENT' | 'RULES' | 'CUSTOMER';

/** Tipo de transacción normalizado cross-domain. */
export type TransactionType = 'POSTING_BATCH' | 'PAYMENT' | 'TRANSFER' | 'DISBURSEMENT' | 'REPAYMENT' | 'REVERSAL' | 'FEE' | 'EVALUATION';

/** Estado normalizado del Hub (cross-domain). Usar este para renderizar UI. */
export type HubStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'UNKNOWN';

/** Evento individual en la línea de tiempo de una transacción. */
export interface TimelineEvent {
  timestamp: string;
  event_type: string;
  description?: string;
  source?: string;
}

/** Resumen canónico de una transacción (listado). */
export interface TransactionSummary {
  transaction_id: string;
  source_system: SourceSystem;
  source_entity_id: string;
  domain: TransactionDomain;
  transaction_type: TransactionType;
  /** Estado normalizado cross-domain. Usar para UI. */
  status: HubStatus;
  /** Estado original sin modificar del sistema origen. */
  source_status: string;
  amount: string | null;
  currency: string | null;
  principal_party_id: string | null;
  counterparty_id: string | null;
  product_code: string | null;
  product_type: string | null;
  created_at: string;
  updated_at: string | null;
  correlation_id: string | null;
  metadata: Record<string, unknown>;
}

/** Respuesta del endpoint de detalle (incluye timeline). */
export interface TransactionDetailResponse extends TransactionSummary {
  timeline: TimelineEvent[];
}

/** Payload de respuesta del endpoint de listado. */
export interface TransactionHubListResponse {
  items: TransactionSummary[];
  /** Errores por fuente cuando ocurre degradación parcial. */
  source_errors: Record<string, string>;
  /** True cuando al menos una fuente falló pero otras contribuyeron datos. */
  partial: boolean;
}

/** Filtros tipados para el endpoint de listado. */
export interface TransactionHubFilters {
  domain?: TransactionDomain[];
  source_system?: SourceSystem[];
  transaction_type?: TransactionType[];
  status?: HubStatus[];
  product_type?: string;
  product_code?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: string;
  max_amount?: string;
  currency?: string;
  correlation_id?: string;
  /** Cursor opaco de la página anterior. */
  cursor?: string;
  /** Tamaño de página (1–100). Default 20. */
  limit?: number;
}
