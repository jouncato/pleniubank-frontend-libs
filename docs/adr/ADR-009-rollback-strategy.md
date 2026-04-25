# ADR-009: Estrategia de Rollback del Customer Portal Epic

## Estado

Aceptado.

## Contexto

El epic modifica frontend compartido, portal, Identity y Core. No todos los cambios tienen el mismo riesgo ni el mismo mecanismo de reversión: UI reversible por flag, contratos backend que requieren compatibilidad, y migraciones que no siempre pueden deshacerse de forma segura.

## Decisión

Usar rollback proporcional al tipo de cambio:

- UI detrás de feature flag: apagar flag y redeploy solo si el bundle necesita ajuste.
- Integraciones frontend-backend: apagar flag, conservar clientes compatibles y monitorear errores.
- Backend sin migración destructiva: revert de commit y redeploy.
- Migraciones append-only o catálogos: revert lógico con nueva migración compensatoria.
- Migraciones destructivas: prohibidas para este epic sin plan de backup, ventana y aprobación.

Los endpoints nuevos deben aceptar que clientes antiguos sigan operando. Los clientes nuevos deben fallar cerrado para features sensibles cuando el backend no confirma soporte.

## Consecuencias

- La reversión prioriza proteger usuarios y datos antes que dejar el código "limpio".
- Los flags no sustituyen pruebas ni monitoreo; reducen el blast radius durante activación gradual.
- Toda ola con backend debe declarar si su rollback es por flag, revert, migración compensatoria o canary.

## Señales de go/no-go

- Error rate HTTP por encima del umbral acordado en rutas nuevas.
- Aumento sostenido de eventos Sentry en el portal.
- Respuestas `401/403/422/501` inesperadas en flujos flaggeados.
- Evidencia de datos cruzados entre empresas después de `switch-context`.
