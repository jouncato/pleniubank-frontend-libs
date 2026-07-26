# Data-access del ciclo de vida de llaves Bre-B

## Por qué

`pleniubank-core` añade en `breb-key-lifecycle-state-machine-co` una máquina de
estados explícita para las llaves Bre-B, un historial inmutable de transiciones y
una superficie administrativa de suspensión/reactivación. Hoy las libs no pueden
consumir nada de eso:

1. **`BrebKeySelfServiceDto` no tiene `status`.** Solo expone `is_active`, que a
   partir de este cambio significa "reserva el valor", no "puede recibir dinero".
   Un portal que siga leyendo `is_active` mostrará como utilizable una llave
   suspendida o pendiente de confirmación.
2. **No existe tipo ni servicio para el historial de transiciones**, ni en la
   vista reducida del cliente ni en la vista completa de staff.
3. **No existe servicio administrativo de llaves.** `CoreBrebKeysApiService`
   opera por `customer_id` pero no cubre suspensión, reactivación ni verificación
   de integridad de la cadena de auditoría.
4. **`BrebKeyType` y el validador de alias del portal no contemplan el prefijo
   `@`** que core podrá exigir por configuración.

## Qué cambia

- **`core-domain`**: `BrebKeyStatus`, `BrebKeyStatusReason`,
  `BrebKeyStatusHistoryItemDto`, `BrebKeyStatusHistoryResponseDto`,
  `AdminBrebKeyStatusHistoryItemDto`, `BrebKeyChainVerificationResponseDto`,
  `SuspendBrebKeyRequest`, `ReactivateBrebKeyRequest`; campo `status` añadido a
  `BrebKeySelfServiceDto`; helpers puros `isBrebKeyResolvable`,
  `brebKeyReservesValue`.
- **`core-data-access`**: `getHistory(brebKeyId)` en
  `CoreBrebKeysSelfServiceApiService`; nuevo `CoreAdminBrebKeysApiService`
  (`suspend`, `reactivate`, `getHistory`, `verifyChain`).
- **Constantes compartidas** de etiquetas de estado y motivo en español, para que
  customer-portal y backoffice-portal no las dupliquen divergiendo.

## Alcance

- `libs/core-domain/src/lib/wallet.models.ts` (tipos de llave y estado).
- Nuevo `libs/core-domain/src/lib/breb-key-lifecycle.models.ts`.
- Nuevo `libs/core-domain/src/lib/breb-key-lifecycle.labels.ts`.
- `libs/core-data-access/src/lib/core-breb-keys-self-service-api.service.ts`.
- Nuevo `libs/core-data-access/src/lib/core-admin-breb-keys-api.service.ts`.
- `public-api.ts` de ambas libs.

## Compatibilidad

`status` se declara **opcional** (`status?: BrebKeyStatus`) durante la ventana en
que un core sin desplegar todavía no lo emite. Los helpers tratan la ausencia de
`status` como "desconocido" y en ese caso caen al comportamiento previo basado en
`is_active`, para que los portales no rompan si se despliegan antes que core. La
obligatoriedad del campo se aborda en un change posterior de limpieza, una vez
core esté en producción.

## Fuera de alcance

- Componentes de UI: viven en `breb-key-lifecycle-ui` (customer-portal) y
  `breb-key-lifecycle-backoffice` (backoffice-portal).
- Registro real ante participante Bre-B: no hay contrato.
- Cambio del validador de alias del cliente: se especifica en el change del
  customer-portal, que es donde reside el espejo de validación.
