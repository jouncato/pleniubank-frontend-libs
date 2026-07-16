# Proposal: consolidate-account-iban-data-access (frontend-libs)

**Status:** Proposed — corrección en cascada de `consolidate-account-iban` (pleniubank-core). Depende de que ese change publique el contrato corregido de `GET /wallet/summary`.

## Why

`virtual-account-data-access` (archivado) modeló `WalletSummaryDto` contra un contrato de core (`virtual_number`/`format_type`) que ese mismo repo acaba de retirar por duplicar un sistema de IBAN ya existente (`account_payment_identifiers`). Ver `pleniubank-core/openspec/changes/consolidate-account-iban/proposal.md` para la evidencia completa. Este change actualiza los modelos/servicios de `core-domain`/`core-data-access` al contrato corregido (`iban: string | null`).

## What Changes

- `libs/core-domain/src/lib/wallet.models.ts`: `WalletSummaryDto` cambia `virtual_number`/`format_type` por `iban: string | null` (valor completo, no enmascarado — el consumidor decide mostrar/ocultar). Se retira `VirtualAccountFormatType` (ya no aplica, el esquema siempre es IBAN).
- `libs/core-data-access/src/lib/core-wallet-api.service.ts` y su spec: sin cambio de firma (`getSummary()` sigue igual), solo el shape de datos que fluye por el `Observable` cambia según el modelo actualizado.
- `CoreBrebKeysSelfServiceApiService` **no se toca** (no relacionado con la duplicación de IBAN).

## Capabilities

### Modified Capabilities
- `virtual-account-data-access`: el modelo `WalletSummary` se corrige al contrato real de core.

## Impact

- Código: `libs/core-domain/src/lib/wallet.models.ts` (+public-api export ya existente, solo cambia el shape), `libs/core-data-access/src/lib/core-wallet-api.service.spec.ts`.
- Consumidor en cascada: `pleniubank-customer-portal` (change paralelo `consolidate-account-iban-ui`).
- Sin cambios en `shared-http`, Bre-B self-service, ni en ninguna otra lib.
