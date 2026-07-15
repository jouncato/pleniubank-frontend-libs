# b2c-core-api-services — Servicios data-access de core para el cliente persona

## ADDED Requirements

### Requirement: Servicio de transferencias
`core-data-access` SHALL exponer `CoreTransfersApiService` con métodos tipados: `createTransfer(request, idempotencyKey)` (envía `X-Idempotency-Key`), `listTransfers(filter, cursor)`, `getTransfer(id)` y `resolveDestination(keyType, keyValue)`, devolviendo modelos de `core-domain` y errores mapeados por `shared-http`.

#### Scenario: Creación con idempotencia
- **WHEN** el portal invoca `createTransfer` con una idempotency key
- **THEN** la petición incluye el header `X-Idempotency-Key` y la respuesta se tipa como `Transfer`

#### Scenario: Error de límite tipado
- **WHEN** el backend responde 422 `TRANSFER_LIMIT_EXCEEDED`
- **THEN** el error mapeado expone el código tipado y los metadatos del límite

### Requirement: Extractos customer-scoped con descarga
`CoreStatementsApiService` SHALL añadir métodos customer-scoped: `getStatement(accountId, from, to)` y `exportStatement(accountId, from, to, format)` devolviendo `Blob` con el nombre de archivo derivado de `Content-Disposition`.

#### Scenario: Export PDF como blob
- **WHEN** el portal solicita un extracto PDF
- **THEN** el servicio devuelve el blob y el nombre de archivo para disparar la descarga

### Requirement: Servicio de notificaciones (inbox y preferencias)
`core-data-access` SHALL exponer `CoreNotificationsApiService` con `listNotifications(cursor, unreadOnly)`, `markRead(id)`, `markAllRead()`, `getPreferences()` y `updatePreferences(prefs)`, con modelos que marquen los eventos obligatorios (`locked: true`).

#### Scenario: Preferencia obligatoria tipada
- **WHEN** el portal lee las preferencias
- **THEN** los eventos obligatorios llegan marcados para que la UI deshabilite el control

### Requirement: Interceptores aplicados a servicios nuevos
Los servicios nuevos SHALL usar el `HttpClient` estándar de la lib para que los interceptores de tenant (`X-Tenant-Country`), correlación y auth apliquen sin configuración adicional.

#### Scenario: Header de tenant presente
- **WHEN** cualquier método nuevo ejecuta una petición
- **THEN** la petición lleva `X-Tenant-Country` y correlation-id como el resto de servicios
