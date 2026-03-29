import type { PaymentHubPaymentStatus } from './payment.models';

describe('paymenthub-domain', () => {
  it('exporta tipos compilables', () => {
    const s: PaymentHubPaymentStatus = 'PENDING';
    expect(s).toBe('PENDING');
  });
});
