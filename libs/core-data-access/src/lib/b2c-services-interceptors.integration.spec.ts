import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  API_CONFIG,
  correlationIdInterceptor,
  tenantContextInterceptor,
  TENANT_HEADER_ENABLED,
} from '@pleniu/shared-http';

import { CoreTransfersApiService } from './core-transfers-api.service';
import { CoreNotificationsApiService } from './core-notifications-api.service';
import { CoreWalletApiService } from './core-wallet-api.service';
import { CoreBrebKeysSelfServiceApiService } from './core-breb-keys-self-service-api.service';

const mockApiConfig = {
  coreBaseUrl: 'http://localhost:8000',
  corePublicApiPrefix: '/api/v1/public',
};

/**
 * `b2c-core-api-services` — "Interceptores aplicados a servicios nuevos":
 * los servicios nuevos no deben requerir configuración especial para recibir
 * `X-Tenant-Country` / `X-Correlation-ID`; basta con usar el `HttpClient`
 * estándar de la lib (sin cliente HTTP propio ni bypass de interceptores).
 */
describe('Interceptores globales aplican a los servicios B2C nuevos (sin bypass)', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TENANT_HEADER_ENABLED, useValue: true },
        { provide: API_CONFIG, useValue: mockApiConfig },
        provideHttpClient(withInterceptors([tenantContextInterceptor, correlationIdInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('CoreTransfersApiService.list() incluye X-Tenant-Country y X-Correlation-ID', () => {
    const service = TestBed.inject(CoreTransfersApiService);
    service.list({}).subscribe();

    const req = httpTesting.expectOne('http://localhost:8000/api/v1/public/transfers');
    expect(req.request.headers.get('X-Tenant-Country')).toBe('CO');
    expect(req.request.headers.get('X-Correlation-ID')).toBeTruthy();
    req.flush({ data: { items: [], next_cursor: null } });
  });

  it('CoreNotificationsApiService.getPreferences() incluye X-Tenant-Country', () => {
    const service = TestBed.inject(CoreNotificationsApiService);
    service.getPreferences().subscribe();

    const req = httpTesting.expectOne(
      'http://localhost:8000/api/v1/public/customers/me/notification-preferences',
    );
    expect(req.request.headers.get('X-Tenant-Country')).toBe('CO');
    req.flush({ data: { items: [] } });
  });

  it('CoreWalletApiService.getSummary() incluye X-Tenant-Country y X-Correlation-ID', () => {
    const service = TestBed.inject(CoreWalletApiService);
    service.getSummary().subscribe();

    const req = httpTesting.expectOne('http://localhost:8000/api/v1/public/wallet/summary');
    expect(req.request.headers.get('X-Tenant-Country')).toBe('CO');
    expect(req.request.headers.get('X-Correlation-ID')).toBeTruthy();
    req.flush({
      data: {
        wallet_status: 'PROVISIONING',
        friendly_name: 'Billetera Pleniu',
        iban: null,
        country_code: 'CO',
        balance: null,
        breb_alias: null,
        interoperable: false,
      },
    });
  });

  it('CoreBrebKeysSelfServiceApiService.list() incluye X-Tenant-Country y X-Correlation-ID', () => {
    const service = TestBed.inject(CoreBrebKeysSelfServiceApiService);
    service.list().subscribe();

    const req = httpTesting.expectOne('http://localhost:8000/api/v1/public/customers/me/breb-keys');
    expect(req.request.headers.get('X-Tenant-Country')).toBe('CO');
    expect(req.request.headers.get('X-Correlation-ID')).toBeTruthy();
    req.flush({ data: { items: [], total: 0 } });
  });
});
