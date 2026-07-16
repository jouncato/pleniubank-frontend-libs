# Proposal: breb-key-account-linkage-data-access (frontend-libs)

**Status:** Proposed. Depende de `breb-key-account-linkage` (pleniubank-core) con el contrato de `account_schemas.py`/`breb_key_self_service_schemas.py` actualizado.

## Why

Réplica minimalista del ajuste de core: dos modelos ganan un campo cada uno para que el portal pueda (a) mostrar y copiar el IBAN completo de cada cuenta, y (b) cruzar en el cliente qué llave Bre-B está vinculada a qué cuenta (el backend ahora persiste ese vínculo, ver `breb-key-account-linkage`).

## What Changes

- `PrimaryPaymentIdentifierDto` (`account.models.ts`) gana `value: string` (IBAN completo, sin enmascarar) — mismo principio ya aplicado a `WalletSummaryDto.iban`.
- `BrebKeySelfServiceDto` (`wallet.models.ts`) gana `account_id: string` — usado por el portal para cruzar cada llave con la cuenta que la muestra, nunca renderizado como texto (es un id técnico de referencia, no un identificador de negocio).
- `BrebKeyRegisterRequest` gana `account_id?: string` opcional (compatibilidad: si se omite, el backend sigue defaulteando a la cuenta más reciente).

## Capabilities

### New Capabilities
- `account-identifiers-data-access`: modelo tipado con el IBAN completo por cuenta.

### Modified Capabilities
- `virtual-account-data-access`: `BrebKeySelfServiceDto`/`BrebKeyRegisterRequest` incluyen `account_id`.

## Impact

- Código: `libs/core-domain/src/lib/account.models.ts`, `libs/core-domain/src/lib/wallet.models.ts`, specs de servicios asociados (`core-accounts-api.service.spec.ts` si existe, `core-breb-keys-self-service-api.service.spec.ts`).
- Sin cambios de firma en los servicios (`CoreAccountsApiService.list()`/`getById()`, `CoreBrebKeysSelfServiceApiService.list()`/`register()`) — solo cambia el shape de los payloads.
