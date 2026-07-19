# Rollout: sesión por cookie HttpOnly + CSRF real + WebSocket sin token en URL

## Contexto

El problema original — "Sesiones productivas siguen usando `sessionStorage` y JWT en
WebSocket" — no requería construir nada nuevo: la validación CSRF double-submit-cookie,
la emisión de cookies HttpOnly y la autenticación del WebSocket vía cookie ya estaban
implementadas y probadas en 3 repos. Solo estaban apagadas por flags, todos con default
`false`/`sessionStorage`:

| Repo | Mecanismo | Flag / config | Código |
|---|---|---|---|
| `pleniubank-core` | Validación CSRF double-submit-cookie (`hmac.compare_digest`) | `CSRF_DOUBLE_SUBMIT_ENABLED` | `src/config/settings.py:207-209`, `src/api/v1/middleware/jwt_bearer.py:234-250` |
| `pleniubank-identity-service` | Emisión de cookies HttpOnly (`pleniu_access`/`pleniu_admin_access`) + cookie CSRF (`pleniu_csrf`) | `AUTH_COOKIE_ENABLED` | `src/infrastructure/settings.py:75-81`, `src/api/auth_cookies.py` |
| `pleniubank-frontend-libs` (`shared-auth`/`shared-http`) | `SessionStore` en modo cookie, bootstrap de CSRF, WS sin `?token=` | `SESSION_STRATEGY` (Angular `InjectionToken`, `environment.sessionStrategy`) | `libs/shared-auth/src/lib/session-store.service.ts:68-104`, `identity-csrf-bootstrap.ts`, `libs/shared-http/.../core-websocket-events.service.ts` |

Este cambio activa esos flags de forma segura en **local y QA**. Producción queda
deliberadamente fuera de alcance (ver checklist al final) porque:

1. `pleniubank-customer-portal`/`pleniubank-backoffice-portal` construían **una sola
   imagen Docker** (configuración Angular `production`) y la desplegaban tal cual a QA.
   No existe hoy un job `deploy-production` en ninguno de los dos `ci-cd.yml` — production
   no se toca desde ese pipeline todavía.
2. Cambiar `sessionStrategy` directamente en `environment.ts` (el archivo de producción)
   habría hecho que, el día que se promueva esa imagen a producción, el frontend dependiera
   de cookies que el backend de producción no emite — rompiendo login. Por eso se creó una
   configuración Angular `qa` genuinamente distinta.
3. `AUTH_COOKIE_SECURE=true` (default) hace que el navegador descarte silenciosamente la
   cookie sobre `http://localhost` (los cookies `Secure` no tienen excepción para
   `localhost`) — debe desactivarse solo en desarrollo local.
4. QA corre bajo un solo host (`mvp.pleniu.net`, ruteo por path) → cookie host-only sin
   `Domain=`. Producción tiene subdominios separados (`app.pleniu.co`,
   `backoffice.pleniu.co`) sin ingress de identity/core todavía — un problema de
   infraestructura aparte, fuera de alcance aquí.

## Tabla de flags por entorno

| Flag | dev (local) | qa | prod |
|---|---|---|---|
| `AUTH_COOKIE_ENABLED` (identity-service) | `true` | `true` | `false` (sin cambios) |
| `AUTH_COOKIE_SECURE` (identity-service) | `false` (obligatorio sobre HTTP) | `true` (default, HTTPS real) | `true` (default) |
| `AUTH_COOKIE_DOMAIN` (identity-service) | vacío (host-only) | vacío (host-only, un solo host `mvp.pleniu.net`) | pendiente: `.pleniu.co` |
| `CSRF_DOUBLE_SUBMIT_ENABLED` (core) | `true` | `true` | `false` (sin cambios) |
| `sessionStrategy` (Angular, ambos portales) | `httpOnlyCookie` (`environment.development.ts`) | `httpOnlyCookie` (`environment.qa.ts`, nuevo) | `sessionStorage` (`environment.ts`, sin cambios) |

