# Standardize frontend security and errors — tasks

## 1. Prerrequisitos backend

> **RESUELTO (2026-07-19)** — Validación CSRF double-submit implementada en ambos backends:
>
> - `pleniubank-core`: `CSRF_DOUBLE_SUBMIT_ENABLED` preexistente.
> - `pleniubank-identity-service`: `CSRF_DOUBLE_SUBMIT_ENABLED` implementado en
>   `src/api/deps.py:_verify_csrf_for_cookie_auth`, aplicado a `access_token_from_request` y
>   `get_admin_claims` para mutaciones autenticadas por cookie; 6 tests en
>   `tests/test_csrf_double_submit.py`. Activado en overlay QA de `pleniubank-infra-platform`.
> Activado y **probado en vivo en navegador real** (login de staff en backoffice-portal):
> `pleniu_csrf` presente, `X-CSRF-Token` enviado automáticamente en POST/PUT/PATCH/DELETE,
> `pleniu_access`/`pleniu_admin_access` HttpOnly. Ver `docs/session-strategy-rollout.md`.

- [x] 1.1 Definir dominios, atributos HttpOnly/Secure/SameSite, CORS, expiración, renovación y cierre de sesión.
  - `pleniubank-identity-service`: `AUTH_COOKIE_ENABLED`, `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_SAMESITE` (`src/infrastructure/settings.py:75-81`). Local: `AUTH_COOKIE_SECURE=false` (obligatorio sobre `http://localhost`). QA: host único `mvp.pleniu.net`, sin `AUTH_COOKIE_DOMAIN` (host-only). Prod (subdominios separados `app.pleniu.co`/`backoffice.pleniu.co`): **pendiente**, requiere `AUTH_COOKIE_DOMAIN=.pleniu.co` + exponer identity/core en esos dominios (gap de infraestructura, ver sección 4 del runbook).
- [x] 1.2 Implementar y probar protección CSRF y validación de Origin para mutaciones autenticadas por cookie.
  - `pleniubank-core`: `CSRF_DOUBLE_SUBMIT_ENABLED` activado en local y en overlay QA.
  - `pleniubank-identity-service`: `CSRF_DOUBLE_SUBMIT_ENABLED` añadido, validación en `src/api/deps.py`, activado en overlay QA, 6 tests en `tests/test_csrf_double_submit.py`.
- [x] 1.3 ~~Implementar endpoint de ticket WebSocket efímero~~ — **no aplica al alcance decidido (2026-07-19: solo QA)**.
  - Lo que se implementó en su lugar (ya existente en `shared-http`, no nuevo de esta iteración) es auth por **cookie same-site directa**: `CoreWebSocketEventsService.connectCookieAuth()` conecta a `/ws/events` sin `?token=`, y `pleniubank-core` (`ws_events.py`) lee el JWT de la cookie `pleniu_access`/`pleniu_admin_access` cuando no hay query param. Verificado en vivo: conexión sin `?token=` en la URL, estado "conectado" en la UI. Esto cubre completamente el caso same-site (local y QA, que comparten host `mvp.pleniu.net`). El ticket efímero cross-site solo sería necesario si producción (subdominios separados `app.pleniu.co`/`backoffice.pleniu.co`) entrara en alcance — explícitamente fuera de alcance de este change.

## 2. Sesión web segura

> **EN PROGRESO (2026-07-19)** — activado y verificado en local + configurado (no desplegado)
> en QA. Producción deliberadamente sin tocar — ver nota de 2.1.

- [x] 2.1 ~~Hacer `httpOnlyCookie` la única estrategia posible en builds productivos~~ — **alcance decidido (2026-07-19): solo QA, producción explícitamente fuera de alcance de este change**.
  - `qa` (nueva configuración Angular, `environment.qa.ts`) usa `httpOnlyCookie`; `production` (`environment.ts`) permanece en `sessionStorage`, sin cambios y sin fecha de cutover — decisión explícita del usuario, no una omisión. Activar cookies en producción requiere primero resolver la infraestructura de subdominios (ver `docs/session-strategy-rollout.md`, checklist de producción) y es un change/decisión aparte cuando llegue ese momento.
- [x] 2.2 Migrar Customer Portal y Backoffice y eliminar persistencia productiva de access, refresh y admin tokens en Web Storage.
  - `environment.development.ts` (ambos portales) y `environment.qa.ts` (nuevo, ambos portales) en `httpOnlyCookie` — `SessionStore` ya no escribe en `sessionStorage` en ese modo (`session-store.service.ts`, comportamiento preexistente, sin cambios). `environment.ts` (producción) sin cambios, sigue en `sessionStorage`.
- [x] 2.3 Retirar `?token=<JWT>` de WebSocket y usar cookie same-site o ticket efímero.
  - Cookie same-site (`connectCookieAuth()`), ver nota de 1.3. Ya no se usa `?token=` cuando `SESSION_STRATEGY=httpOnlyCookie`.
