## Why

Durante una prueba E2E manual del registro de empresa (portal cliente), un código OTP expirado mostró el mensaje genérico "Datos inválidos. Reinicia el proceso de registro." en vez del mensaje específico y accionable que el propio componente ya tenía redactado ("El código expiró. Puedes solicitar uno nuevo con «Reenviar código»."). El bug está en el orden de prioridad de un mapeo de errores: el fallback genérico por código HTTP se evalúa antes que el diccionario de mensajes específicos por causa de negocio, así que ningún mensaje específico para errores 422 llega a mostrarse nunca.

## What Changes

- Reordenar `verifyEnterpriseEmailUserMessage()` en `libs/identity-feature-enterprise/src/lib/vm/verify-enterprise-email.ts` para que el lookup en el diccionario `known` (mensajes específicos por causa: código expirado, código incorrecto, demasiados intentos, etc.) tenga prioridad sobre el fallback genérico de `status === 422`. El fallback genérico solo debe verse cuando el backend manda un detalle no contemplado en `known`.
- Sin cambios de contrato de API ni de las claves del diccionario `known` — es un fix de precedencia, no de contenido.

## Capabilities

### New Capabilities
- `enterprise-onboarding-error-messaging`: contrato de qué mensaje de error debe mostrarse al usuario durante el registro y verificación de empresas (principal/admin), priorizando siempre el mensaje más específico disponible sobre un fallback genérico por código HTTP.

### Modified Capabilities
(ninguna — no existe spec previo para este comportamiento)

## Impact

- **Código**: `libs/identity-feature-enterprise/src/lib/vm/verify-enterprise-email.ts` (función `verifyEnterpriseEmailUserMessage`, consumida por `customer-portal` y `backoffice-portal` vía el paquete `@pleniu/identity-feature-enterprise`).
- **Consumidores**: cualquier portal que use el componente de verificación de correo empresarial se beneficia sin cambios propios (la lib es compartida vía symlink/workspace).
- **Sin cambios de API**: el backend (`identity-service`) ya devuelve el detalle correcto (`"Verification code expired"`); el fix es puramente de precedencia en el frontend.
