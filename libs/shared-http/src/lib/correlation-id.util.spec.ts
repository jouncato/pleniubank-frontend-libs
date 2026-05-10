import { describe, expect, it, vi } from 'vitest';
import { createCorrelationId } from './correlation-id.util';

describe('createCorrelationId()', () => {
  it('returns a non-empty string', () => {
    expect(createCorrelationId().length).toBeGreaterThan(0);
  });

  it('returns unique values on successive calls', () => {
    const id1 = createCorrelationId();
    const id2 = createCorrelationId();
    expect(id1).not.toBe(id2);
  });

  it('returns a UUID when crypto.randomUUID is available', () => {
    const id = createCorrelationId();
    // UUID v4 format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuidPattern.test(id)).toBe(true);
  });

  it('falls back to timestamp-random format when crypto.randomUUID is not available', () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      value: { ...originalCrypto, randomUUID: undefined },
      configurable: true,
    });

    try {
      const id = createCorrelationId();
      expect(id.length).toBeGreaterThan(0);
      // fallback format: `${Date.now()}-${Math.random().toString(16).slice(2)}`
      expect(id).toMatch(/^\d+-[0-9a-f]+$/);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true,
      });
    }
  });
});
