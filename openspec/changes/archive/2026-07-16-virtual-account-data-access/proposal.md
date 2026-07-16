# Proposal: virtual-account-data-access (frontend-libs)

**Status:** Proposed — Fase 2 (lado libs). **Depende de** `virtual-account-identifiers` (core) con contratos publicados. Consumido por `financial-identity-ui` (customer-portal).

## Why

Los portales componen sus vistas con endpoints crudos y muestran UUIDs; los nuevos contratos de core (wallet summary, identificadores virtuales, Bre-B self-service) necesitan modelos tipados y servicios data-access en las libs compartidas, siguiendo exactamente el patrón del change archivado `b2c-data-access` (modelos en `core-domain`, servicios en `core-data-access`, specs con HttpTestingController, verificación de interceptores).

Estado verificado (2026-07-16): `core-domain` no contiene ningún modelo de alias/friendly-name/identificador virtual (0 matches de `alias|nickname|friendly|displayName` para cuentas propias); no existe servicio para wallet summary ni para llaves Bre-B self-service.

## What Changes

- `core-domain`: modelos `VirtualAccountInfo` (`virtual_number`, `format_type`, `status`), `WalletSummary` (cuenta principal, identificador, `friendly_name`, saldo con denominación, alias Bre-B enmascarados, flag `interoperable`, estado `PROVISIONING`), `BrebKey` (enmascarada, `key_type`, estado).
- `core-data-access`: `CoreWalletApiService.getSummary()` (`GET /wallet/summary`) y `CoreBrebKeysApiService` (list/register/delete sobre `/customers/me/breb-keys`), con envelope estándar y specs.
- `shared-http`: códigos de error nuevos del contrato (ej. rechazo genérico anti-enumeración de registro de llave) en el mapper, si core los introduce con código tipado.
- Spec de integración de interceptores (patrón `b2c-services-interceptors.integration.spec.ts`): `X-Tenant-Country` + `X-Correlation-ID` presentes en los servicios nuevos.
- Bump de versión de las libs tocadas al cierre (patrón `0.1.0` ya adoptado).

## Capabilities

### New Capabilities
- `virtual-account-data-access`: modelos y servicios tipados para wallet summary, identificadores virtuales y llaves Bre-B self-service.

### Modified Capabilities
- Ninguna (aditivo; `tenant-header-injection` no cambia, los servicios nuevos deben cumplirlo).

## Impact

- Código: `libs/core-domain`, `libs/core-data-access`, `libs/shared-http` (solo si hay códigos nuevos).
- Consumidores: `pleniubank-customer-portal` (change paralelo `financial-identity-ui`); backoffice no se toca.
- Compatibilidad: aditivo, sin breaking changes.
- Regla de honestidad de contrato (lección del change `b2c-data-access`, tarea 5.1): los modelos se validan contra el código real de core **antes** de marcar cierre, no contra los specs de planeación.
