/**
 * Pleniu Colombia S.A. — Wallet & Bre-B self-service domain models.
 * Synced with Core API (pleniubank-core):
 *  - GET  /api/v1/public/wallet/summary
 *  - GET/POST/DELETE /api/v1/public/customers/me/breb-keys(/{id})
 */

export type WalletStatus = 'ACTIVE' | 'PROVISIONING';

export type BrebKeyType = 'CEDULA' | 'CELULAR' | 'EMAIL';

export interface WalletBalanceDto {
  amount: string;
  currency: string;
}

export interface WalletBrebAliasDto {
  key_type: BrebKeyType;
  masked_value: string;
}

/**
 * `wallet_status='PROVISIONING'` es una respuesta 200 normal (nunca 5xx):
 * los campos identificador (`iban`, `balance`, `breb_alias`) llegan en `null`
 * mientras la billetera se aprovisiona.
 *
 * `iban` es el IBAN real de la cuenta (`account_payment_identifiers` en core,
 * mismo identificador ya mostrado — enmascarado — en `AccountDto.primary_payment_identifier`),
 * no un identificador jurisdiccional propio de la billetera.
 */
export interface WalletSummaryDto {
  wallet_status: WalletStatus;
  friendly_name: string;
  iban: string | null;
  country_code: string;
  balance: WalletBalanceDto | null;
  /** Un único alias (el más reciente activo), no un array. */
  breb_alias: WalletBrebAliasDto | null;
  /** Siempre `false` en Fase 1 (sin interoperabilidad con rieles externos). */
  interoperable: boolean;
}

/**
 * Listado self-service de llaves Bre-B del cliente autenticado.
 * A diferencia de `WalletBrebAliasDto`, este DTO NUNCA incluye el valor de la
 * llave (ni siquiera enmascarado): el listado no expone nada del valor.
 */
export interface BrebKeySelfServiceDto {
  id: string;
  key_type: BrebKeyType;
  is_active: boolean;
  /** `true` una vez un operador de plataforma la verifica. */
  verified: boolean;
  created_at: string | null;
  /**
   * Cuenta a la que esta llave resuelve las transferencias entrantes
   * (breb-key-account-linkage). Referencia técnica para cruzar con
   * `AccountDto.id` en el cliente — nunca se muestra como texto.
   */
  account_id: string | null;
}

export interface BrebKeySelfServiceListResponseDto {
  items: BrebKeySelfServiceDto[];
  total: number;
}

/** `key_value` solo va en el cuerpo del POST; nunca se re-expone en las respuestas. */
export interface BrebKeyRegisterRequest {
  key_type: BrebKeyType;
  key_value: string;
  /** Opcional: si se omite, core usa como default la cuenta activa más reciente del cliente. */
  account_id?: string;
}

export interface BrebKeyRevokeResponseDto {
  deactivated: boolean;
  breb_key_id: string;
}
