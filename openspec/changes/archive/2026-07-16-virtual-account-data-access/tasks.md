# Tasks: virtual-account-data-access (frontend-libs)

**Gate de entrada:** contratos de `virtual-account-identifiers` (core) publicados (tarea 6.1 de ese change).

## 1. Modelos

- [x] 1.1 `core-domain`: `wallet.models.ts` (`WalletStatus`, `VirtualAccountFormatType`, `BrebKeyType`, `WalletBalanceDto`, `WalletBrebAliasDto`, `WalletSummaryDto`, `BrebKeySelfServiceDto`, `BrebKeySelfServiceListResponseDto`, `BrebKeyRegisterRequest`, `BrebKeyRevokeResponseDto`) exportados en `libs/core-domain/src/public-api.ts`.
  - Evidencia: `libs/core-domain/src/lib/wallet.models.ts`, `libs/core-domain/src/public-api.ts`.
  - Nota de proceso: el archivo ya existía sin commitear como `wallet-summary.models.ts` (con `WalletBalanceDto`/`WalletBrebAliasDto`/`WalletSummaryDto` ya correctos respecto al contrato real) de un intento previo de esta misma tarea; se renombró a `wallet.models.ts` y se le añadieron los modelos de Bre-B self-service (antes definidos inline en el servicio, violando el patrón modelos-en-core-domain/servicios-en-core-data-access usado por `WalletSummaryDto`).
- [x] 1.2 Validar los modelos campo por campo contra los schemas Pydantic reales de core. **Ya resuelta por el orquestador**, que verificó directamente el código Python de `pleniubank-core` (`WalletBalanceDto`, `WalletBrebAliasDto`, `WalletSummaryDto`, `BrebKeySelfServiceDto`, `BrebKeyRegisterRequest`) y entregó el contrato real como entrada a esta implementación.
  - **Divergencias encontradas entre `design.md` (especulativo) y el contrato real**, corregidas en `wallet.models.ts`:
    - `provisioning_status: 'READY' | 'PROVISIONING'` (design.md) → el campo real es **`wallet_status: 'ACTIVE' | 'PROVISIONING'`**.
    - `account_id` (design.md, "para deep-links técnicos") → **no existe** en `WalletSummaryDto`; no se modela.
    - `virtual_account: VirtualAccountInfo | null` anidado (design.md) → el contrato real usa **campos planos en el nivel superior**: `virtual_number`, `format_type`, `country_code` (sin objeto `VirtualAccountInfo` ni campo `status` propio del identificador).
    - `available_balance: { amount, denomination }` (design.md) → el campo real es **`balance: { amount, currency } | null`** (nombre de campo y de la propiedad de denominación distintos: `currency`, no `denomination`).
    - `breb_aliases: BrebKey[]` (design.md, array) → el contrato real expone **`breb_alias` singular** (`WalletBrebAliasDto | null`, el alias activo más reciente, no un array).
    - `BrebKey.masked_value` / `BrebKey.status` (design.md, para el resumen) → **no existen así**: dentro del summary el campo es `WalletBrebAliasDto.masked_value` (correcto) pero sin `status`; y el DTO de listado self-service (`BrebKeySelfServiceDto`) **no tiene `masked_value` en absoluto** — nunca expone el valor de la llave, ni enmascarado. Son dos conceptos distintos que design.md conflacionaba.
    - `VirtualAccountFormat` incluía `'IBAN_SPONSOR'` (design.md) → el valor real es **`format_type: 'CO_SAVINGS_VIRTUAL' | 'MX_CLABE_VIRTUAL' | 'PE_CCI_VIRTUAL' | null`** (se mantiene además `IBAN_VIRTUAL` ya presente en el borrador previo por compatibilidad con otras jurisdicciones documentadas en `pleniubank-core`, pero no `IBAN_SPONSOR`).
  - Todas las correcciones ya reflejadas en `libs/core-domain/src/lib/wallet.models.ts`.

## 2. Servicios

- [x] 2.1 `CoreWalletApiService.getSummary()` (`corePublicV1Base + '/wallet/summary'`, envelope estándar) + spec con HttpTestingController (ACTIVE con balance+alias, PROVISIONING con campos null, error genérico).
  - Evidencia: `libs/core-data-access/src/lib/core-wallet-api.service.ts`, `libs/core-data-access/src/lib/core-wallet-api.service.spec.ts`.
- [x] 2.2 `CoreBrebKeysSelfServiceApiService` (`list`/`register`/`remove` sobre `/customers/me/breb-keys`) + specs (registro solo-POST del valor, listado sin exponer ningún valor, DELETE 404 mapeado, anti-enumeración 422 `BREB_KEY_NOT_ELIGIBLE` propagado sin enriquecer).
  - Evidencia: `libs/core-data-access/src/lib/core-breb-keys-self-service-api.service.ts`, `libs/core-data-access/src/lib/core-breb-keys-self-service-api.service.spec.ts`.
  - **Desviación de nombre documentada:** el repo ya tenía `CoreBrebKeysApiService` (servicio distinto, administrado por `customer_id` explícito sobre `/customers/{customerId}/breb-key(s)`, de un change anterior). Para no colisionar ni pisar ese servicio, el nuevo servicio self-service se llama `CoreBrebKeysSelfServiceApiService` en `core-breb-keys-self-service-api.service.ts` — mismo patrón que ya traía el borrador no commiteado encontrado al empezar esta tarea.
- [x] 2.3 Códigos de error nuevos en `error-message.mapper` de `shared-http` solo si core los tipifica.
  - **Decisión: NO se modifica `error-message.mapper.ts`.** Se verificó el comportamiento actual: cualquier código no reconocido por el `switch` (incluidos `BREB_KEY_NOT_ELIGIBLE` y `BREB_KEY_NOT_FOUND`) cae al `default`, que devuelve el mensaje genérico `'Ocurrió un error inesperado.'` sin revelar ningún detalle — el mismo tratamiento que ya recibe `NOT_ELIGIBLE` para otros flujos anti-enumeración. Como el requisito de negocio es un mensaje genérico (no uno específico y más útil), el fallback ya cumple el contrato sin necesidad de tocar el mapper.
  - Se añadió un test de regresión (no cambio funcional) en `libs/shared-http/src/lib/error-message.mapper.spec.ts` que fija este comportamiento para detectar cualquier futura regresión accidental.
  - No se bumpeó la versión de `shared-http` (no hubo cambio de código fuente, solo un spec).

## 3. Interceptores y cierre

- [x] 3.1 Spec de integración de interceptores para ambos servicios nuevos, añadido a `b2c-services-interceptors.integration.spec.ts` (patrón existente, mismo archivo): casos `CoreWalletApiService.getSummary()` y `CoreBrebKeysSelfServiceApiService.list()`, verificando `X-Tenant-Country` y `X-Correlation-ID`.
  - Evidencia: `libs/core-data-access/src/lib/b2c-services-interceptors.integration.spec.ts`.
- [x] 3.2 `test:all` + `ng test ui` en verde; `check-icon-regressions.sh` en verde.
  - Ver resultados en el reporte de cierre de la sesión de implementación.
- [x] 3.3 Bump de versión de `core-domain`/`core-data-access` (`0.1.0` → `0.2.0`). `shared-http` **no** se bumpeó (ver 2.3: no se tocó su código fuente).
  - Evidencia: `libs/core-domain/package.json`, `libs/core-data-access/package.json`.