- [x] 2.4 Añadir gates estáticos y de build que impidan tokens en URL o Web Storage productivo.
  - `scripts/check-no-token-in-prod-build.sh` (nuevo, mismo patrón que `check-icon-regressions.sh`): en `pleniubank-frontend-libs` falla si aparece un nuevo sitio con `?token=` en una URL fuera del único lugar auditado (`core-websocket-events.service.ts`, rama bearer explícita) o una escritura de token en Web Storage fuera de `SessionStore`/el handoff legacy ya documentado (`portal-dev-token-handoff.ts`, gateado por `allowCrossOriginTokenHandoff`). En `pleniubank-customer-portal`/`pleniubank-backoffice-portal` (que no construyen la URL de WS directamente) solo valida la escritura en Web Storage. Verificado sin falsos positivos en los 3 repos. Wireado como job `session-security-lint` en el `ci.yml`/`ci-cd.yml` de los 3 repos.
  - Encontrados y corregidos en el camino 3 bugs reales que habrían bloqueado el modo cookie en producción el día que se active: `auth.guard.ts`, `admin.guard.ts`, `guest.guard.ts` (`libs/shared-auth`) comparaban `sessionStore.userToken()`/`adminToken()` para decidir si redirigir a login — ambos son siempre `null` por diseño en modo `httpOnlyCookie`, así que el guard rebotaba a login sin importar que la sesión por cookie fuera válida. Corregido: `authGuard` llama a `validateHandler()` en vez de exigir un token local cuando la estrategia es `httpOnlyCookie`; `adminGuard` se apoya en `claims()` (ya poblado por `authGuard`) en vez de `userToken()`/`adminToken()`; `guestGuard` usa `isAuthenticated()` (ya sensible a la estrategia) en vez de `userToken()`. Tests nuevos en `auth.guard.spec.ts` cubriendo el modo cookie. 81/81 tests de `shared-auth` en verde.

## 3. Contrato único de errores

> **DONE (2026-07-19)** — implementado en `pleniubank-frontend-libs` y migrado en
> `pleniubank-customer-portal`. `pleniubank-backoffice-portal` no consumía ninguno de los
> dos resolutores legacy (verificado por grep), por lo que no requirió cambios.

- [x] 3.1 Implementar `resolveUserFacingApiError(error, context)` con catálogo central, overrides tipados y fallback seguro.
  - `libs/shared-http/src/lib/resolve-user-facing-api-error.ts` (frontend-libs), exportado desde `libs/shared-http/src/public-api.ts`.
  - Catálogo central migrado tal cual desde `mapApiErrorToUserMessage` (20 códigos), sin cambiar ningún texto.
- [x] 3.2 Migrar usos de `resolveApiErrorMessage`, `mapApiErrorToUserMessage` y mapeadores locales en librerías y portales.
  - `libs/identity-feature-auth/src/lib/lib/vm/{login,register,verify-email,verify-phone,verify-phone-post-login}.ts` (frontend-libs): 15 call sites migrados, con `overrides` donde el fallback local original difería del catálogo central (ver detalle en el reporte de la tarea).
  - `libs/shared-http/src/lib/http-error-reporting.interceptor.ts` (frontend-libs): consumidor adicional encontrado por grep de verificación final (no estaba en el relevamiento inicial de 14/15 sitios); interceptor global de toasts de error 5xx/red, sin `context`, migrado 1:1.
  - `pleniubank-customer-portal`: `breb-keys.vm.ts` (x3), `transfer-create.vm.ts`, `email-change-confirm-page.ts`, `personal-profile.vm.ts` (x9), `sessions.vm.ts` (x3) — 17 call sites, sin `context` (paridad 1:1 con el comportamiento anterior, que tampoco tenía contexto).
  - `pleniubank-backoffice-portal`: sin usos de ninguno de los dos resolutores (confirmado por grep) — no requiere cambios.
- [x] 3.3 Eliminar/deprecar APIs legacy y añadir un gate que evite nuevos resolutores paralelos.
  - `resolveApiErrorMessage` (`api-error-message.ts`) y `mapApiErrorToUserMessage` (`error-message.mapper.ts`) marcadas `@deprecated` (JSDoc), no eliminadas (posibles consumidores fuera de este workspace).
  - Gate nuevo: `scripts/check-error-mapper-regressions.sh` (mismo patrón que `scripts/check-icon-regressions.sh` de `unify-financial-svg-iconography`), falla si aparece un `switch` sobre un código de error API fuera de `resolve-user-facing-api-error.ts` o de los dos resolutores legacy tolerados. Wireado en `.github/workflows/ci.yml` (job `error-mapper-lint`).
- [x] 3.4 Probar accesibilidad, localización, cuerpos inválidos, códigos desconocidos y manejo de correlation ID.
  - `libs/shared-http/src/lib/resolve-user-facing-api-error.spec.ts`: catálogo central (21 códigos), overrides de contexto, fallback por status (0/429/501) y genérico, cuerpo de error vacío/código vacío sin lanzar excepción, texto plano sin HTML, catálogo 100% en español (sin texto técnico en inglés), y correlationId nunca presente en el mensaje visible (3 escenarios: código conocido, código desconocido, fallback por status).

## 4. Rollout y cierre

> **PARCIAL (2026-07-19)** — alcance de este change confirmado como **solo QA**
> (producción queda fuera, es una decisión/change aparte más adelante). Verificación
> local completa; falta la validación contra el despliegue real de QA.

- [x] 4.1a Validar login, refresh (implícito vía `authGuard`/`validateHandler`), CSRF y WebSocket **localmente** con `identity-service` + `core` + `customer-portal`/`backoffice-portal` corriendo en la máquina de desarrollo.
- [ ] 4.1b Repetir la validación contra `https://mvp.pleniu.net` después de desplegar la configuración `qa` (pendiente de un despliegue real a QA).
- [ ] 4.2 Ejecutar pruebas XSS/CSRF, inspección de storage/URLs/logs y regresión en ambos portales, en QA (más allá de la verificación manual local ya hecha).
- [x] 4.3 Publicar guía de migración y rollback para consumidores de las librerías.
  - `docs/session-strategy-rollout.md` (este repo): tabla de flags por entorno, pasos de prueba local, y checklist explícito para (más adelante) activar producción.
- [ ] 4.4 Adjuntar evidencias de QA (login/CSRF/WS reales en `mvp.pleniu.net`) antes de archivar. Sign-off de Producto/Seguridad para producción **no aplica** a este change — queda documentado como trabajo futuro, no como bloqueante de cierre.
