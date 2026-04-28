import { describe, expect, it } from 'vitest';
import { isValidJurisdiction } from './jurisdiction';

describe('isValidJurisdiction()', () => {
  const valid = ['CO', 'MX', 'PE', 'US', 'BR', 'CO-ANT', 'US-CA', 'GB-ENG'];

  it.each(valid)('should accept "%s"', (code) => {
    expect(isValidJurisdiction(code)).toBe(true);
  });

  const invalid = [
    '',
    'C',
    'col',
    'co',
    'COL',
    '12',
    'CO-',
    'CO-ANTIOQUIA',
    'CO ANT',
    'CO_ANT',
  ];

  it.each(invalid)('should reject "%s"', (code) => {
    expect(isValidJurisdiction(code)).toBe(false);
  });
});
