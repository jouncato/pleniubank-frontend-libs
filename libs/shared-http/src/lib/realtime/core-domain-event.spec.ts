import { isCoreLoanStatusEvent, parseCoreWsPayload } from './core-domain-event';

describe('parseCoreWsPayload', () => {
  it('parses batch.status_changed', () => {
    const raw = JSON.stringify({
      type: 'batch.status_changed',
      resource: 'posting_batch',
      batch_id: 'b1',
      status: 'RELEASED',
      occurred_at: '2026-01-01T00:00:00Z',
      client_batch_id: 'cb-1',
    });
    const e = parseCoreWsPayload(raw);
    expect(e?.type).toBe('batch.status_changed');
    if (e && e.type === 'batch.status_changed') {
      expect(e.batch_id).toBe('b1');
      expect(e.status).toBe('RELEASED');
    }
  });

  it('parses loan.status_changed', () => {
    const raw = JSON.stringify({
      type: 'loan.status_changed',
      resource: 'loan',
      loan_id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'ACTIVE',
      occurred_at: '2026-01-01T00:00:00Z',
    });
    const e = parseCoreWsPayload(raw);
    expect(isCoreLoanStatusEvent(e)).toBe(true);
    if (e && isCoreLoanStatusEvent(e)) {
      expect(e.loan_id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(e.status).toBe('ACTIVE');
    }
  });

  it('returns null for unknown type', () => {
    expect(parseCoreWsPayload(JSON.stringify({ type: 'unknown' }))).toBeNull();
  });
});
