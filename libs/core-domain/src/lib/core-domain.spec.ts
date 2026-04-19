import type { CreateAccountRequest } from './account.models';

describe('core-domain', () => {
  it('exporta tipos compilables', () => {
    const req: CreateAccountRequest = {
      customer_id: 'c1',
      product_id: 'p1',
    };
    expect(req.customer_id).toBe('c1');
  });
});