## Cómo probar localmente

1. Arrancar `pleniubank-identity-service` (puerto 8005, con `.env` actualizado:
   `AUTH_COOKIE_ENABLED=true`, `AUTH_COOKIE_SECURE=false`).
2. Arrancar `pleniubank-core` (puerto 8000, con `.env` actualizado:
   `CSRF_DOUBLE_SUBMIT_ENABLED=true`).
3. Arrancar `pleniubank-customer-portal` (`ng serve`, puerto 4200) o
   `pleniubank-backoffice-portal` (puerto 4205) — ambos ya usan
   `environment.development.ts` con `sessionStrategy: 'httpOnlyCookie'`.
4. Iniciar sesión real en el navegador. Confirmar en DevTools → Application → Cookies:
   `pleniu_access` (HttpOnly, no legible por JS) y `pleniu_csrf` (legible) presentes bajo
   `localhost`; `sessionStorage` de la pestaña **vacío** de tokens.
5. Ejecutar una mutación real (ej. un POST autenticado desde la UI) y confirmar en la
   pestaña Network que el request lleva `X-CSRF-Token` y responde 200 (no 401
   `CSRF_VALIDATION_FAILED`).
6. Confirmar en la pestaña Network que la conexión WebSocket a `/ws/events` **no** lleva
   `?token=` en la URL, y que el chip de "tiempo real" del portal llega a estado
   `connected`.
7. Correr `ng test --watch=false` en ambos portales y en `shared-auth`/`shared-http` de
   `frontend-libs` para confirmar que nada existente se rompe con el nuevo default local.

## Cómo funciona en QA

- `pleniubank-infra-platform`: `AUTH_COOKIE_ENABLED`/`CSRF_DOUBLE_SUBMIT_ENABLED` se
  definen como `"false"` explícito en los ConfigMaps base de identity-service/core, y se
  parchan a `"true"` en `overlays/qa/kustomization.yaml`. El overlay `prod` no se toca —
  hereda `"false"` del base.
- `customer-portal`/`backoffice-portal`: nueva configuración Angular `qa` en
  `angular.json` (`fileReplacements` → `environment.qa.ts`, copia de los valores de
  producción con `sessionStrategy: 'httpOnlyCookie'`). El job `build` de `ci-cd.yml`
  ahora construye **dos** imágenes: la existente (`:${{ github.sha }}`/`:latest`,
  configuración `production`, sin cambios) y una nueva
  (`:qa-${{ github.sha }}`, `--build-arg NG_BUILD_CONFIGURATION=qa`). `deploy-qa` usa
  la imagen `qa-${{ github.sha }}`.
- Tras el despliegue, repetir los pasos 4-6 de la sección anterior contra
  `https://mvp.pleniu.net`.

## Checklist para activar producción (no ejecutado en este cambio)

1. Exponer `identity-service`/`core` en el dominio de producción — hoy sin ingress en el
   overlay `prod-frontend` de `pleniubank-infra-platform` (gap de infraestructura a
   resolver primero).
2. Definir `AUTH_COOKIE_DOMAIN=.pleniu.co` en el overlay `prod` de identity-service
   (cookie cruzada entre `app.pleniu.co`/`backoffice.pleniu.co`).
3. Cambiar `AUTH_COOKIE_ENABLED`/`CSRF_DOUBLE_SUBMIT_ENABLED` a `"true"` en los overlays
   `prod` de identity-service/core.
4. Cambiar `sessionStrategy` en `environment.ts` (el archivo de producción, hoy separado
   del de QA) a `'httpOnlyCookie'` — único cambio de código necesario en ese momento.
5. Confirmar que existe un pipeline real de despliegue a producción (hoy no existe
   `deploy-production` en ninguno de los dos `ci-cd.yml`) antes de asumir que este flag
   por sí solo llega a usuarios reales.
