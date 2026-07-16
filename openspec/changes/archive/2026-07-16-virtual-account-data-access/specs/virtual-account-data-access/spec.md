# virtual-account-data-access — Servicios y modelos de identificadores virtuales

Propósito: dar a los portales contratos tipados para el resumen de billetera enriquecido y la gestión self-service de llaves Bre-B, de modo que el frontend deje de componer vistas con UUIDs crudos.

## ADDED Requirements

### Requirement: Servicio de resumen de billetera
`@pleniu/core-data-access` SHALL exponer `CoreWalletApiService.getSummary()` contra `GET {corePublicV1Base}/wallet/summary`, tipado con `WalletSummary` de `core-domain` (identificador virtual con formato jurisdiccional, `provisioning_status`, `friendly_name`, saldo con denominación, alias Bre-B ya enmascarados, flag `interoperable`).

#### Scenario: Resumen listo
- **WHEN** el portal llama a `getSummary()` y core responde `READY`
- **THEN** el consumidor obtiene el identificador virtual y el saldo tipados, sin necesidad de llamadas adicionales

#### Scenario: Billetera en aprovisionamiento
- **WHEN** core responde `provisioning_status='PROVISIONING'` con identificador null
- **THEN** el tipo lo modela explícitamente (null seguro) y el consumidor puede renderizar el estado sin lógica defensiva ad-hoc

### Requirement: Servicio de llaves Bre-B self-service
`@pleniu/core-data-access` SHALL exponer `CoreBrebKeysApiService` con `list()`, `register(key_type, value)` y `remove(id)` contra `/customers/me/breb-keys`. Las respuestas SHALL contener solo formas enmascaradas (`masked_value`); el modelo SHALL NOT incluir el valor completo de la llave.

#### Scenario: Registro de llave
- **WHEN** el portal registra una llave CELULAR
- **THEN** el valor viaja solo en el cuerpo del POST y la respuesta/el listado exponen únicamente la forma enmascarada

### Requirement: Cumplimiento de interceptores
Los servicios nuevos SHALL pasar por los interceptores compartidos sin bypass, verificado con un spec de integración (`X-Tenant-Country`, `X-Correlation-ID`).

#### Scenario: Llamada al summary con tenant activo
- **WHEN** `getSummary()` ejecuta con el contexto de tenant CO
- **THEN** la petición lleva `X-Tenant-Country: CO` y un `X-Correlation-ID`

### Requirement: Validación contra el contrato real
Antes del cierre del change, los modelos SHALL validarse campo por campo contra los schemas Pydantic y routers reales de pleniubank-core (no contra artefactos de planeación), documentando cualquier corrección.

#### Scenario: Divergencia detectada en la validación
- **WHEN** un campo del modelo TS no coincide con el schema real de core
- **THEN** el modelo se corrige antes del bump de versión y la divergencia queda documentada en tasks.md
