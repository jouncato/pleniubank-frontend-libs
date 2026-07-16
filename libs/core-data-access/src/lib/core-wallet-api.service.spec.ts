import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { CoreWalletApiService } from './core-wallet-api.service';

const mockApiConfig = {
  coreBaseUrl: 'http://localhost:8000',
  corePublicApiPrefix: '/api/v1/public',
};

describe('CoreWalletApiService', () => {
  let service: CoreWalletApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: mockApiConfig },
      ],
    });
    service = TestBed.inject(CoreWalletApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('ACTIVE: devuelve identificador, saldo y alias Bre-B tipados', () => {
    service.getSummary().subscribe((response) => {
      expect(response.data.wallet_status).toBe('ACTIVE');
      expect(response.data.virtual_number).toBe('1234567890');
      expect(response.data.format_type).toBe('CO_SAVINGS_VIRTUAL');
      expect(response.data.balance).toEqual({ amount: '50000.00', currency: 'COP' });
      expect(response.data.breb_alias).toEqual({ key_type: 'CELULAR', masked_value: '300***4567' });
      expect(response.data.interoperable).toBe(false);
    });

    const req = httpTesting.expectOne('http://localhost:8000/api/v1/public/wallet/summary');
    expect(req.request.method).toBe('GET');
    req.flush({
      data: {
        wallet_status: 'ACTIVE',
        friendly_name: 'Billetera Pleniu',
        virtual_number: '1234567890',
        format_type: 'CO_SAVINGS_VIRTUAL',
        country_code: 'CO',
        balance: { amount: '50000.00', currency: 'COP' },
        breb_alias: { key_type: 'CELULAR', masked_value: '300***4567' },
        interoperable: false,
      },
      meta: { correlation_id: 'corr-1' },
      errors: [],
    });
  });

  it('PROVISIONING: los campos identificador llegan en null en una respuesta 200 normal', () => {
    service.getSummary().subscribe((response) => {
      expect(response.data.wallet_status).toBe('PROVISIONING');
      expect(response.data.virtual_number).toBeNull();
      expect(response.data.format_type).toBeNull();
      expect(response.data.balance).toBeNull();
      expect(response.data.breb_alias).toBeNull();
    });

    const req = httpTesting.expectOne('http://localhost:8000/api/v1/public/wallet/summary');
    req.flush({
      data: {
        wallet_status: 'PROVISIONING',
        friendly_name: 'Billetera Pleniu',
        virtual_number: null,
        format_type: null,
        country_code: 'CO',
        balance: null,
        breb_alias: null,
        interoperable: false,
      },
      meta: { correlation_id: 'corr-2' },
      errors: [],
    });
  });

  it('propaga un error genérico del servidor', () => {
    let failed = false;
    service.getSummary().subscribe({
      error: () => {
        failed = true;
      },
    });

    const req = httpTesting.expectOne('http://localhost:8000/api/v1/public/wallet/summary');
    req.flush(
      { data: null, meta: { correlation_id: 'corr-3' }, errors: [{ code: 'INTERNAL_ERROR', message: 'x' }] },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(failed).toBe(true);
  });
});
