import { Inject, Injectable } from '@angular/core';
import { API_CONFIG, ApiConfig } from 'shared-http';

@Injectable({ providedIn: 'root' })
export class PaymentHubContext {
  constructor(@Inject(API_CONFIG) private readonly apiConfig: ApiConfig) {}

  /** Base sin barra final; lanza si falta configuración. */
  requireBaseUrl(): string {
    const raw = this.apiConfig.paymentHubBaseUrl?.trim();
    if (!raw) {
      throw new Error('API_CONFIG.paymentHubBaseUrl no está configurado.');
    }
    return raw.replace(/\/$/, '');
  }
}
