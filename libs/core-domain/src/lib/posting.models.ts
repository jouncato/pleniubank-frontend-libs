/** Tipos alineados a Core `posting_schemas.py` y respuestas de postings. */
export type PostingStatus = 'PENDING' | 'COMMITTED' | 'REJECTED' | 'RELEASED';

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
  reason?: string;
}

export interface CustomPostingRequest {
  client_batch_id: string;
  instructions: PostingInstructionRequest[];
}

export interface BatchRequest {
  client_batch_id: string;
  instructions: PostingInstructionRequest[];
  metadata?: Record<string, unknown>;
}

export interface PostingResponse {
  batch_id: string;
  status: PostingStatus | string;
  amount: string | number;
  denomination: string;
  phase: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface BatchResponse {
  batch_id: string;
  client_batch_id: string;
  status: PostingStatus | string;
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

export interface PostingFilters {
  status?: PostingStatus;
  page: number;
  size: number;
}

export interface PostingListResponse {
  items: BatchResponse[];
  total: number;
  page: number;
  size: number;
  next_cursor?: string;
}

export interface TimelineStep {
  label: string;
  timestamp?: string;
  status: 'completed' | 'active' | 'pending' | 'error';
  icon: 'check' | 'clock' | 'undo' | 'x';
  detail?: string;
}

export interface TransactionTimelineData {
  steps: TimelineStep[];
}

export function buildTimelineFromPosting(posting: PostingResponse): TransactionTimelineData {
  const steps: TimelineStep[] = [
    {
      label: 'Autorizada',
      timestamp: posting.created_at,
      status: 'completed',
      icon: 'check',
    },
  ];
  const metadata = posting.metadata ?? {};
  switch (posting.status) {
    case 'COMMITTED':
      steps.push({
        label: 'Liquidada',
        timestamp: String(metadata['settled_at'] ?? ''),
        status: 'completed',
        icon: 'check',
      });
      break;
    case 'RELEASED':
      steps.push({
        label: 'Liberada',
        timestamp: String(metadata['released_at'] ?? ''),
        status: 'completed',
        icon: 'undo',
        detail: metadata['release_reason'] ? `Motivo: ${String(metadata['release_reason'])}` : undefined,
      });
      break;
    case 'REJECTED':
      steps.push({
        label: 'Rechazada',
        timestamp: String(metadata['rejected_at'] ?? ''),
        status: 'error',
        icon: 'x',
      });
      break;
    default:
      steps.push({
        label: 'En espera de liquidacion',
        status: 'pending',
        icon: 'clock',
      });
  }
  return { steps };
}
