## ADDED Requirements

### Requirement: Modelo con IBAN completo por cuenta

`core-domain` SHALL tipar `PrimaryPaymentIdentifierDto` con `value: string` (IBAN completo, sin enmascarar) además de `display_value_masked`, reflejando el contrato real de `GET /accounts`/`GET /accounts/{id}` de pleniubank-core.

#### Scenario: Consumo tipado del IBAN completo

- **WHEN** un componente del portal lee `account.primary_payment_identifier`
- **THEN** tiene acceso tipado tanto a `value` (para copiar) como a `display_value_masked` (para mostrar por defecto)
