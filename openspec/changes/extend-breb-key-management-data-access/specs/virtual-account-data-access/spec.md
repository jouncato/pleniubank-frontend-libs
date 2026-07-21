## MODIFIED Requirements

### Requirement: Servicio de llaves Bre-B self-service

`@pleniu/core-data-access` SHALL exponer `CoreBrebKeysSelfServiceApiService` con `list()`, `register(key_type, value, account_id?)`, `remove(id)` y `setPrimary(id)` contra `/customers/me/breb-keys`, admitiendo `key_type` CEDULA/CELULAR/EMAIL/CUSTOM. Las respuestas SHALL contener solo formas enmascaradas (`masked_value` donde aplique); el modelo SHALL NOT incluir el valor completo de la llave, pero SHALL incluir `account_id` (referencia técnica de cruce, no un identificador de negocio a mostrar) e `is_primary`.

#### Scenario: Registro de llave con cuenta explícita

- **WHEN** el portal registra una llave CELULAR indicando `account_id`
- **THEN** el valor viaja solo en el cuerpo del POST, la respuesta/el listado exponen la forma enmascarada, el `account_id` vinculado y su `is_primary`

#### Scenario: Registro sin `account_id` (compatibilidad)

- **WHEN** el portal registra una llave sin indicar `account_id`
- **THEN** el registro sigue funcionando (core aplica su propio default) y la llave resultante trae el `account_id` que el backend eligió

#### Scenario: Registro de llave CUSTOM rechazada por formato

- **WHEN** core responde 422 `CUSTOM_KEY_FORMAT_NOT_ALLOWED` a un alias personalizado
- **THEN** el servicio tipa el error y el mapper compartido produce un mensaje de usuario específico en español (sin filtrar detalles técnicos)

#### Scenario: Cambio de llave principal

- **WHEN** el portal llama `setPrimary(id)` sobre una llave activa propia
- **THEN** la lista refrescada refleja exactamente una llave con `is_primary=true`
