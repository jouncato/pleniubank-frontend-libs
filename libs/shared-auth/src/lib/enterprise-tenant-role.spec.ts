import { describe, expect, it } from 'vitest';
import { isEnterpriseAdministratorRole, isEnterprisePrincipalRole } from './enterprise-tenant-role';

describe('isEnterprisePrincipalRole()', () => {
  it('returns true for enterprise_principal', () => {
    expect(isEnterprisePrincipalRole('enterprise_principal')).toBe(true);
  });

  it('returns false for enterprise_admin', () => {
    expect(isEnterprisePrincipalRole('enterprise_admin')).toBe(false);
  });

  it('returns false for customer role', () => {
    expect(isEnterprisePrincipalRole('customer')).toBe(false);
  });

  it('returns false for admin role', () => {
    expect(isEnterprisePrincipalRole('admin')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isEnterprisePrincipalRole(undefined)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isEnterprisePrincipalRole(null)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isEnterprisePrincipalRole('')).toBe(false);
  });
});

describe('isEnterpriseAdministratorRole()', () => {
  it('returns true for enterprise_admin', () => {
    expect(isEnterpriseAdministratorRole('enterprise_admin')).toBe(true);
  });

  it('returns false for enterprise_principal', () => {
    expect(isEnterpriseAdministratorRole('enterprise_principal')).toBe(false);
  });

  it('returns false for customer role', () => {
    expect(isEnterpriseAdministratorRole('customer')).toBe(false);
  });

  it('returns false for admin role', () => {
    expect(isEnterpriseAdministratorRole('admin')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isEnterpriseAdministratorRole(undefined)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isEnterpriseAdministratorRole(null)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isEnterpriseAdministratorRole('')).toBe(false);
  });
});
