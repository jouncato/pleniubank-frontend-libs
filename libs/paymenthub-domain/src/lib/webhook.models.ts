export type PaymentHubWebhookEventType =
  | 'payment.created'
  | 'payment.processing'
  | 'payment.sent'
  | 'payment.settled'
  | 'payment.failed'
  | 'payment.cancelled'
  | 'reconciliation.completed';

export interface PaymentHubWebhookRegistration {
  url: string;
  events: PaymentHubWebhookEventType[];
  secret?: string;
}

export interface PaymentHubWebhookRegistrationResponse {
  webhookId?: string;
  url?: string;
  events?: string[];
  createdAt?: string;
}

/**
 * Carga entrante genérica hacia el comercio (no detallada en OpenAPI components).
 * Ajustar cuando el hub documente el body firmado.
 */
export interface PaymentHubWebhookPayload {
  event?: string;
  data?: Record<string, unknown>;
}
