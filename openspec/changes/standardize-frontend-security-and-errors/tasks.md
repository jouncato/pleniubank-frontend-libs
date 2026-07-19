## 1. Prerrequisitos backend

> **BLOQUEADO (2026-07-19)** — Se investigó `pleniubank-identity-service` (grep exhaustivo
> sobre `src/`) y el backend emite cookies/CSRF (`issue_csrf_cookie`) pero **no valida en
> ningún endpoint** el header `X-CSRF-Token` contra la cookie emitida (no hay
> comparación/verificación de CSRF en las rutas de mutación autenticadas por cookie).
> Tampoco existe el endpoint de ticket WebSocket efímero de un solo uso (1.3). Forzar
> `httpOnlyCookie` como única estrategia (sección 2) sin CSRF real sería una regresión de
> seguridad disfrazada de mejora: quedaría expuesto a CSRF clásico en todas las mutaciones
> autenticadas por cookie. Decisión explícita del usuario: no avanzar 1.x/2.x/4.x hasta que
> Identity implemente 1.1-1.3. Solo se implementó la sección 3 (contrato único de errores),
> que es puramente frontend y no depende de este prerrequisito.

- [ ] 1.1 Definir dominios, atributos HttpOnly/Secure/SameSite, CORS, expiración, renovación y cierre de sesión.
- [ ] 1.2 Implementar y probar protección CSRF y validación de Origin para mutaciones autenticadas por cookie.
- [ ] 1.3 Implementar endpoint de ticket WebSocket efímero, de un uso y con TTL corto para escenarios cross-site.

## 2. Sesión web segura

> **BLOQUEADO** — depende de 1.x (ver nota arriba). No se tocó `session-strategy.token.ts`,
> `csrf.interceptor.ts`, `identity-csrf-bootstrap.ts`, `session-store.service.ts` ni ningún
> otro archivo de sesión/cookies/WebSocket en esta iteración.

- [ ] 2.1 Hacer `httpOnlyCookie` la única estrategia posible en builds productivos de `shared-auth`.
- [ ] 2.2 Migrar Customer Portal y Backoffice y eliminar persistencia productiva de access, refresh y admin tokens en Web Storage.
- [ ] 2.3 Retirar `?token=<JWT>` de WebSocket y usar cookie same-site o ticket efímero.
- [ ] 2.4 Añadir gates estáticos y de build que impidan tokens en URL o Web Storage productivo.

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

> **BLOQUEADO** — depende de 1.x/2.x (ver nota en sección 1). No aplica todavía.

- [ ] 4.1 Validar login, refresh, logout, CSRF y WebSocket en QA con la topología real de dominios.
- [ ] 4.2 Ejecutar pruebas XSS/CSRF, inspección de storage/URLs/logs y regresión en ambos portales.
- [ ] 4.3 Publicar guía de migración y rollback para consumidores de las librerías.
- [ ] 4.4 Adjuntar evidencias de Producto/Seguridad/QA y aprobación nominativa antes de archivar.
