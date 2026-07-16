# b2c-core-api-services — Servicios data-access de core para el cliente persona

## ADDED Requirements

### Requirement: Servicio de transferencias
`core-data-access` SHALL exponer `CoreTransfersApiService` con métodos tipados: `create(request, idempotencyKey)` (envía `X-Idempotency-Key`), `list(filters)` y `get(id)`, devolviendo modelos de `core-domain` y errores mapeados por `shared-http`. `list()` SHALL devolver un array plano (`ApiEnvelope<Transfer[]>`) con paginación por `meta.cursor`/`meta.has_more` (el cursor es el `created_at` ISO del último elemento, no un token opaco), consistente con el contrato real de `GET /transfers` en Core.

**Nota de implementación:** no existe un endpoint de "resolución de destino" (`resolve-destination`) separado — Core solo resuelve una llave Bre-B de forma server-side dentro de `POST /transfers`; el error `BREB_KEY_NOT_RESOLVABLE` llega en la respuesta de creación, no en un paso previo. Esta capacidad se ajustó tras verificar el contrato ya implementado en `pleniubank-core` (`src/api/v1/schemas/transfer_schemas.py`, `resolve_transfer_destination_service.py`); el diseño original de esta spec asumía un endpoint de preview que Core no expone. El destino por llave SHALL enviarse como `{ key_type, key_value }` (sin `account_id`) en el mismo payload de `create()`.

#### Scenario: Creación con idempotencia
- **WHEN** el portal invoca `create()` con una idempotency key
- **THEN** la petición incluye el header `X-Idempotency-Key` y la respuesta se tipa como `Transfer`

#### Scenario: Error de límite tipado
- **WHEN** el backend responde 422 `TRANSFER_LIMIT_EXCEEDED`
- **THEN** el error mapeado expone el código tipado

#### Scenario: Listado plano paginado
- **WHEN** el portal invoca `list({ limit: 20 })`
- **THEN** recibe `ApiEnvelope<Transfer[]>` con `meta.cursor` utilizable como parámetro `cursor` de la siguiente página

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
