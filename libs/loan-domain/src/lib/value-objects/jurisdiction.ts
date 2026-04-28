const JURISDICTION_RE = /^[A-Z]{2}(-[A-Z0-9]{1,3})?$/;

export function isValidJurisdiction(value: string): boolean {
  return JURISDICTION_RE.test(value);
}
