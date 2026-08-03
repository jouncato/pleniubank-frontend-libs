## ADDED Requirements

### Requirement: La UI representa el cupo agregado canónico
Las aplicaciones MUST mostrar `effective_max_amount` como valor calculado y MUST NOT ofrecer un techo fijo en COP para Anticipo de nómina.

#### Scenario: Preconsulta sin monto
- **WHEN** Core devuelve `provisional=true` e `is_final=false`
- **THEN** la UI muestra “cupo provisional sujeto a Scoring” y no lo presenta como aprobación final

#### Scenario: Dos anticipos activos
- **WHEN** Core indica que se alcanzó el máximo de activos
- **THEN** la UI bloquea el tercero con un mensaje de máximo dos activos

### Requirement: Backoffice respeta límites duros
Backoffice MUST limitar porcentajes empresariales al intervalo 5%-40% y activos al intervalo 1-2; 40% es el default global y un override puede ser inferior.

#### Scenario: Intento superior al 40%
- **WHEN** Staff intenta proponer un porcentaje superior a 40%
- **THEN** el formulario impide la propuesta y no ofrece flujo de excepción
