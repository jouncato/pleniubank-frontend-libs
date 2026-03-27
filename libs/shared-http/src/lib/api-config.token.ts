import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  identityBaseUrl: string;
  coreBaseUrl: string;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');
