# Tasks — breb-key-lifecycle-data-access

## core-domain

- [ ] 1. Nuevo `libs/core-domain/src/lib/breb-key-lifecycle.models.ts`:
      `BrebKeyStatus` (union de los 8 estados), `BrebKeyStatusReason` (union de
      los 18 motivos), `BrebKeyStatusHistoryItemDto` (vista cliente),
      `BrebKeyStatusHistoryResponseDto`,
      `AdminBrebKeyStatusHistoryItemDto` (vista staff, fila completa),
      `AdminBrebKeyStatusHistoryResponseDto`,
      `BrebKeyChainVerificationResponseDto`, `SuspendBrebKeyRequest`,
      `ReactivateBrebKeyRequest`.
- [ ] 2. Helpers puros en el mismo archivo: `isBrebKeyResolvable(key)`,
      `brebKeyReservesValue(status)`, `isBrebKeyTransientStatus(status)`,
      `isBrebKeyTerminalStatus(status)`. `isBrebKeyResolvable` SHALL degradar a
      `is_active && verified` cuando `status` sea `undefined`.
- [ ] 3. `libs/core-domain/src/lib/wallet.models.ts`: añadir
      `status?: BrebKeyStatus` a `BrebKeySelfServiceDto` con JSDoc que advierta
      explícitamente que `is_active` significa "reserva el valor" y **no** debe
      usarse para decidir si la llave es utilizable.
- [ ] 4. Nuevo `libs/core-domain/src/lib/breb-key-lifecycle.labels.ts`:
      `brebKeyStatusLabel(status)` y `brebKeyReasonLabel(reason)` en español;
      valor desconocido devuelve el código crudo, nunca cadena vacía.
- [ ] 5. `libs/core-domain/src/public-api.ts`: exportar todo lo anterior.

## core-data-access

- [ ] 6. `core-breb-keys-self-service-api.service.ts`: añadir
      `getHistory(brebKeyId): Observable<ApiEnvelope<BrebKeyStatusHistoryResponseDto>>`
      contra `GET {base}/{brebKeyId}/history`.
- [ ] 7. Nuevo `libs/core-data-access/src/lib/core-admin-breb-keys-api.service.ts`
      con `CoreAdminBrebKeysApiService`:
      `suspend(brebKeyId, body)`, `reactivate(brebKeyId, body)`,
      `getHistory(brebKeyId)`, `verifyChain(brebKeyId)`. `suspend` y
      `reactivate` generan `X-Idempotency-Key` fresca por invocación.
- [ ] 8. `libs/core-data-access/src/public-api.ts`: exportar el servicio admin.
- [ ] 9. Catálogo de mensajes de `shared-http`: entradas para
      `BREB_KEY_INVALID_TRANSITION`, `CUSTOM_KEY_MISSING_AT_PREFIX`,
      `BREB_KEY_ALREADY_SUSPENDED`.

## Tests

- [ ] 10. `breb-key-lifecycle.models.spec.ts`: `isBrebKeyResolvable` true solo
      con `status='ACTIVE'` y `verified=true`.
- [ ] 11. `isBrebKeyResolvable` con `status` `SUSPENDED`, `PENDING_CREATION`,
      `PENDING_UPDATE`, `PENDING_DELETION`, `ORPHANED_SYNC`, `INACTIVE` y
      `FAILED_CREATION` devuelve false en todos los casos.
- [ ] 12. `isBrebKeyResolvable` sin `status` (core antiguo) degrada a
      `is_active && verified`.
- [ ] 13. `brebKeyReservesValue` true para los 6 estados que reservan, false
      para `INACTIVE` y `FAILED_CREATION`.
- [ ] 14. `brebKeyStatusLabel` y `brebKeyReasonLabel` devuelven el código crudo
      ante un valor desconocido.
- [ ] 15. `core-breb-keys-self-service-api.service.spec.ts`: `getHistory` pega
      a la URL correcta y devuelve el envelope tipado.
- [ ] 16. `core-admin-breb-keys-api.service.spec.ts`: las 4 operaciones apuntan
      a la URL correcta; `suspend` y `reactivate` envían `X-Idempotency-Key`
      distinta en dos invocaciones consecutivas.
- [ ] 17. Regresión: los specs existentes de `core-breb-keys-self-service-api`
      y `b2c-services-interceptors.integration` siguen pasando sin cambios de
      aserciones (el DTO solo creció con un campo opcional).
