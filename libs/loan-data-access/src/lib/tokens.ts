import { InjectionToken } from '@angular/core';

export const LOAN_API_BASE_URL = new InjectionToken<string>('LOAN_API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api/v1',
});
