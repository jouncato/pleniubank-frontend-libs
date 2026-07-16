import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { CoreBrebKeysSelfServiceApiService } from './core-breb-keys-self-service-api.service';

const mockApiConfig = {
  coreBaseUrl: 'http://localhost:8000',
  corePublicApiPrefix: '/api/v1/public',
};

const BASE_URL = 'http://localhost:8000/api/v1/public/customers/me/breb-keys';

describe('CoreBrebKeysSelfServiceApiService', () => {
  let service: CoreBrebKeysSelfServiceApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: mockApiConfig },
      ],
    });
    service = TestBed.inject(CoreBrebKeysSelfServiceApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('el listado no expone ningún valor de la llave, ni siquiera enmascarado', () => {
      service.list().subscribe((response) => {
        expect(response.data.total).toBe(1);
        const item = response.data.items[0];
        expect(item).toEqual({
          id: 'key-1',
          key_type: 'CELULAR',
          is_active: true,
          verified: true,
          created_at: '2026-07-01T00:00:00Z',
        });
        expect(Object.keys(item as object).sort()).toEqual(
          ['created_at', 'id', 'is_active', 'key_type', 'verified'].sort(),
        );
      });

      const req = httpTesting.expectOne(BASE_URL);
      expect(req.request.method).toBe('GET');
      req.flush({
        data: {
          items: [
            {
              id: 'key-1',
              key_type: 'CELULAR',
              is_active: true,
              verified: true,
              created_at: '2026-07-01T00:00:00Z',
            },
          ],
          total: 1,
        },
        meta: { correlation_id: 'corr-1' },
        errors: [],
      });
    });
  });

  describe('register', () => {
    it('envía key_value solo en el cuerpo del POST; la respuesta no lo re-expone', () => {
      service.register({ key_type: 'CELULAR', key_value: '3001234567' }).subscribe((response) => {
        expect(response.data.id).toBe('key-2');
        expect(Object.keys(response.data as object)).not.toContain('key_value');
      });

      const req = httpTesting.expectOne(BASE_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ key_type: 'CELULAR', key_value: '3001234567' });
      req.flush({
        data: {
          id: 'key-2',
          key_type: 'CELULAR',
          is_active: true,
          verified: false,
          created_at: '2026-07-16T00:00:00Z',
        },
        meta: { correlation_id: 'corr-2' },
        errors: [],
      });
    });

    it('rechazo anti-enumeración (422 BREB_KEY_NOT_ELIGIBLE) se propaga como error sin enriquecer', () => {
      let failed = false;
      let errorBody: unknown;
      service.register({ key_type: 'CEDULA', key_value: '999999999' }).subscribe({
        error: (err) => {
          failed = true;
          errorBody = err.error;
        },
      });

      const req = httpTesting.expectOne(BASE_URL);
      req.flush(
        {
          data: null,
          meta: { correlation_id: 'corr-3' },
          errors: [
            {
              code: 'BREB_KEY_NOT_ELIGIBLE',
              message: 'No fue posible registrar la llave con el valor proporcionado.',
            },
          ],
        },
        { status: 422, statusText: 'Unprocessable Entity' },
      );

      expect(failed).toBe(true);
      expect((errorBody as { errors: Array<{ code: string }> }).errors[0].code).toBe(
        'BREB_KEY_NOT_ELIGIBLE',
      );
    });
  });

  describe('remove', () => {
    it('DELETE exitoso devuelve deactivated=true', () => {
      service.remove('key-1').subscribe((response) => {
        expect(response.data).toEqual({ deactivated: true, breb_key_id: 'key-1' });
      });

      const req = httpTesting.expectOne(`${BASE_URL}/key-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({
        data: { deactivated: true, breb_key_id: 'key-1' },
        meta: { correlation_id: 'corr-4' },
        errors: [],
      });
    });

    it('404 BREB_KEY_NOT_FOUND se propaga como error cuando la llave no existe o ya está inactiva', () => {
      let failed = false;
      service.remove('key-missing').subscribe({
        error: () => {
          failed = true;
        },
      });

      const req = httpTesting.expectOne(`${BASE_URL}/key-missing`);
      req.flush(
        {
          data: null,
          meta: { correlation_id: 'corr-5' },
          errors: [{ code: 'BREB_KEY_NOT_FOUND', message: 'x' }],
        },
        { status: 404, statusText: 'Not Found' },
      );

      expect(failed).toBe(true);
    });
  });
});
