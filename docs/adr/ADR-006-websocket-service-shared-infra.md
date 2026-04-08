# ADR-006: `CoreWebSocketEventsService` como Infraestructura de Plataforma en `shared-http`

**Fecha:** 2026-04-08
**Estado:** Aceptado
**Personas:** Equipo Frontend PleniuBank

---

## Contexto

El `customer-portal` necesita recibir eventos en tiempo real desde el backend (actualizaciones de transacciones, notificaciones de estado de préstamo, alertas de cuenta). Esta capacidad se implementa mediante WebSocket con el servicio `CoreWebSocketEventsService` y el tipo `CoreDomainEvent`.

La pregunta arquitectónica es dónde ubicar este servicio: en `customer-portal` directamente (donde hoy es el único consumidor), o en `shared-http` como infraestructura de plataforma.

## Decisión

`CoreWebSocketEventsService` y `CoreDomainEvent` residen en la librería **`shared-http`**, no en `customer-portal`.

La justificación es prospectiva: la capacidad de recibir eventos en tiempo real del backend core es una capacidad de **plataforma**, no una feature exclusiva del portal de clientes. El `backoffice-portal` (monitoreo de operaciones) y el `public-portal` (notificaciones durante el onboarding) son candidatos naturales para necesitar real-time en el futuro.

## Justificación

- **Opción Seleccionada:** `CoreWebSocketEventsService` en `shared-http`
  - ✅ Si `backoffice-portal` añade un panel de actividad en tiempo real, el servicio ya existe en `shared-http` — cero duplicación
  - ✅ La conexión WebSocket al backend core es infraestructura al mismo nivel que los interceptors HTTP — coherente con la responsabilidad de `shared-http`
  - ✅ El tipo `CoreDomainEvent` es parte del contrato del backend core — compartible con cualquier portal que lo consuma
  - ✅ Centralizar el servicio facilita cambiar la implementación (ej. migrar de WebSocket nativo a Socket.io) en un solo lugar
  - ⚠️ `shared-http` incluye código que hoy solo usa un portal — podría percibirse como bloat

- **Opciones Rechazadas:**
  - **`CoreWebSocketEventsService` en `customer-portal`:** Si `backoffice-portal` necesita eventos real-time en el futuro, se copiaría el código o se refactorizaría con urgencia. El refactor proactivo ahora tiene costo cero.
  - **`CoreWebSocketEventsService` en una nueva librería `core-realtime`:** Separar en otra librería añade overhead de configuración sin beneficio real — `shared-http` ya agrupa toda la infraestructura de comunicación con el backend.

## Consecuencias

### Positivas
- `customer-portal` importa `CoreWebSocketEventsService` de `shared-http` como cualquier otro servicio de infraestructura
- Cualquier portal futuro que necesite eventos real-time tiene el servicio disponible sin trabajo adicional
- Si el protocolo WebSocket cambia (ej. a Server-Sent Events), el cambio se hace en `shared-http` y todos los portales lo heredan

### Negativas / Riesgos Mitigados
- **Riesgo:** `shared-http` importa dependencias de WebSocket aunque `backoffice-portal` y `public-portal` no las usen
  - **Mitigación:** Angular y el compilador TypeScript realizan tree-shaking — si un portal no importa `CoreWebSocketEventsService` desde `public-api.ts`, el código no se incluye en su bundle
- **Riesgo:** El servicio en `shared-http` puede asumir configuraciones específicas del `customer-portal`
  - **Mitigación:** `CoreWebSocketEventsService` recibe la URL del WebSocket vía `API_CONFIG` inyectado — cada portal configura su propio endpoint

### Impacto en Futuras Decisiones
- Cualquier nueva forma de comunicación push desde el backend (SSE, long-polling) debe implementarse en `shared-http`, no en portales individuales
- Si se añade WebSocket al `backoffice-portal`, no requiere ningún cambio en `pleniubank-frontend-libs`

## Referencias Técnicas
- `libs/shared-http/src/lib/websocket/core-websocket-events.service.ts`
- `libs/shared-http/src/public-api.ts` — export de `CoreWebSocketEventsService`
- `pleniubank-customer-portal/src/app/` — consumidor actual

## Archivos Afectados

| Ruta | Tipo de Cambio |
|------|---------------|
| `libs/shared-http/src/lib/websocket/` | Implementación del servicio WebSocket |
| `libs/shared-http/src/public-api.ts` | Export de `CoreWebSocketEventsService` y `CoreDomainEvent` |
| `pleniubank-customer-portal/src/app/app.config.ts` | Proveedor del servicio via `API_CONFIG` |
