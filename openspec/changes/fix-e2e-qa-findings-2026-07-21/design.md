## Context

`verifyEnterpriseEmailUserMessage(status, raw)` decide qué texto mostrar cuando falla la verificación de correo de un principal/admin de empresa. Recibe el status HTTP y el `message` que manda el backend. Actualmente evalúa primero `status === 422` y retorna un texto genérico antes de mirar el diccionario `known`, que ya mapea el `raw` message a un texto específico y accionable para varios casos de negocio conocidos (código expirado, incorrecto, bloqueado, etc.) — todos ellos llegan como 422 desde el backend, así que el diccionario `known` nunca se alcanza en la práctica.

## Goals / Non-Goals

**Goals:**
- Que cualquier mensaje de error ya mapeado en `known` se muestre tal cual, sin importar el status HTTP con el que venga.
- Mantener el fallback genérico de 422 como red de seguridad para mensajes no contemplados en `known`.

**Non-Goals:**
- No se cambia el contenido de los mensajes existentes en `known`.
- No se toca `resendEnterpriseOtpUserMessage` (función hermana) salvo que se detecte el mismo patrón — se revisa como tarea separada si aplica.

## Decisions

- **Mover el chequeo de `known[key]` antes del `if (status === 422)`**: es el cambio mínimo que resuelve el bug sin reescribir la función. Alternativa descartada: eliminar el branch de 422 por completo — se mantiene como fallback porque el backend puede introducir nuevos mensajes 422 no contemplados aún en `known`, y un mensaje genérico en español sigue siendo mejor que exponer el `raw` sin traducir.

## Risks / Trade-offs

- [Riesgo] Si `known` alguna vez incluye una clave vacía o `""`, podría interceptar casos no deseados. → Mitigación: el `if (known[key])` ya es falsy-safe para string vacío; no requiere cambio adicional.
