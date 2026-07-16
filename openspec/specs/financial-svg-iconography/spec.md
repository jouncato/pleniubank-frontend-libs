## Purpose

Proveer un sistema único, propio y reusable de iconografía SVG financiera para productos bancarios de PleniuBank, con un catálogo tipado de iconos de interfaz, un componente Angular standalone compartido, reglas de geometría SVG consistentes, contratos de accesibilidad para operaciones financieras críticas y tokens semánticos de iconografía — sustituyendo SVG inline, rutas SVG locales, emojis y caracteres Unicode usados como iconos en Customer Portal y Backoffice Portal.

## Requirements

### Requirement: Catálogo propio de iconografía financiera
El sistema SHALL proporcionar en `@pleniu/ui` un catálogo tipado y exclusivo de iconos SVG de interfaz para banca digital y operación corporativa. El catálogo SHALL incluir como mínimo transferencias, tarjeta de crédito, préstamos, inversión, seguridad, saldo, perfil premium, cuenta, extracto, tasa de interés, cajero, biometría, pagos, conciliación, fraude, nómina y controles de navegación.

#### Scenario: Consumidor solicita un icono bancario tipado
- **WHEN** un componente de cualquiera de los portales declara un nombre válido del catálogo
- **THEN** el sistema renderiza el icono financiero correspondiente sin depender de una librería genérica o asset remoto

#### Scenario: Consumidor solicita un nombre no registrado
- **WHEN** un componente intenta usar un nombre de icono fuera del tipo público `PbIconName`
- **THEN** TypeScript reporta el error en compilación y el consumidor no puede depender de strings libres

### Requirement: Geometría SVG financiera consistente
Cada icono del catálogo SHALL usar `viewBox="0 0 24 24"`, código XML limpio, `currentColor`, trazo base uniforme de `1.8`, extremos y uniones redondeados. Los SVG SHALL NOT contener metadatos de software de diseño, estilos inline, scripts, identificadores, colores hexadecimales ni atributos fuera de la lista permitida del registro.

#### Scenario: Validación del registro SVG
- **WHEN** se añade o modifica un icono del catálogo
- **THEN** una prueba de integridad confirma su viewBox, atributos de trazo, uso de `currentColor` y ausencia de contenido XML prohibido

#### Scenario: Cambio de tema o estado de interacción
- **WHEN** el color del elemento contenedor cambia por hover, focus, modo oscuro o token de marca
- **THEN** el icono adopta el color efectivo mediante `currentColor` sin modificar su definición SVG

### Requirement: Componente Angular reusable y seguro
`@pleniu/ui` SHALL exportar un componente standalone `PbIconComponent` que renderice exclusivamente nodos declarativos del catálogo local. El componente SHALL exponer entradas tipadas para nombre, tamaño y modalidad accesible, y SHALL NOT aceptar SVG, HTML o URL arbitrarios desde consumidores.

#### Scenario: Renderizado decorativo
- **WHEN** un consumidor usa un icono como complemento visual de texto ya accesible
- **THEN** el componente renderiza el SVG con `aria-hidden="true"` y `focusable="false"`

#### Scenario: Renderizado informativo
- **WHEN** un consumidor usa un icono que reemplaza contenido textual
- **THEN** el consumidor proporciona una etiqueta accesible y el componente expone un SVG con `role="img"` y nombre accesible

### Requirement: Accesibilidad para operaciones financieras críticas
Los iconos SHALL NOT ser el único mecanismo para comunicar estado o intención en transferencias, pagos, préstamos, saldo, fraude, bloqueo o confirmaciones. Los controles con iconos SHALL tener etiqueta accesible descriptiva, foco visible y objetivo táctil mínimo de 44 × 44 CSS px cuando sean accionables.

#### Scenario: Confirmación de transferencia mediante control con icono
- **WHEN** una persona enfoca el control que confirma una transferencia
- **THEN** el control anuncia una etiqueta que describe la acción transaccional completa y el icono interno se mantiene decorativo

#### Scenario: Alerta de fraude o riesgo
- **WHEN** una interfaz presenta un icono de alerta financiera
- **THEN** la interfaz muestra también texto de estado y no depende únicamente de color, forma o animación

### Requirement: Migración sin iconografía genérica ni variantes locales
Customer Portal y Backoffice Portal SHALL migrar los iconos de interfaz a `PbIconComponent` por entregas verificables. La base de código SHALL NOT introducir emojis decorativos, caracteres Unicode usados como iconos, icon fonts, registros locales de SVG paths ni SVG inline de iconos de UI fuera de los componentes autorizados.

#### Scenario: Migración de navegación personal
- **WHEN** se renderiza la navegación móvil B2C
- **THEN** sus entradas usan iconos financieros del catálogo y no emojis ni caracteres Unicode

#### Scenario: Migración del catálogo administrativo
- **WHEN** se renderiza una tarjeta de catálogo de Backoffice
- **THEN** usa el tipo y componente compartidos en lugar de un mapa local de paths SVG

#### Scenario: Revisión de regresión de iconografía
- **WHEN** se ejecuta la verificación de la migración
- **THEN** la auditoría automatizada falla si encuentra una nueva ocurrencia no aprobada de icon font, emoji decorativo, `ICON_PATHS` local o SVG inline de icono de UI

### Requirement: Tokens semánticos de iconografía
`@pleniu/design-tokens` SHALL definir y exportar tokens para tamaños de icono, grosor de trazo y colores semánticos aplicables a iconos. Los portales SHALL consumir esos tokens o la API de tamaño del componente y SHALL NOT duplicar medidas o colores de iconos en cada vista.

#### Scenario: Tamaño estandarizado en dos portales
- **WHEN** Customer Portal y Backoffice Portal solicitan un icono de tamaño `md`
- **THEN** ambos reciben la misma dimensión definida por el token de iconografía

#### Scenario: Semántica de estado financiero
- **WHEN** un icono representa éxito, advertencia, riesgo, información o estado neutro
- **THEN** su contenedor consume el token semántico correspondiente y conserva una indicación textual equivalente
