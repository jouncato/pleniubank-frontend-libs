# ADR-005: Centralización de Guards de Autenticación/Autorización en `shared-auth`

**Fecha:** 2026-04-08
**Estado:** Aceptado
**Personas:** Equipo Frontend PleniuBank

---

## Contexto

Los tres portales de PleniuBank necesitan controlar el acceso a sus rutas según el estado de autenticación y los roles del usuario. Sin una estrategia centralizada, cada portal implementaría su propia versión de `authGuard`, `adminGuard`, etc. — potencialmente con diferencias sutiles en la lógica de redirección, validación del token o comprobación de roles.

El riesgo en una plataforma bancaria es directo: un bug de seguridad en un guard que solo se corrige en un portal deja los otros dos vulnerables.

## Decisión

**Todos** los guards funcionales de autenticación y autorización residen exclusivamente en la librería `shared-auth`. Ningún portal implementa sus propios guards de autenticación.

Guards centralizados en `shared-auth`:

| Guard | Propósito | Portales que lo usan |
|---|---|---|
| `authGuard` | Requiere usuario autenticado; redirige a `/auth/login` si no | backoffice, customer, public |
| `guestGuard` | Solo para usuarios NO autenticados; redirige al home si ya está logueado | backoffice, customer, public |
| `adminGuard` | Requiere rol `admin`; redirige a `/auth/forbidden` | backoffice |
| `enterpriseScopeGuard` | Requiere scope empresarial B2B activo | customer |
| `personalScopeGuard` | Requiere scope personal B2C activo | customer |
| `phoneVerifiedGuard` | Requiere número de teléfono verificado | customer, public |
| `auditAccessGuard` | Requiere permiso de auditoría | backoffice |
| `platformInternalOpsGuard` | Requiere permiso de operaciones internas | backoffice |
| `roleGuard` | Guard genérico parametrizable por rol | backoffice, customer |

```typescript
// app.routes.ts de cualquier portal
import { authGuard, adminGuard, guestGuard } from 'shared-auth';

{
  path: 'admin',
  canActivate: [authGuard, adminGuard],
}
```

## Justificación

- **Opción Seleccionada:** Centralización total en `shared-auth`
  - ✅ Un fix de seguridad en `authGuard` se aplica a los tres portales simultáneamente
  - ✅ La lógica de validación del JWT es idéntica en todos los portales — no puede divergir
  - ✅ Los guards funcionales son simples de testear en la librería: `inject(SessionStore)` con un mock
  - ✅ Agregar un nuevo guard (ej. `mfaRequiredGuard`) lo hace disponible para todos sin trabajo adicional
  - ⚠️ Algunos guards son específicos de un portal (ej. `enterpriseScopeGuard` solo en customer) pero conviene mantenerlos en `shared-auth` como infraestructura de plataforma

- **Opciones Rechazadas:**
  - **Guards en cada portal:** Si se descubre un bypass de seguridad, hay que parchearlo en tres repositorios. En plataformas bancarias esto es inaceptable.
  - **Guards en el portal que los originó + copiar cuando otro portal los necesita:** Garantiza divergencia con el tiempo.

## Consecuencias

### Positivas
- El equipo de seguridad puede auditar todos los guards de la plataforma en un solo directorio
- Cuando se añada MFA obligatorio, el nuevo `mfaRequiredGuard` en `shared-auth` estará disponible para los tres portales sin trabajo adicional
- La cobertura de tests de `shared-auth` es la cobertura de seguridad de toda la plataforma frontend

### Negativas / Riesgos Mitigados
- **Riesgo:** Un guard específico de customer-portal en `shared-auth` puede confundir sobre su propósito
  - **Mitigación:** La nomenclatura descriptiva (`enterpriseScopeGuard`) aclara el contexto de uso; el código de `backoffice-portal` simplemente no lo incluye en ninguna ruta
- **Riesgo:** `shared-auth` crece demasiado si cada portal añade guards muy específicos
  - **Mitigación:** Aplicar ADR-001: si el guard es genuinamente específico de un portal y nunca será compartido, puede vivir en el portal. Pero el umbral debe ser alto.

### Impacto en Futuras Decisiones
- Cualquier nuevo mecanismo de autorización (roles granulares, permisos por feature flag) debe implementarse como un nuevo guard en `shared-auth`, no como lógica inline en componentes
- La `SessionStore` de `shared-auth` es la única fuente de verdad para el estado de autenticación en el frontend

## Referencias Técnicas
- `libs/shared-auth/src/lib/guards/` — directorio con todos los guards
- `libs/shared-auth/src/public-api.ts` — exports de guards
- `pleniubank-backoffice-portal/src/app/app.routes.ts` — ejemplo de uso

## Archivos Afectados

| Ruta | Tipo de Cambio |
|------|---------------|
| `libs/shared-auth/src/lib/guards/*.ts` | Implementación de los 9 guards |
| `libs/shared-auth/src/public-api.ts` | Export público de todos los guards |
| `pleniubank-*/src/app/app.routes.ts` | Consumo de guards en la configuración de rutas |
