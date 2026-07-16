# Design: consolidate-account-iban-data-access (frontend-libs)

## Context

Réplica minimalista del ajuste hecho en core: un solo campo cambia de forma. No hay nueva arquitectura que diseñar, solo alinear el modelo TS con el contrato Pydantic corregido (`consolidate-account-iban`, pleniubank-core).

## Decisions

1. **`WalletSummaryDto` corregido:**
   ```ts
   export interface WalletSummaryDto {
     wallet_status: WalletStatus;      // sin cambio
     friendly_name: string;            // sin cambio
     iban: string | null;              // reemplaza virtual_number + format_type
     country_code: string;             // sin cambio
     balance: WalletBalanceDto | null; // sin cambio
     breb_alias: WalletBrebAliasDto | null; // sin cambio
     interoperable: boolean;           // sin cambio
   }
   ```
   Se retira el tipo `VirtualAccountFormatType` (ya no hay más de un esquema).
2. **Sin cambio en la firma del servicio**: `CoreWalletApiService.getSummary(): Observable<ApiEnvelope<WalletSummaryDto>>` sigue igual — solo cambia el contenido del payload que fluye.
3. Validar el modelo corregido contra el `wallet_summary_schemas.py` real de core (mismo hábito que el resto de la sesión) antes de cerrar.

## Risks / Trade-offs

- Ninguno relevante: el cambio es un rename/simplificación de un campo en un modelo que nunca llegó a producción.
