import { Injectable, signal } from '@angular/core';

/**
 * Último `correlation_id` visto en cuerpo de respuesta (éxito o error envelope).
 * Usado para soporte y toasts; no sustituye el header de request.
 */
@Injectable({ providedIn: 'root' })
export class CorrelationContextService {
  private readonly _lastResponseCorrelationId = signal<string | null>(null);

  readonly lastResponseCorrelationId = this._lastResponseCorrelationId.asReadonly();

  setLastResponseCorrelationId(id: string | null): void {
    this._lastResponseCorrelationId.set(id);
  }
}
