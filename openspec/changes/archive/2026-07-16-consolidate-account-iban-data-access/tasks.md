# Tasks: consolidate-account-iban-data-access (frontend-libs)

**Gate de entrada:** `consolidate-account-iban` (pleniubank-core) con el contrato de `wallet_summary_schemas.py` actualizado.

## 1. Modelo

- [x] 1.1 `libs/core-domain/src/lib/wallet.models.ts`: `WalletSummaryDto.iban: string | null` reemplaza `virtual_number`/`format_type`; retirar `VirtualAccountFormatType` (ya no se usa). Validar contra el `wallet_summary_schemas.py` real de core.
- [x] 1.2 Actualizar `libs/core-data-access/src/lib/core-wallet-api.service.spec.ts` a los mocks con el nuevo shape (`iban` en vez de `virtual_number`/`format_type`). También `b2c-services-interceptors.integration.spec.ts` (mismo shape antiguo, no listado originalmente en tasks pero encontrado por grep).

## 2. Cierre

- [x] 2.1 `pnpm run test:all` en verde (exit 0). `ng test ui --watch=false`: 12 test files, 50 tests passed.
- [x] 2.2 `bash scripts/check-icon-regressions.sh` en verde: "Sin nuevas ocurrencias de iconografia no gobernada."
- [x] 2.3 Bump de versión: `core-domain` y `core-data-access` 0.2.0 → 0.3.0.
