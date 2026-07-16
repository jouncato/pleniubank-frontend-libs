# virtual-account-data-access

## Purpose

Dar a los portales contratos tipados para el resumen de billetera enriquecido y
la gestión self-service de llaves Bre-B, de modo que el frontend deje de
componer vistas con UUIDs crudos. Vive en `@pleniu/core-data-access`
(`CoreWalletApiService`, `CoreBrebKeysSelfServiceApiService`) y `core-domain`
(modelos `WalletSummary` y de llaves Bre-B).

## Requirements

### Requirement: Servicio de resumen de billetera

`@pleniu/core-data-access` SHALL exponer `CoreWalletApiService.getSummary()`
contra `GET {corePublicV1Base}/wallet/summary`, tipado con `WalletSummaryDto`
de `core-domain` (`wallet_status`, `friendly_name`, `iban: string | null` —
identificador financiero real de la cuenta, sistema de IBAN existente en
core, no un identificador jurisdiccional propio —, `country_code`, `balance`,
`breb_alias`, `interoperable`).

#### Scenario: Resumen listo

- **WHEN** el portal llama a `getSummary()` y core responde
  `wallet_status='ACTIVE'`
- **THEN** el consumidor obtiene el `iban` completo y el saldo tipados, sin
  necesidad de llamadas adicionales

#### Scenario: Billetera en aprovisionamiento

- **WHEN** core responde `wallet_status='PROVISIONING'` con `iban: null`
- **THEN** el tipo lo modela explícitamente (null seguro) y el consumidor
  puede renderizar el estado sin lógica defensiva ad-hoc

### Requirement: Servicio de llaves Bre-B self-service

`@pleniu/core-data-access` SHALL exponer `CoreBrebKeysSelfServiceApiService`
con `list()`, `register(key_type, value, account_id?)` y `remove(id)` contra
`/customers/me/breb-keys`. Las respuestas SHALL contener solo formas
enmascaradas (`masked_value` donde aplique); el modelo SHALL NOT incluir el
valor completo de la llave, pero SHALL incluir `account_id` (referencia
técnica de cruce, no un identificador de negocio a mostrar).

#### Scenario: Registro de llave con cuenta explícita

- **WHEN** el portal registra una llave CELULAR indicando `account_id`
- **THEN** el valor viaja solo en el cuerpo del POST, la respuesta/el listado
  exponen la forma enmascarada y el `account_id` vinculado

#### Scenario: Registro sin `account_id` (compatibilidad)

- **WHEN** el portal registra una llave sin indicar `account_id`
- **THEN** el registro sigue funcionando (core aplica su propio default) y la
  llave resultante trae el `account_id` que el backend eligió

### Requirement: Cumplimiento de interceptores

Los servicios nuevos SHALL pasar por los interceptores compartidos sin
bypass, verificado con un spec de integración (`X-Tenant-Country`,
`X-Correlation-ID`).

#### Scenario: Llamada al summary con tenant activo

- **WHEN** `getSummary()` ejecuta con el contexto de tenant CO
- **THEN** la petición lleva `X-Tenant-Country: CO` y un `X-Correlation-ID`

### Requirement: Validación contra el contrato real

Antes del cierre del change, los modelos SHALL validarse campo por campo
contra los schemas Pydantic y routers reales de pleniubank-core (no contra
artefactos de planeación), documentando cualquier corrección.

#### Scenario: Divergencia detectada en la validación

- **WHEN** un campo del modelo TS no coincide con el schema real de core
- **THEN** el modelo se corrige antes del bump de versión y la divergencia
  queda documentada en tasks.md
