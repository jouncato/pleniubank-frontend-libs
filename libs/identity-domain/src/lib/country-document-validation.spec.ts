import { normalizeCountryDocument, validateCountryDocument } from './country-document-validation';

describe('country document validation', () => {
  it('normalizes separators and casing', () => {
    expect(normalizeCountryDocument(' 900.123-456 ')).toBe('900123456');
    expect(normalizeCountryDocument('ab 123')).toBe('AB123');
  });

  it.each([
    ['CO', 'NIT', '900123456'],
    ['CO', 'CC', '123456789'],
    ['MX', 'CURP', 'GODE561231HDFRRN09'],
    ['MX', 'RFC', 'XAXX010101000'],
    ['PE', 'DNI', '12345678'],
    ['PE', 'RUC', '20123456789'],
    ['BR', 'CPF', '12345678901'],
    ['BR', 'CNPJ', '12345678000199'],
    ['AR', 'CUIT', '20123456789'],
    ['ES', 'DNI', '12345678Z'],
    ['ES', 'NIE', 'X1234567L'],
  ] as const)('accepts valid %s %s values', (country, documentType, documentNumber) => {
    expect(validateCountryDocument({ country, documentType, documentNumber })).toEqual({
      valid: true,
      error: null,
    });
  });

  it('returns structured errors without UI copy', () => {
    expect(validateCountryDocument({ country: 'CO', documentType: 'NIT', documentNumber: 'abc' })).toEqual({
      valid: false,
      error: 'invalid_format',
    });
    expect(validateCountryDocument({ country: 'MX', documentType: 'NIT', documentNumber: '900123456' })).toEqual({
      valid: false,
      error: 'unsupported_document_type',
    });
  });
});
