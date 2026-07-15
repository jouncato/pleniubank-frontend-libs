import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { CoreStatementsApiService } from './core-statements-api.service';

const mockApiConfig = {
  coreBaseUrl: 'http://localhost:8000',
  coreAdminApiPrefix: '/api/v1/admin',
  corePublicApiPrefix: '/api/v1/public',
};

describe('CoreStatementsApiService', () => {
  let service: CoreStatementsApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: mockApiConfig },
      ],
    });
    service = TestBed.inject(CoreStatementsApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('staff (unchanged base)', () => {
    it('get() usa la base admin', () => {
      service.get({ account_id: 'acc-1' }).subscribe();
      const req = httpTesting.expectOne((r) => r.url === 'http://localhost:8000/api/v1/admin/statements');
      req.flush({ data: {} });
    });
  });

  describe('getCustomerStatement (b2c-statements)', () => {
    it('usa la base pública con account_id/date_from/date_to', () => {
      service.getCustomerStatement('acc-1', '2026-06-01', '2026-06-30').subscribe();

      const req = httpTesting.expectOne((r) => {
        const p = r.params;
        return (
          r.url === 'http://localhost:8000/api/v1/public/statements' &&
          p.get('account_id') === 'acc-1' &&
          p.get('date_from') === '2026-06-01' &&
          p.get('date_to') === '2026-06-30'
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush({ data: {} });
    });
  });

  describe('exportCustomerStatement', () => {
    it('parsea el filename de Content-Disposition (filename*=UTF-8)', () => {
      let result: { blob: Blob; filename: string } | undefined;
      service.exportCustomerStatement('acc-1', '2026-06-01', '2026-06-30', 'pdf').subscribe((r) => {
        result = r;
      });

      const req = httpTesting.expectOne(
        (r) =>
          r.url === 'http://localhost:8000/api/v1/public/statements/export' &&
          r.params.get('account_id') === 'acc-1' &&
          r.params.get('format') === 'pdf',
      );
      expect(req.request.method).toBe('GET');
      req.flush(new Blob(['pdf-bytes']), {
        headers: { 'Content-Disposition': "attachment; filename*=UTF-8''extracto_acc-1_junio.pdf" },
      });

      expect(result?.filename).toBe('extracto_acc-1_junio.pdf');
      expect(result?.blob).toBeInstanceOf(Blob);
    });

    it('usa el nombre de respaldo cuando no hay Content-Disposition', () => {
      let result: { blob: Blob; filename: string } | undefined;
      service.exportCustomerStatement('acc-2', '2026-06-01', '2026-06-30', 'csv').subscribe((r) => {
        result = r;
      });

      const req = httpTesting.expectOne((r) => r.url === 'http://localhost:8000/api/v1/public/statements/export');
      req.flush(new Blob(['csv-bytes']));

      expect(result?.filename).toBe('extracto_acc-2_2026-06-01_2026-06-30.csv');
    });
  });
});
