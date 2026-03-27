import { AuthFeature } from './identity-feature-auth';

describe('identity-feature-auth types', () => {
  it('supports login feature id', () => {
    const feature: AuthFeature = 'login';
    expect(feature).toBe('login');
  });
});
