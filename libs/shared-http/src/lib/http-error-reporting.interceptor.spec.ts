import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HTTP_ERROR_REPORTING_HANDLER } from './http-error-reporting.token';
import { httpErrorReportingInterceptor } from './http-error-reporting.interceptor';

describe('httpErrorReportingInterceptor', () => {
  it('invoca handler en 503', () => {
    const report = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorReportingInterceptor])),
        provideHttpClientTesting(),
        { provide: HTTP_ERROR_REPORTING_HANDLER, useValue: report },
      ],
    });
    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);
    http.get('/x').subscribe({ error: () => undefined });
    httpMock.expectOne('/x').flush(null, { status: 503, statusText: 'Service Unavailable' });
    expect(report).toHaveBeenCalled();
    expect(report).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        httpStatus: 503,
        method: 'GET',
        url: '/x',
      }),
    );
  });

  it('no invoca handler en 404', () => {
    const report = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorReportingInterceptor])),
        provideHttpClientTesting(),
        { provide: HTTP_ERROR_REPORTING_HANDLER, useValue: report },
      ],
    });
    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);
    http.get('/y').subscribe({ error: () => undefined });
    httpMock.expectOne('/y').flush(null, { status: 404, statusText: 'Not Found' });
    expect(report).not.toHaveBeenCalled();
  });
});
