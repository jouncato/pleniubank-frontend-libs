import { describe, expect, it } from 'vitest';
import { signInPathForPortal } from './sign-in-path';
import type { PortalAppKind } from './portal-app.token';

describe('signInPathForPortal()', () => {
  it('returns backoffice login path for backoffice portal', () => {
    const path = signInPathForPortal('backoffice' as PortalAppKind);
    expect(path).toBe('/backoffice/party/access/login');
  });

  it('returns onboarding login path for customer portal', () => {
    const path = signInPathForPortal('customer' as PortalAppKind);
    expect(path).toBe('/onboarding/party/access/login');
  });

  it('returns onboarding login path for public portal', () => {
    const path = signInPathForPortal('public' as PortalAppKind);
    expect(path).toBe('/onboarding/party/access/login');
  });
});
