# Contrato de validación de alias CUSTOM Bre-B (v1)

**Estado: BORRADOR — no publicado.** Contenido de negocio parcialmente
ratificado (ver abajo); ownership/registry/firma (tarea 1.3) y aplicabilidad
`NATURAL_PERSON`/`LEGAL_ENTITY` (resto de tarea 1.2) siguen sin decidir.

Fuente canónica para OpenSpec `centralize-breb-key-validation-contract-co`
(`pleniubank-core/openspec/changes/centralize-breb-key-validation-contract-co/`,
design.md Decisión 1). Este directorio contiene el contenido técnico
(tareas 1.4–1.7 del OpenSpec); **no** implica que los paquetes
`@pleniu/breb-key-validation-contract` / `pleniu-breb-key-validation-contract`
existan.

## Decisiones ratificadas (Producto/Compliance, 2026-07-27)

| Punto | Borrador inicial | Ratificado |
|---|---|---|
| Longitud del alias | 4–30 (copiado de `settings.py` legacy) | **6–30** |
| Alfabeto | ASCII alfanumérico | **Confirmado**: alfanumérico, sin caracteres especiales — hace irrelevante la pregunta abierta de unidad de medida (puntos de código vs. bytes UTF-8 vs. caracteres), porque para una cadena puramente ASCII las tres cuentan igual |
| Prefijo `@` | Opcional | **Confirmado opcional** — el usuario decide si lo agrega |

Pendiente aún de Producto: si `NATURAL_PERSON` y `LEGAL_ENTITY` comparten la
misma regla (`custom_alias_v1`) en v1. Pendiente de Plataforma/Seguridad:
ownership del contrato, registry privado y política de firma (tarea 1.3).

**Nota operativa**: subir `min_length` de 4 a 6 es un cambio que puede
rechazar alias de 4–5 caracteres que hoy son válidos bajo `legacy`. Los
aliases de 4–5 caracteres **ya registrados** en producción no se revalidan
retroactivamente (design.md Decisión 7 — "grandfathering"); el cambio solo
afecta altas nuevas una vez activado el modo `canonical`.

## Archivos

- `contract.json` — fuente única editable. Formato legible (con indentación);
  el checksum se calcula sobre la forma canónica (compacta, claves
  ordenadas, `ensure_ascii=False`), no sobre los bytes de este archivo.
- `contract.schema.json` — JSON Schema (Draft 2020-12) que valida la forma
  del contrato. Verificado contra `contract.json` con la librería
  `jsonschema` (Python) — ver también negative-tests: rechaza
  `contract_id` incorrecto y patrones no portables.
- `fixtures.json` — 13 casos de equivalencia (válidos/base/límites/prefijo/
  espacio/símbolo/Unicode/email-like/celular CO/solo-dígitos), cada uno
  ejecutado contra ambos perfiles (`NATURAL_PERSON`, `LEGAL_ENTITY`) — 26
  ejecuciones en total. **Verificados en vivo contra el validador real de
  Core** (`pleniubank-core/src/party/application/services/breb_custom_key_validator.py`
  en modo `canonical`) — las 26 pasan.
  **No incluye casos de `blocked_terms`**: la lista real de palabras
  bloqueadas es configuración segura de Core (`BREB_CUSTOM_KEY_BLOCKED_WORDS`)
  y nunca se distribuye en un paquete compartido (design.md Non-Goal); esos
  casos siguen solo en `pleniubank-core/tests/unit/party/application/contracts/test_breb_key_validation_contract.py`.
- `MANIFEST.json` — `contract_id`, versión, SHA-256 canónico y estado de
  publicación de ambos paquetes (ninguno publicado todavía).

## Relación con el comportamiento legacy actual

`prefix.required=false`, `max_length=30`, blocklist `substring`/
case-insensitive/fail-closed, y el rechazo de patrones tipo-email/celular-CO/
solo-dígitos replican exactamente `pleniubank-core/src/config/settings.py`
(`BREB_CUSTOM_KEY_MAX_LENGTH=30`, `BREB_CUSTOM_KEY_REQUIRE_AT_PREFIX=False`)
y `breb_custom_key_validator.py::_validate_legacy` — mismo comportamiento,
solo trazable.

`body.min_length=6` es la **única divergencia intencional** frente a legacy
(que usa 4): Producto/Compliance ratificó 6 como la longitud normativa
correcta el 2026-07-27, en vez de simplemente heredar el valor técnico
histórico. Cuando se active `shadow`, esta es la única discrepancia que se
espera ver registrada entre la decisión legacy y la canónica — cualquier
otra divergencia detectada en `shadow` sería una señal real de bug, no de
esta decisión ya conocida.

## Política de versionado SemVer

- **PATCH** (`1.0.x`): cambios que no afectan qué valores se aceptan o
  rechazan (metadata, documentación, orden de claves, comentarios en
  archivos auxiliares). No debe cambiar `canonical_json_sha256`.
- **MINOR** (`1.x.0`): cambios compatibles hacia atrás — ej. ampliar un
  rango (`max_length` mayor), añadir un `rule_id` nuevo para un perfil sin
  tocar `custom_alias_v1`, agregar un nuevo profile. Ningún alias
  previamente válido puede volverse inválido.
- **MAJOR** (`x.0.0`): cualquier cambio que pueda rechazar una entrada
  antes válida — reducir un rango, cambiar el patrón, exigir el prefijo
  (`required: true`), agregar una regla de confusabilidad nueva, cambiar
  `length_unit`. Requiere el rollout completo de `shadow` → resolución de
  divergencias → `canonical` (design.md Decisión 7) antes de considerarse
  completo, y grandfathering explícito de aliases ya persistidos (nunca se
  revalidan retroactivamente).

Los códigos de error (`CUSTOM_KEY_MISSING_AT_PREFIX`,
`CUSTOM_KEY_FORMAT_NOT_ALLOWED`) son parte de la identidad contractual y
NO pueden cambiar de valor entre versiones; solo los mensajes humanos
(fuera de este contrato) pueden localizarse libremente.

## Qué falta antes de que esto deje de ser un borrador

1. **Tarea 1.2 (parcial)**: falta ratificar solo si `NATURAL_PERSON` y
   `LEGAL_ENTITY` comparten regla en v1 (longitud, alfabeto y prefijo ya
   ratificados — ver tabla arriba).
2. **Tarea 1.3** (fuera del alcance de una sesión de código): ownership del
   contrato, registry privado NPM/Python, política de firma.
3. **Tareas 2.1–2.6**: implementar y publicar realmente
   `@pleniu/breb-key-validation-contract` (NPM) y
   `pleniu-breb-key-validation-contract` (Python wheel) desde este
   `contract.json`, en un registry privado real.
4. Solo después de (1)-(3) tiene sentido avanzar con las tareas 4–9
   (consumo en frontend/backoffice, gate de CI, rollout `shadow`→`canonical`).
