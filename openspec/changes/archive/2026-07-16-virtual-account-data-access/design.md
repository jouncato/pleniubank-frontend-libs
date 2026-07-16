# Design: virtual-account-data-access (frontend-libs)

## Context

Réplica del patrón probado en `b2c-data-access` (archivado 2026-07-16): modelos en `core-domain` sincronizados con los schemas Pydantic reales de core, servicios en `core-data-access` construidos sobre `corePublicV1Base(apiConfig)`, envelope `{data, meta, errors}`, specs con `HttpTestingController`, y spec de integración que verifica que los interceptores (`tenant-context`, `correlation-id`) aplican sin bypass.

## Goals / Non-Goals

**Goals:**
- Contratos tipados 1:1 con los endpoints nuevos de core (`/wallet/summary`, `/customers/me/breb-keys`).
- El portal nunca enmascara PII client-side: los modelos ya llegan enmascarados del backend.

**Non-Goals:**
- Ningún estado/VM (eso vive en el portal).
- No se modela la Fase 3 (interoperabilidad con rieles) — el flag `interoperable` del summary es suficiente.

## Decisions

1. **Modelos espejo del contrato real.** `wallet.models.ts` en `core-domain`:
   ```ts
   export type VirtualAccountFormat = 'CO_SAVINGS_VIRTUAL' | 'MX_CLABE_VIRTUAL' | 'PE_CCI_VIRTUAL' | 'IBAN_SPONSOR';
   export interface VirtualAccountInfo { virtual_number: string; format_type: VirtualAccountFormat; status: string; }
   export interface WalletSummary {
     account_id: string;                    // se conserva para deep-links técnicos, no para display
     virtual_account: VirtualAccountInfo | null;
     provisioning_status: 'READY' | 'PROVISIONING';
     friendly_name: string;
     available_balance: { amount: string; denomination: string } | null;
     breb_aliases: BrebKey[];
     interoperable: boolean;
   }
   export interface BrebKey { id: string; key_type: 'CEDULA' | 'CELULAR' | 'EMAIL'; masked_value: string; status: string; }
   ```
   Los campos exactos se validan contra los schemas Pydantic reales de core al implementar (no contra este diseño) — regla heredada del hallazgo `items`/`mandatory` vs `preferences`/`locked` en notification-preferences.
2. **Servicios.** `CoreWalletApiService` (`providedIn:'root'`, `API_CONFIG`) con `getSummary(): Observable<ApiEnvelope<WalletSummary>>`; `CoreBrebKeysApiService` con `list()`, `register(key_type, value)`, `remove(id)`. El `value` del register viaja solo en el POST (nunca se re-expone: la respuesta devuelve la forma enmascarada).
3. **Errores.** Si core tipifica el rechazo anti-enumeración con un código (p.ej. `BREB_KEY_REGISTRATION_REJECTED`), se añade al `error-message.mapper` con mensaje genérico; si core reutiliza códigos existentes, no se toca `shared-http`.
4. **Interceptores.** Ambos servicios entran al spec de integración existente (o uno nuevo homólogo) verificando `X-Tenant-Country` y `X-Correlation-ID`.

## Risks / Trade-offs

- [Contrato divergente respecto a core] → tarea explícita de validación contra el código Python real antes del cierre (lección de `b2c-data-access` 5.1).
- [Publicar libs antes de que core esté en QA] → mismo tratamiento que `b2c-data-access`: se desarrolla contra los specs del change de core y se re-valida contra el contrato en ejecución antes del bump.

## Open Questions

- ¿`friendly_name` viene siempre o puede ser null para cuentas legacy sin configuración? (definir default en el contrato de core).
