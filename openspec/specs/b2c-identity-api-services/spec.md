# b2c-identity-api-services

## Purpose

Servicios data-access de `identity-data-access` para el cliente persona (B2C): perfil,
cambio de datos de contacto, sesiones y cierre de cuenta, tipados 1:1 contra los modelos
de `identity-domain` y consistentes con el contrato real ya implementado en
`pleniubank-identity-service`.

## Requirements

### Requirement: Servicio de perfil

`identity-data-access` SHALL exponer `IdentityProfileApiService` con `getMe()`, `updateName(request)`, y los flujos de cambio de contacto: `startPhoneChange(request)` / `verifyPhoneChange(request)`, `startEmailChange(request)` / `verifyEmailChangeOtp(request)` / `confirmEmailChange(request)`, devolviendo modelos tipados de `identity-domain` alineados 1:1 con `src/domain/models.py` de identity (cuerpo plano, sin envelope `{ data }`).

**Nota de implementación (corrección tras verificar el contrato real ya implementado en identity):** el paso 3 del cambio de email NO ocurre "fuera del portal" como asumía el diseño original — existe un endpoint real `POST /me/email-change/confirm` que recibe `confirmation_token` (el valor que llega en el enlace del correo). El portal SHALL implementar una ruta de aterrizaje que capture ese token de la query string y llame a `confirmEmailChange()`. Además, el cierre de cuenta requiere un paso previo no contemplado originalmente: `POST /me/closure/challenge` (sin cuerpo) para enviar el OTP, antes de poder llamar a `requestClosure({ current_password, code })`; se añadió `requestClosureChallenge()` al servicio.

#### Scenario: Perfil tipado

- **WHEN** el portal invoca `getMe()`
- **THEN** recibe `CustomerProfile` con documento enmascarado, `customer_id` y flags de verificación tipados

#### Scenario: Cambio de email — paso 2 a 3

- **WHEN** `verifyEmailChangeOtp` responde con éxito
- **THEN** el modelo `EmailChangeVerifyResponse` expone `confirmation_expires_in_seconds` para que la UI muestre el estado "pendiente de confirmación en tu email actual"

#### Scenario: Confirmación de email desde enlace

- **WHEN** el portal captura `confirmation_token` de la URL del enlace de correo y llama `confirmEmailChange()`
- **THEN** recibe `ContactChangeResponse` con `status: 'updated'`

### Requirement: Servicio de sesiones

`IdentitySessionsApiService` SHALL exponer `list()` (respuesta `{ sessions: UserSession[] }`, con marca `current`), `revoke(sessionId)` (204 No Content) y `revokeOthers()` (respuesta `{ revoked_count }`).

#### Scenario: Listado con sesión actual

- **WHEN** el portal lista las sesiones
- **THEN** el modelo identifica la sesión actual (`current: true`) y las fechas de última actividad (`ua_summary`, `ip_truncated`)

### Requirement: Servicio de cierre de cuenta

El servicio SHALL exponer `requestClosureChallenge()` (envía el OTP), `requestClosure({ current_password, code })`, `getClosure()` y `cancelClosure()`, tipando la máquina de estados (`ClosureStatus = 'requested' | 'blocked' | 'completed' | 'cancelled' | 'challenge_sent'`) y el motivo de bloqueo. `data_erasure_separate: true` SHALL usarse por la UI para aclarar que la supresión de datos es un trámite distinto.

#### Scenario: Cierre bloqueado tipado

- **WHEN** `getClosure()` devuelve estado bloqueado
- **THEN** el modelo expone `reason: 'ACTIVE_OBLIGATIONS'`

### Requirement: Errores anti-enumeración uniformes

Los métodos de cambio de contacto SHALL mapear las respuestas genéricas del backend sin inventar detalle: el error tipado distingue solo lo que el backend distingue (p.ej. `NOT_ELIGIBLE`, `RATE_LIMIT_EXCEEDED`, `OTP_LOCKED`).

#### Scenario: Error genérico preservado

- **WHEN** el backend responde no-elegibilidad genérica
- **THEN** el error mapeado no añade información sobre la existencia de otras cuentas
