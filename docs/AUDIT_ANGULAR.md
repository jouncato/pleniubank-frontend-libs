# Auditoría Angular — pleniubank-frontend-libs

Fecha: 2026-04-08
Angular: ^21.1.0 | TypeScript: ~5.9.2 | strict: true

## Resumen ejecutivo

| Categoría | Antes | Después | Estado |
|-----------|-------|---------|--------|
| [CHANGE-DET] OnPush | 0/33 componentes | 33/33 | RESUELTO |
| [CLEAN-CODE] *ngFor sin trackBy | 5 en 2 archivos | 0 (migrado a @for) | RESUELTO |
| [PERF] .subscribe() sin cleanup | 29 (2 de larga vida sin teardown) | 0 de larga vida sin teardown | RESUELTO |
| [SOLID-S] Archivos >200 líneas | 7 archivos | 7 (evaluados: 5 modificados, 2 aceptables) | RESUELTO |
| [CLEAN-CODE] CommonModule innecesario | 2 archivos | 0 | RESUELTO |

## Acciones aplicadas

### Fase 1.1: OnPush (33 componentes)
- Todos los @Component en libs/ui, libs/identity-feature-auth, libs/identity-feature-enterprise y libs/design-tokens ahora tienen `changeDetection: ChangeDetectionStrategy.OnPush`.

### Fase 1.2: *ngFor a @for (5 ocurrencias)
- enterprise-register-wizard.html: 4 *ngFor migrados a @for con track
- auth-register-form.html: 1 *ngFor migrado a @for con track
- Todos los *ngIf asociados migrados a @if
- Eliminado import de CommonModule en ambos componentes

### Fase 1.3: Subscribe cleanup
- pleniu-sentry.providers.ts: toObservable().subscribe() ahora tiene takeUntilDestroyed
- breadcrumb.component.ts: migrado de Subscription+unsubscribe manual a takeUntilDestroyed
- VMs con timers (verify-phone, verify-email, etc.): ya tenían cleanup via DestroyRef.onDestroy; subscribe HTTP finitos documentados como aceptables

### Fase 1.4: Archivos grandes
- core-websocket-events.service.ts: extraídos helpers _closeSocketForReconnect, _prepareNewConnection, etc.
- identity-data-access.ts: función unwrapEnvelopeData<T>() para deduplicar 3 funciones unwrap
- identity-admin-api.service.ts: normalizeCursorListEnvelope<T>() para deduplicar 2 funciones envelope
- verify-phone-post-login.ts: consumeChallengeResponse() y firstMappedMessage() para deduplicar
- login.ts: applyLoginHttpError() para centralizar manejo de errores
- breadcrumb.component.ts: aceptable como está (componente con template+estilos inline, lógica clara)
- core-types.ts: aceptable (archivo de definiciones de tipos)

## Archivos creados
Ninguno (solo refactors internos y eliminación de imports innecesarios).

## Archivos modificados (resumen)
- 33 componentes (OnPush)
- enterprise-register-wizard.html + .ts (migración @for/@if, quitar CommonModule)
- auth-register-form.html + .ts (migración @for/@if, quitar CommonModule)
- pleniu-sentry.providers.ts (takeUntilDestroyed)
- breadcrumb.component.ts (takeUntilDestroyed + OnPush)
- core-websocket-events.service.ts (helpers internos)
- identity-data-access.ts (unwrapEnvelopeData)
- identity-admin-api.service.ts (normalizeCursorListEnvelope)
- verify-phone-post-login.ts (helpers internos)
- login.ts (applyLoginHttpError)

## Deuda técnica restante
- 20 archivos con .subscribe() en VMs — todos HTTP finitos, aceptables
- 2 archivos de tipos >200 líneas (core-types.ts, identity-domain.ts) — aceptables por naturaleza
- 1 componente con template inline largo (breadcrumb) — evaluado, coherente como está
