## Context

`SESSION_STRATEGY` permite cookies, pero el default es `sessionStorage`; WebSocket añade `?token=`. Los dos mapeadores de error se usan con semánticas distintas.

## Goals / Non-Goals

**Goals:** cookies HttpOnly en producción, WS sin bearer en URL y una API única de errores.

**Non-Goals:** eliminar storage para estado no sensible o mostrar detalles internos del backend.

## Decisions

- Producción usa `httpOnlyCookie`; modo bearer/storage solo existe bajo flag de desarrollo imposible de activar en builds prod.
- WebSocket usa cookie same-site cuando sea posible; cross-site usa ticket efímero, de un uso y TTL corto obtenido por HTTPS.
- Crear `resolveUserFacingApiError(error, context)` como API canónica; preservar overrides de contexto sin duplicar catálogos.
- Añadir reglas estáticas que fallen ante `?token=`, escritura de JWT en storage o nuevos mapeadores locales.

## Risks / Trade-offs

- [CSRF] → SameSite, token CSRF y validación de Origin.
- [Dominios separados] → ticket WS efímero, nunca access token.
- [Mensajes pierden contexto] → contexto tipado y fallbacks por feature.

## Migration Plan

Publicar APIs aditivas, migrar portales, activar cookies/WS ticket en QA, retirar APIs legacy y endurecer gates de build.
