## MODIFIED Requirements

### Requirement: Servicio de llaves Bre-B self-service

`@pleniu/core-data-access` SHALL exponer `CoreBrebKeysSelfServiceApiService` con `list()`, `register(key_type, value, account_id?)` y `remove(id)` contra `/customers/me/breb-keys`. Las respuestas SHALL contener solo formas enmascaradas (`masked_value` donde aplique); el modelo SHALL NOT incluir el valor completo de la llave, pero SHALL incluir `account_id` (referencia técnica de cruce, no un identificador de negocio a mostrar).

#### Scenario: Registro de llave con cuenta explícita

- **WHEN** el portal registra una llave CELULAR indicando `account_id`
- **THEN** el valor viaja solo en el cuerpo del POST, la respuesta/el listado exponen la forma enmascarada y el `account_id` vinculado

#### Scenario: Registro sin `account_id` (compatibilidad)

- **WHEN** el portal registra una llave sin indicar `account_id`
- **THEN** el registro sigue funcionando (core aplica su propio default) y la llave resultante trae el `account_id` que el backend eligió
