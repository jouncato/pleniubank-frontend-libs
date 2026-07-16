## MODIFIED Requirements

### Requirement: Servicio de resumen de billetera
`@pleniu/core-data-access` SHALL exponer `CoreWalletApiService.getSummary()` contra `GET {corePublicV1Base}/wallet/summary`, tipado con `WalletSummaryDto` de `core-domain` (`wallet_status`, `friendly_name`, **`iban: string | null`** — identificador financiero real de la cuenta, sistema de IBAN existente en core, no un identificador jurisdiccional propio —, `country_code`, `balance`, `breb_alias`, `interoperable`).

#### Scenario: Resumen listo
- **WHEN** el portal llama a `getSummary()` y core responde `wallet_status='ACTIVE'`
- **THEN** el consumidor obtiene el `iban` completo y el saldo tipados, sin necesidad de llamadas adicionales

#### Scenario: Billetera en aprovisionamiento
- **WHEN** core responde `wallet_status='PROVISIONING'` con `iban: null`
- **THEN** el tipo lo modela explícitamente (null seguro) y el consumidor puede renderizar el estado sin lógica defensiva ad-hoc
