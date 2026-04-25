export type SupportedCountryCode = 'CO' | 'MX' | 'PE' | 'BR' | 'AR' | 'ES';

export type CountryDocumentType =
  | 'CC'
  | 'CE'
  | 'NIT'
  | 'PP'
  | 'TI'
  | 'CURP'
  | 'RFC'
  | 'DNI'
  | 'RUC'
  | 'CPF'
  | 'CNPJ'
  | 'CUIT'
  | 'NIE'
  | 'NIF';

export type CountryDocumentValidationError =
  | 'required'
  | 'unsupported_country'
  | 'unsupported_document_type'
  | 'invalid_format';

export interface CountryDocumentValidationInput {
  country: SupportedCountryCode;
  documentType: CountryDocumentType;
  documentNumber: string | null | undefined;
}

export interface CountryDocumentValidationResult {
  valid: boolean;
  error: CountryDocumentValidationError | null;
}

const DOCUMENT_PATTERNS: Record<SupportedCountryCode, Partial<Record<CountryDocumentType, RegExp>>> = {
  CO: {
    CC: /^\d{5,12}$/,
    CE: /^[A-Z0-9]{5,12}$/,
    TI: /^\d{5,12}$/,
    NIT: /^\d{9,10}$/,
    PP: /^[A-Z0-9]{5,16}$/,
  },
  MX: {
    CURP: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/,
    RFC: /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/,
    PP: /^[A-Z0-9]{5,16}$/,
  },
  PE: {
    DNI: /^\d{8}$/,
    RUC: /^\d{11}$/,
    CE: /^[A-Z0-9]{9,12}$/,
    PP: /^[A-Z0-9]{5,16}$/,
  },
  BR: {
    CPF: /^\d{11}$/,
    CNPJ: /^\d{14}$/,
    PP: /^[A-Z0-9]{5,16}$/,
  },
  AR: {
    DNI: /^\d{7,8}$/,
    CUIT: /^\d{11}$/,
    PP: /^[A-Z0-9]{5,16}$/,
  },
  ES: {
    DNI: /^\d{8}[A-Z]$/,
    NIE: /^[XYZ]\d{7}[A-Z]$/,
    NIF: /^[A-Z]\d{7}[A-Z0-9]$/,
    PP: /^[A-Z0-9]{5,16}$/,
  },
};

export function normalizeCountryDocument(value: string): string {
  return value.trim().toUpperCase().replace(/[\s.-]/g, '');
}

export function validateCountryDocument(
  input: CountryDocumentValidationInput,
): CountryDocumentValidationResult {
  const normalized = normalizeCountryDocument(input.documentNumber ?? '');
  if (!normalized) {
    return { valid: false, error: 'required' };
  }

  const countryRules = DOCUMENT_PATTERNS[input.country];
  if (!countryRules) {
    return { valid: false, error: 'unsupported_country' };
  }

  const pattern = countryRules[input.documentType];
  if (!pattern) {
    return { valid: false, error: 'unsupported_document_type' };
  }

  return pattern.test(normalized)
    ? { valid: true, error: null }
    : { valid: false, error: 'invalid_format' };
}
