import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Singleton que coordina el refresco concurrente de tokens.
 * Al ser `providedIn: 'root'`, una sola instancia gestiona el estado de refresco
 * para toda la aplicación, eliminando el anti-patrón de `BehaviorSubject` a nivel
 * de módulo en `token-refresh.interceptor.ts`.
 */
@Injectable({ providedIn: 'root' })
export class TokenRefreshCoordinator {
  readonly retryToken$ = new BehaviorSubject<string | null>(null);
}
