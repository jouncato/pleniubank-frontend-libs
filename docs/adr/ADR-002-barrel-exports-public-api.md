# ADR-002: Barrel Exports vía `public-api.ts` como Contrato de Librería

**Fecha:** 2026-04-08
**Estado:** Aceptado
**Personas:** Equipo Frontend PleniuBank

---

## Contexto

Cada librería de `pleniubank-frontend-libs` contiene múltiples archivos internos (servicios, guards, DTOs, interceptors, helpers). Sin un mecanismo de encapsulación, los portales consumidores podrían importar directamente desde rutas internas como `shared-auth/src/lib/guards/auth.guard.ts`. Esto crea acoplamiento con la estructura interna — si se reorganiza un archivo, todos los portales se rompen.

Adicionalmente, los path aliases de TypeScript en cada portal apuntan a un único archivo de entrada, por lo que se necesita un punto de entrada explícito por librería.

## Decisión

Cada librería tiene un archivo `src/public-api.ts` que actúa como **único punto de entrada y contrato público** de la librería. Solo los símbolos re-exportados en `public-api.ts` son importables por los portales. Los portales **nunca** importan desde rutas internas de una librería.

```typescript
// libs/shared-auth/src/public-api.ts
export { authGuard } from './lib/guards/auth.guard';
export { adminGuard } from './lib/guards/admin.guard';
export { guestGuard } from './lib/guards/guest.guard';
export { SessionStore } from './lib/session/session.store';
export { SESSION_STRATEGY } from './lib/session/session-strategy.token';
export { authTokenInterceptor } from './lib/interceptors/auth-token.interceptor';
// ... resto de exports públicos
```

```typescript
// En el portal — correcto
import { authGuard, SessionStore } from 'shared-auth';

// En el portal — PROHIBIDO
import { authGuard } from '../../../pleniubank-frontend-libs/libs/shared-auth/src/lib/guards/auth.guard';
```

Los path aliases del `tsconfig.json` de cada portal apuntan directamente a `public-api.ts`:
```json
"paths": {
  "shared-auth": ["../pleniubank-frontend-libs/libs/shared-auth/src/public-api.ts"]
}
```

## Justificación

- **Opción Seleccionada:** `public-api.ts` como barrera de encapsulación
  - ✅ Cambios internos en la estructura de archivos de una librería no rompen los portales
  - ✅ El contrato público es explícito y revisable en un solo archivo
  - ✅ Facilita future-proofing: se pueden reorganizar internals sin breaking changes
  - ✅ Compatible con el mecanismo de path aliases de TypeScript (un único alias → un único archivo)
  - ⚠️ Agregar un nuevo símbolo público requiere editar `public-api.ts` — un paso adicional

- **Opciones Rechazadas:**
  - **Importar rutas internas directamente:** Acoplamiento con la estructura de archivos; any refactor interno rompe portales
  - **Index barrel en cada subdirectorio:** Múltiples puntos de entrada, ambigüedad sobre qué es público

## Consecuencias

### Positivas
- La interfaz pública de `shared-auth` puede auditarse en ~30 líneas de `public-api.ts`
- Refactors internos (ej. dividir `session.store.ts` en múltiples archivos) son transparentes para los portales si los exports se mantienen
- Al hacer code review de una librería, `public-api.ts` es el primer archivo que revisar

### Negativas / Riesgos Mitigados
- **Riesgo:** Olvidar agregar un nuevo símbolo a `public-api.ts` genera un error de importación en el portal
  - **Mitigación:** El error es inmediato y explícito en TypeScript — no es un bug silencioso

### Impacto en Futuras Decisiones
- Toda nueva librería que se agregue a `pleniubank-frontend-libs` debe incluir `src/public-api.ts` como primer archivo creado
- Los portales no deben instalar dependencias directas a librerías sin path alias configurado

## Referencias Técnicas
- `libs/shared-auth/src/public-api.ts`
- `libs/core-data-access/src/public-api.ts`
- Path aliases en `pleniubank-backoffice-portal/tsconfig.json`

## Archivos Afectados

| Ruta | Tipo de Cambio |
|------|---------------|
| `libs/*/src/public-api.ts` | Archivo de contrato público por librería |
| `portal/tsconfig.json` | Path aliases apuntan a `public-api.ts` |
