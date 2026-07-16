/** Pleniu Colombia S.A. — B2C notification preference domain models.
 *
 * Synchronised with the `b2c-notification-preferences` capability
 * (`pleniubank-core` openspec change `b2c-persona-closure`).
 */

export type NotificationChannel = 'IN_APP' | 'PUSH' | 'EMAIL';

export interface NotificationPreference {
  event_type: string;
  channel: NotificationChannel;
  enabled: boolean;
  /** Eventos de seguridad/regulatorios: IN_APP no se puede desactivar. Alineado con `mandatory` en Core (`customers_router.py`). */
  mandatory: boolean;
}

export interface NotificationPreferencesResponse {
  items: NotificationPreference[];
}

export interface NotificationPreferenceUpdate {
  event_type: string;
  channel: NotificationChannel;
  enabled: boolean;
}

export interface UpdateNotificationPreferencesRequest {
  preferences: NotificationPreferenceUpdate[];
}
