## ADDED Requirements

### Requirement: Prioridad de mensajes específicos sobre fallback genérico
Al mostrar un error de verificación de correo empresarial, el sistema SHALL mostrar el mensaje específico mapeado para la causa reportada por el backend cuando dicho mensaje exista, en vez del mensaje genérico asociado al código de estado HTTP.

#### Scenario: Código OTP expirado
- **WHEN** el backend responde `422` con detalle `"Verification code expired"`
- **THEN** la UI muestra "El código expiró. Puedes solicitar uno nuevo con «Reenviar código»." (no el mensaje genérico de datos inválidos)

#### Scenario: Código OTP incorrecto
- **WHEN** el backend responde `422` con detalle `"Invalid verification code"`
- **THEN** la UI muestra "Código incorrecto." (no el mensaje genérico de datos inválidos)

#### Scenario: Detalle no contemplado
- **WHEN** el backend responde `422` con un detalle que no está en el diccionario de mensajes conocidos
- **THEN** la UI muestra el mensaje genérico "Datos inválidos. Reinicia el proceso de registro."

#### Scenario: Proceso expirado (404)
- **WHEN** el backend responde `404`
- **THEN** la UI muestra "Proceso expirado, reinicia el registro empresa." independientemente del contenido del diccionario de mensajes conocidos
