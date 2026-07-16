# Tasks: breb-key-account-linkage-data-access (frontend-libs)

**Gate de entrada:** `breb-key-account-linkage` (pleniubank-core) con los contratos de `account_schemas.py`/`breb_key_self_service_schemas.py` actualizados.

## 1. Modelos

- [x] 1.1 `libs/core-domain/src/lib/account.models.ts`: `PrimaryPaymentIdentifierDto.value: string` (nuevo, IBAN completo). Validado contra `account_schemas.py` real de core (`PrimaryPaymentIdentifierResponse.value`).
- [x] 1.2 `libs/core-domain/src/lib/wallet.models.ts`: `BrebKeySelfServiceDto.account_id: string | null` (nuevo, nullable — igual que el schema Pydantic real, por el caso borde de fila legacy sin backfill); `BrebKeyRegisterRequest.account_id?: string` (nuevo, opcional).
- [x] 1.3 `core-accounts-api.service.spec.ts` no existe (nada que actualizar ahí). `core-breb-keys-self-service-api.service.spec.ts` actualizado: mocks de `list`/`register` incluyen `account_id`, y se agregó un test nuevo que confirma que `account_id` se reenvía en el cuerpo del POST cuando se indica explícitamente.

## 2. Cierre

- [x] 2.1 `pnpm run test:all` (exit 0) + `ng test ui --watch=false`: 12 test files, 50 tests, todos en verde.
- [x] 2.2 `bash scripts/check-icon-regressions.sh`: "Sin nuevas ocurrencias de iconografia no gobernada."
- [x] 2.3 Bump de versión: `core-domain` y `core-data-access` 0.3.0 → 0.4.0.
