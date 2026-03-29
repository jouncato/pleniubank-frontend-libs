import { isValidReturnUrl } from './return-url';

describe('isValidReturnUrl', () => {
  it('acepta rutas internas de app', () => {
    expect(isValidReturnUrl('/app/accounts/list')).toBe(true);
    expect(isValidReturnUrl('/app/accounts/list?tab=balances')).toBe(true);
  });

  it('acepta rutas internas de admin', () => {
    expect(isValidReturnUrl('/admin/health')).toBe(true);
    expect(isValidReturnUrl('/admin/health?verbose=true')).toBe(true);
  });

  it('rechaza urls externas absolutas', () => {
    expect(isValidReturnUrl('https://evil.com/steal')).toBe(false);
    expect(isValidReturnUrl('http://evil.com')).toBe(false);
  });

  it('rechaza esquemas peligrosos', () => {
    expect(isValidReturnUrl('javascript:alert(1)')).toBe(false);
    expect(isValidReturnUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rechaza protocol-relative y rutas fuera de allowlist', () => {
    expect(isValidReturnUrl('//evil.com/path')).toBe(false);
    expect(isValidReturnUrl('/onboarding/party/access/login')).toBe(false);
  });

  it('rechaza valores vacíos o nulos', () => {
    expect(isValidReturnUrl(undefined)).toBe(false);
    expect(isValidReturnUrl(null)).toBe(false);
    expect(isValidReturnUrl('')).toBe(false);
    expect(isValidReturnUrl('   ')).toBe(false);
  });
});
