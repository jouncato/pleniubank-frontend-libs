# b2c-identity-api-services — Servicios data-access de identity para el cliente persona

## ADDED Requirements

### Requirement: Servicio de perfil
`identity-data-access` SHALL exponer `IdentityProfileApiService` con `getMe()`, `updateName(fullName)`, y los flujos de cambio de contacto: `startPhoneChange(password, newPhone)` / `verifyPhoneChange(otp)`, `startEmailChange(password, newEmail)` / `verifyEmailChangeOtp(otp)` (el paso 3 se confirma vía enlace de email, fuera del portal), devolviendo modelos tipados de `identity-domain` con los estados pendientes.

#### Scenario: Perfil tipado
- **WHEN** el portal invoca `getMe()`
- **THEN** recibe `CustomerProfile` con documento enmascarado y flags de verificación tipados

#### Scenario: Cambio de email pendiente
- **WHEN** `verifyEmailChangeOtp` responde éxito parcial (pendiente confirmación)
- **THEN** el modelo expone `pending_confirmation: true` para que la UI muestre el estado

### Requirement: Servicio de sesiones
`IdentityProfileApiService` (o servicio dedicado `IdentitySessionsApiService`) SHALL exponer `listSessions()` (con marca `current`), `revokeSession(id)` y `revokeOtherSessions()`.

#### Scenario: Listado con sesión actual
- **WHEN** el portal lista las sesiones
- **THEN** el modelo identifica la sesión actual y las fechas de última actividad

### Requirement: Servicio de cierre de cuenta
El servicio SHALL exponer `requestClosure(password, otp)`, `getClosure()` y `cancelClosure()`, tipando la máquina de estados (`requested | blocked | completed`) y el motivo de bloqueo.

#### Scenario: Cierre bloqueado tipado
- **WHEN** `getClosure()` devuelve estado bloqueado
- **THEN** el modelo expone `reason: 'ACTIVE_OBLIGATIONS'` y la referencia a la obligación para el deep-link

### Requirement: Errores anti-enumeración uniformes
Los métodos de cambio de contacto SHALL mapear las respuestas genéricas del backend sin inventar detalle: el error tipado distingue solo lo que el backend distingue (p.ej. `NOT_ELIGIBLE`, `RATE_LIMIT_EXCEEDED`, `OTP_LOCKED`).

#### Scenario: Error genérico preservado
- **WHEN** el backend responde no-elegibilidad genérica
- **THEN** el error mapeado no añade información sobre la existencia de otras cuentas
