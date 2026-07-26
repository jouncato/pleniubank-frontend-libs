## MODIFIED Requirements

### Requirement: Servicio de llaves Bre-B self-service

`@pleniu/core-data-access` SHALL exponer `CoreBrebKeysSelfServiceApiService` con `list()`, `register(key_type, value, account_id?)`, `remove(id)`, `setPrimary(id)`, `getProposals()` y `getHistory(id)` contra `/customers/me/breb-keys`. Las respuestas SHALL contener solo formas enmascaradas (`masked_value` donde aplique); el modelo SHALL NOT incluir el valor completo de la llave, pero SHALL incluir `account_id` (referencia técnica de cruce, no un identificador de negocio a mostrar) y SHALL incluir el estado del ciclo de vida de la llave cuando el backend lo emita.

#### Scenario: Registro de llave con cuenta explícita

- **WHEN** el portal registra una llave CELULAR indicando `account_id`
- **THEN** el valor viaja solo en el cuerpo del POST, la respuesta/el listado exponen la forma enmascarada y el `account_id` vinculado

#### Scenario: Registro sin `account_id` (compatibilidad)

- **WHEN** el portal registra una llave sin indicar `account_id`
- **THEN** el registro sigue funcionando (core aplica su propio default) y la llave resultante trae el `account_id` que el backend eligió

#### Scenario: Listado con estado del ciclo de vida

- **WHEN** el portal lista las llaves contra un backend que emite el estado del ciclo de vida
- **THEN** cada elemento del listado expone ese estado tipado, además de los campos ya existentes

#### Scenario: Consulta del historial de una llave propia

- **WHEN** el portal solicita el historial de una llave del cliente
- **THEN** obtiene la lista tipada de transiciones limitada a estado nuevo, motivo y fecha

## ADDED Requirements

### Requirement: Tipos del ciclo de vida de llaves Bre-B

`@pleniu/core-domain` SHALL exponer los tipos del ciclo de vida de llaves Bre-B: el conjunto cerrado de estados, el conjunto cerrado de motivos de transición, el DTO de historial en vista de cliente, el DTO de historial en vista de staff, el DTO de verificación de integridad de la cadena y los cuerpos de petición de suspensión y reactivación. El DTO de vista de cliente SHALL NOT declarar campos de IP, responsable, descripción interna ni detalle estructurado, de modo que el compilador impida renderizarlos en superficies de cliente.

#### Scenario: Vista de cliente no puede exponer datos de staff

- **WHEN** un componente de cliente intenta leer la IP o el responsable desde un elemento de historial de vista de cliente
- **THEN** la compilación falla porque el tipo no declara esos campos

#### Scenario: Vista de staff expone la fila completa

- **WHEN** una superficie de staff lee un elemento de historial
- **THEN** dispone de estado anterior, estado nuevo, motivo, descripción, responsable, IP, cabecera de reenvío, user-agent, correlación, evento externo, cuentas anterior y nueva, y hash de cadena

### Requirement: Semántica explícita de utilizabilidad de la llave

`@pleniu/core-domain` SHALL exponer un helper que determine si una llave es utilizable como destino, y ese helper SHALL ser el único mecanismo que los portales usen para esa decisión. El helper SHALL considerar utilizable únicamente la llave cuyo estado sea el activo del ciclo de vida y que esté verificada. Cuando el backend no emita el estado, el helper SHALL degradar al comportamiento previo basado en la marca de reserva y la verificación. El campo de marca de reserva SHALL documentar que no representa utilizabilidad.

#### Scenario: Llave suspendida no es utilizable

- **WHEN** el helper evalúa una llave suspendida cuya marca de reserva sigue activa
- **THEN** devuelve que no es utilizable

#### Scenario: Llave pendiente de confirmación no es utilizable

- **WHEN** el helper evalúa una llave en estado transitorio de creación
- **THEN** devuelve que no es utilizable

#### Scenario: Backend sin estado emitido

- **WHEN** el helper evalúa una llave proveniente de un backend que aún no emite estado
- **THEN** degrada a la evaluación previa basada en marca de reserva y verificación, sin lanzar error

#### Scenario: Llave activa y verificada

- **WHEN** el helper evalúa una llave en estado activo y verificada
- **THEN** devuelve que es utilizable

### Requirement: Servicio administrativo de llaves Bre-B

`@pleniu/core-data-access` SHALL exponer un servicio administrativo de llaves Bre-B, independiente del servicio self-service, con operaciones de suspensión, reactivación, consulta de historial completo y verificación de integridad de la cadena. Las operaciones que cambian estado SHALL enviar una clave de idempotencia fresca por invocación. El servicio self-service SHALL NOT incorporar operaciones administrativas.

#### Scenario: Suspensión con motivo

- **WHEN** una superficie de staff suspende una llave enviando el motivo
- **THEN** la petición viaja a la superficie administrativa con una clave de idempotencia propia

#### Scenario: Idempotencia distinta por invocación

- **WHEN** se invoca la suspensión dos veces consecutivas
- **THEN** cada petición lleva una clave de idempotencia distinta

#### Scenario: Separación de superficies

- **WHEN** se inspecciona el servicio self-service
- **THEN** no expone ninguna operación de suspensión, reactivación ni verificación de cadena

### Requirement: Etiquetas compartidas de estado y motivo

`@pleniu/core-domain` SHALL exponer funciones de etiquetado en español para los estados del ciclo de vida y para los motivos de transición, de modo que los portales no las dupliquen. Ante un valor no reconocido, las funciones SHALL devolver el código crudo y SHALL NOT devolver cadena vacía, para que un estado nuevo emitido por el backend sea visible en la interfaz.

#### Scenario: Estado conocido

- **WHEN** se etiqueta un estado del catálogo
- **THEN** se obtiene su etiqueta en español

#### Scenario: Estado desconocido

- **WHEN** se etiqueta un estado que la lib no reconoce
- **THEN** se obtiene el código crudo, visible en la interfaz
