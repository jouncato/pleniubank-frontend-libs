## ADDED Requirements

### Requirement: Resolutor único de errores
Frontend libs SHALL exponer una única función canónica para convertir errores API en mensajes seguros y contextualizados.

#### Scenario: Código conocido
- **WHEN** un feature recibe un código conocido
- **THEN** el resolutor devuelve el mensaje central con el override contextual permitido

### Requirement: Fallback seguro y accesible
Errores desconocidos MUST NOT revelar detalles técnicos y SHALL producir texto accionable apto para tecnologías asistivas.

#### Scenario: Error no mapeado
- **WHEN** el backend devuelve un código desconocido o cuerpo inválido
- **THEN** se muestra el fallback seguro y se conserva correlation ID solo para soporte

