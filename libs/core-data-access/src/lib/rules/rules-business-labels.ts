/**
 * Etiquetas de negocio para el backoffice de reglas (sin exponer URLs).
 * Alineado con ProductType del Core y rulesets sembrados en Alembic.
 */

/** Uso funcional del ruleset en PleniuBank Core / operación. */
export const RULESET_USAGE_PLAIN: Record<string, string> = {
  CREDIT_APPROVAL:
    'Pre-aprobación de crédito: el Core invoca el motor cuando un cliente autenticado solicita evaluación de una solicitud.',
  TRANSACTION_FRAUD:
    'Antifraude en transacciones: el Core evalúa este conjunto durante la autorización de reservas de saldo (postings).',
  PAYMENT_LIMITS:
    'Límites de pago y transferencias: disponible para evaluaciones de contexto de pago según configuración del Core.',
  PAYROLL_ADVANCE_POSTING:
    'Reglas de contexto para anticipo de nómina (alineadas con contratos de producto payroll).',
  LIBRANZA_POSTING:
    'Reglas de contexto para crédito libranza (alineadas con contratos de producto libranza).',
};

const DOMAIN_LABELS: Record<string, string> = {
  CREDIT: 'Crédito',
  FRAUD: 'Antifraude y riesgo',
  PAYMENT: 'Pagos y límites',
  OPERATIONS: 'Operaciones y producto',
  TRANSACTION: 'Transacciones',
};

/** Etiqueta legible para `rulesets.domain` (fallback al valor crudo). */
export function domainLabel(domain: string): string {
  const d = domain.trim().toUpperCase();
  return DOMAIN_LABELS[d] ?? domain;
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  PAYROLL_ADVANCE: 'Anticipo de nómina',
  LIBRANZA: 'Libranza',
  CREDIT_CARD: 'Tarjeta de crédito',
  SAVINGS_ACCOUNT: 'Cuenta de ahorros',
  CHECKING_ACCOUNT: 'Cuenta corriente',
  TERM_DEPOSIT: 'Depósito a término',
  PERSONAL_LOAN: 'Crédito personal',
  MORTGAGE: 'Crédito hipotecario',
  VEHICLE_LOAN: 'Crédito vehicular',
};

export function productTypeLabel(code: string): string {
  return PRODUCT_TYPE_LABELS[code] ?? code;
}

/** Opciones ordenadas para selectores de `product_type` (p. ej. políticas de contrato en admin). */
export const CONTRACT_POLICY_PRODUCT_TYPE_OPTIONS: { code: string; label: string }[] = Object.entries(
  PRODUCT_TYPE_LABELS,
)
  .map(([code, label]) => ({ code, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'));

export function formatProductTypesList(codes: string[] | null | undefined): string {
  if (!codes?.length) {
    return 'Todos los productos (sin filtro explícito en la regla)';
  }
  return codes.map((c) => `${productTypeLabel(c)} (${c})`).join(', ');
}

export function rulesetUsageText(code: string): string | null {
  return RULESET_USAGE_PLAIN[code] ?? null;
}
