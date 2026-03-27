/** Tipos alineados a Core `posting_schemas.py` y respuestas de postings. */

export interface PostingInstructionRequest {
  debit_account_id: string;
  credit_account_id: string;
  /** Monto > 0; Core usa Decimal (JSON como string recomendado). */
  amount: string;
  denomination?: string;
  balance_address?: string;
}

export interface AuthorizeRequest {
  account_id: string;
  amount: string;
  denomination?: string;
  metadata?: Record<string, unknown>;
}

export interface SettleRequest {
  /** En Core es el batch_id de la autorización. */
  authorization_id: string;
  amount?: string | null;
}

export interface ReleaseRequest {
  authorization_id: string;
}

export interface CustomPostingRequest {
  instructions: PostingInstructionRequest[];
}

export interface BatchRequest {
  client_batch_id: string;
  instructions: PostingInstructionRequest[];
  metadata?: Record<string, unknown>;
}

export interface PostingResponse {
  batch_id: string;
  status: string;
  amount: string | number;
  denomination: string;
  phase: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface BatchResponse {
  batch_id: string;
  client_batch_id: string;
  status: string;
  instruction_count: number;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface PostingDetail {
  account_id: string;
  debit_account_id: string | null;
  credit_account_id: string | null;
  amount: string | number;
  denomination: string;
  balance_address: string;
  phase: string;
}

export interface BatchDetailResponse extends BatchResponse {
  instructions: PostingDetail[];
}
