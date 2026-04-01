/** Eventos JSON emitidos por Core `/ws/events` (FE-NOTIFY-001). */

export interface CoreBatchStatusEvent {
  type: 'batch.status_changed';
  resource: 'posting_batch';
  event_subtype?: string;
  batch_id: string;
  status: string;
  client_batch_id?: string;
  occurred_at: string;
  toast?: { message: string; variant?: 'success' | 'info' };
  path?: string;
}

export interface CoreLoanStatusEvent {
  type: 'loan.status_changed';
  resource: 'loan';
  loan_id: string;
  status: string;
  occurred_at: string;
  toast?: { message: string; variant?: 'success' | 'info' };
  path?: string;
}

export type CoreWsControlEvent =
  | { type: 'heartbeat'; occurred_at?: string }
  | {
      type: 'connected';
      occurred_at?: string;
      user_id?: string;
      enterprise_id?: string | null;
    }
  | { type: 'pong'; occurred_at?: string };

export type CoreDomainEvent = CoreBatchStatusEvent | CoreLoanStatusEvent | CoreWsControlEvent;

export function isCoreBatchStatusEvent(e: CoreDomainEvent | null): e is CoreBatchStatusEvent {
  return (
    e !== null &&
    e.type === 'batch.status_changed' &&
    (e as CoreBatchStatusEvent).resource === 'posting_batch'
  );
}

export function isCoreLoanStatusEvent(e: CoreDomainEvent | null): e is CoreLoanStatusEvent {
  return (
    e !== null &&
    e.type === 'loan.status_changed' &&
    (e as CoreLoanStatusEvent).resource === 'loan'
  );
}

export function parseCoreWsPayload(raw: string): CoreDomainEvent | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const type = o['type'];
    if (type === 'heartbeat') {
      return { type: 'heartbeat', occurred_at: o['occurred_at'] as string | undefined };
    }
    if (type === 'connected') {
      return {
        type: 'connected',
        occurred_at: o['occurred_at'] as string | undefined,
        user_id: o['user_id'] as string | undefined,
        enterprise_id: (o['enterprise_id'] as string | null | undefined) ?? null,
      };
    }
    if (type === 'pong') {
      return { type: 'pong', occurred_at: o['occurred_at'] as string | undefined };
    }
    if (type === 'batch.status_changed' && o['resource'] === 'posting_batch') {
      return {
        type: 'batch.status_changed',
        resource: 'posting_batch',
        event_subtype: o['event_subtype'] as string | undefined,
        batch_id: String(o['batch_id'] ?? ''),
        status: String(o['status'] ?? ''),
        client_batch_id: o['client_batch_id'] as string | undefined,
        occurred_at: String(o['occurred_at'] ?? ''),
        toast: o['toast'] as CoreBatchStatusEvent['toast'] | undefined,
        path: o['path'] as string | undefined,
      };
    }
    if (type === 'loan.status_changed' && o['resource'] === 'loan') {
      return {
        type: 'loan.status_changed',
        resource: 'loan',
        loan_id: String(o['loan_id'] ?? ''),
        status: String(o['status'] ?? ''),
        occurred_at: String(o['occurred_at'] ?? ''),
        toast: o['toast'] as CoreLoanStatusEvent['toast'] | undefined,
        path: o['path'] as string | undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}
