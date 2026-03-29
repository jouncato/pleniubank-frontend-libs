import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/**
 * Cliente HTTP sin interceptores del portal (evita Bearer de sesión Identity/Core
 * en OAuth y APIs del PaymentHub).
 */
@Injectable({ providedIn: 'root' })
export class PaymentHubHttpService {
  readonly client: HttpClient;

  constructor(backend: HttpBackend) {
    this.client = new HttpClient(backend);
  }
}
