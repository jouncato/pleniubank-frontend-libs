# Diseño

## Decisiones

### 1. `status` opcional, no obligatorio

`BrebKeySelfServiceDto.status?: BrebKeyStatus`.

Motivo: las libs se publican y consumen antes de que core esté desplegado en
todos los entornos. Declararlo obligatorio rompería la compilación de los
portales contra un core que aún no lo emite, y forzaría mocks inconsistentes en
los specs existentes.

Los helpers absorben la ausencia:

```ts
export function isBrebKeyResolvable(key: BrebKeySelfServiceDto): boolean {
  if (key.status === undefined) return key.is_active && key.verified;
  return key.status === 'ACTIVE' && key.verified;
}
```

Un change posterior de limpieza lo vuelve obligatorio cuando core esté en
producción en todos los entornos.

### 2. `is_active` deja de significar "utilizable"

Este es el punto de mayor riesgo de regresión silenciosa en los portales.

Tras el cambio de core, `is_active === true` significa **"la llave reserva el
valor"** e incluye `SUSPENDED`, `PENDING_CREATION`, `PENDING_UPDATE`,
`PENDING_DELETION` y `ORPHANED_SYNC`. Un portal que muestre "llave activa" leyendo
`is_active` presentará como operativa una llave suspendida por fraude.

Mitigación: `isBrebKeyResolvable` es la única función que los portales deben usar
para decidir si una llave es utilizable. Se documenta en el JSDoc del campo
`is_active` que **no** debe leerse directamente para esa decisión.

### 3. Dos DTOs de historial, no uno con campos opcionales

- `BrebKeyStatusHistoryItemDto` — vista de cliente: `new_status`, `reason_code`,
  `created_at`. Nada más.
- `AdminBrebKeyStatusHistoryItemDto` — vista de staff: fila completa incluyendo
  `previous_status`, `description`, `triggered_by`, `ip_address`,
  `forwarded_for`, `user_agent`, `correlation_id`, `external_event_id`,
  `previous_account_id`, `new_account_id`, `chain_hash`.

Motivo: un DTO único con todo opcional permitiría que un componente de cliente
renderice por accidente la IP o el responsable si el backend algún día los
enviara. Con dos tipos, el compilador impide ese error.

### 4. Servicio admin separado del self-service

`CoreAdminBrebKeysApiService` apunta a la superficie administrativa y es
independiente de `CoreBrebKeysSelfServiceApiService`. No se extiende el servicio
self-service con métodos de staff: eso permitiría que el customer-portal importe
por descuido una operación privilegiada, y el árbol de dependencias dejaría de
reflejar quién puede hacer qué.

### 5. Idempotencia en operaciones de estado

`suspend` y `reactivate` generan `X-Idempotency-Key` fresca por invocación,
siguiendo el patrón ya establecido en `register()` del servicio self-service: cada
invocación representa una acción explícita distinta del operador, no un reintento
de red.

### 6. Etiquetas compartidas en las libs, no en los portales

`brebKeyStatusLabel()` y `brebKeyReasonLabel()` viven en `core-domain`. Si cada
portal define sus propias etiquetas, el mismo estado aparece con nombres
distintos en la vista del cliente y en la del operador, y una disputa se vuelve
difícil de conciliar entre ambas pantallas.

Toda etiqueta desconocida cae al código crudo en lugar de a una cadena vacía, para
que un estado nuevo emitido por core sea visible en la UI en vez de invisible.

### 7. Sin traducción de errores nueva

Los códigos de error (`BREB_KEY_INVALID_TRANSITION`,
`CUSTOM_KEY_MISSING_AT_PREFIX`) se resuelven con el
`resolveUserFacingApiError` ya existente en `shared-http`. Solo se añaden las
entradas al catálogo de mensajes; no se crea un mecanismo paralelo.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Portales siguen leyendo `is_active` como "utilizable" | Helper obligatorio + JSDoc explícito + test que verifica que `SUSPENDED` no es resoluble |
| DTO de cliente filtra campos de staff | Dos tipos separados; el compilador lo impide |
| Etiquetas divergentes entre portales | Etiquetas centralizadas en `core-domain` |
| Estado nuevo de core no contemplado | Etiqueta cae al código crudo, visible en UI |
