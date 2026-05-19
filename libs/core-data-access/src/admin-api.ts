/**
 * Sub-barrel para servicios de API de administración/plataforma (backoffice, PLATFORM_ONLY).
 *
 * Importar desde aquí en el backoffice-portal en lugar del barrel raíz cuando solo se necesitan
 * servicios de administración, para hacer explícita la separación de responsabilidades.
 *
 * @example
 * import { CoreAuditApiService } from '@pleniu/core-data-access/admin-api';
 */

export * from './lib/core-audit-api.service';
export * from './lib/core-internal-accounts-api.service';
export * from './lib/core-contract-policies-api.service';
export * from './lib/core-contract-templates-api.service';
export * from './lib/core-payroll-advance-country-rules-api.service';
export * from './lib/core-help-tooltips-admin-api.service';
export * from './lib/rules';
