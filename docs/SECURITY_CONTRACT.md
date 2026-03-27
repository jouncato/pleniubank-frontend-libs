# Contrato de seguridad — SDK `@pleniu/*`

Documento para equipos de frontend, seguridad y backend. Describe expectativas **a nivel cliente**; la autorización definitiva sigue siendo del servidor.

## Almacenamiento de sesión

- **`SessionStore`** (`@pleniu/shared-auth`) centraliza tokens y claims expuestos al resto de la app.
- No escribir tokens en `localStorage` desde features salvo decisión explícita de arquitectura documentada en ADR.

## JWT y cabeceras

- **`authTokenInterceptor`** (exportado como parte del módulo de auth): adjunta el Bearer de usuario a peticiones configuradas.
- **`tokenRefreshInterceptor`**: intenta renovar el access token cuando aplica (ver implementación y `AUTH_REFRESH_FN` / tokens de inyección en `shared-auth`).
- Las APIs PleniuBank esperan HTTPS en entornos reales; nunca documentar como soportado el envío de tokens sobre HTTP en producción.

## Admin (`adminGuard`)

Para rutas protegidas con `adminGuard` se exige:

1. `userToken` presente en sesión.
2. `adminToken` presente.
3. Claim `role === 'admin'` en el objeto de claims servido por `SessionStore`.

Si falla, la navegación va a `/auth/forbidden`. Los portales deben declarar ruta equivalente a `ForbiddenView` donde corresponda (backoffice y customer lo tienen bajo `/auth/forbidden` en sus `app.routes.ts`).

## CSRF

- Existe **`csrfInterceptor`** en `shared-auth` para escenarios que lo requieran. Habilitar solo cuando el backend defina el contrato (cabeceras/cookies).

## Errores y PII

- No loguear tokens ni contraseñas.
- Los errores de API deben mapearse a mensajes de usuario sin filtrar stack traces internos.

## correlation_id

Los clientes HTTP de PleniuBank deben propagar o mostrar `correlation_id` del envelope cuando el producto lo defina (`shared-http` / features). Ver documentación central en `docs/frontend` del monorepo de servicios.

## Superficie de dependencias

Mantener `@pleniu/*` actualizadas ante parches de seguridad de Angular y RxJS. Ejecutar `npm audit` en CI del repo de libs y de cada portal.
