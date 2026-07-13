import {
  DEFAULT_TENANT,
  SUPPORTED_TENANTS,
  isSupportedTenant,
} from './tenant-country.types';

describe('tenant-country.types', () => {
  it('SUPPORTED_TENANTS incluye CO y MX', () => {
    expect(SUPPORTED_TENANTS).toContain('CO');
    expect(SUPPORTED_TENANTS).toContain('MX');
  });

  it('DEFAULT_TENANT es CO', () => {
    expect(DEFAULT_TENANT).toBe('CO');
  });

  it("isSupportedTenant('CO') es verdadero", () => {
    expect(isSupportedTenant('CO')).toBe(true);
  });

  it("isSupportedTenant('MX') es verdadero", () => {
    expect(isSupportedTenant('MX')).toBe(true);
  });

  it("isSupportedTenant('PE') (no soportado) es falso", () => {
    expect(isSupportedTenant('PE')).toBe(false);
  });

  it('isSupportedTenant(null) es falso', () => {
    expect(isSupportedTenant(null)).toBe(false);
  });

  it('isSupportedTenant(undefined) es falso', () => {
    expect(isSupportedTenant(undefined)).toBe(false);
  });

  it("isSupportedTenant('') es falso", () => {
    expect(isSupportedTenant('')).toBe(false);
  });

  it('isSupportedTenant es case-sensitive (rechaza minúsculas)', () => {
    expect(isSupportedTenant('co')).toBe(false);
  });
});
