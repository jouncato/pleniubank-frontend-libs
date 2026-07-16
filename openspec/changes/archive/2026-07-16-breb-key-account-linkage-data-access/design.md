# Design: breb-key-account-linkage-data-access (frontend-libs)

## Context

Réplica del ajuste hecho en core. No hay arquitectura nueva que diseñar, solo alinear los modelos TS con los contratos Pydantic corregidos (`breb-key-account-linkage`, pleniubank-core).

## Decisions

1. **`PrimaryPaymentIdentifierDto` corregido:**
   ```ts
   export interface PrimaryPaymentIdentifierDto {
     scheme: PaymentSchemeV1;
     value: string;               // NUEVO — IBAN completo, sin enmascarar
     display_value_masked: string;
     country_code: string | null;
   }
   ```
2. **`BrebKeySelfServiceDto` corregido:**
   ```ts
   export interface BrebKeySelfServiceDto {
     id: string;
     key_type: BrebKeyType;
     is_active: boolean;
     verified: boolean;
     created_at: string | null;
     account_id: string;          // NUEVO — id de la cuenta vinculada (solo para cruce en cliente)
   }
   ```
3. **`BrebKeyRegisterRequest` corregido:**
   ```ts
   export interface BrebKeyRegisterRequest {
     key_type: BrebKeyType;
     key_value: string;
     account_id?: string;         // NUEVO — opcional, compatibilidad con default de core
   }
   ```
4. Validar ambos modelos corregidos contra los schemas Pydantic reales de core (mismo hábito que el resto de la sesión) antes de cerrar.

## Risks / Trade-offs

- Ninguno relevante: son campos nuevos, aditivos, sin romper ningún consumidor existente (los campos opcionales/nuevos no afectan código que no los lea todavía).
