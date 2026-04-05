import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CorrelationContextService } from './correlation-context.service';
import { correlationIdInterceptor } from './correlation-id.interceptor';
import { createCorrelationId } from './correlation-id.util';

describe('correlationIdInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let ctx: CorrelationContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([correlationIdInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    ctx = TestBed.inject(CorrelationContextService);
  });

  it('genera X-Correlation-ID si no existe', () => {
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    const id = req.request.headers.get('X-Correlation-ID');
    expect(id).toBeTruthy();
    expect(id!.length).toBeGreaterThan(8);
    req.flush(
      { data: {}, meta: { correlation_id: id } },
      { headers: { 'X-Correlation-ID': id! } },
    );
    expect(ctx.lastResponseCorrelationId()).toBe(id);
  });

  it('no sobrescribe X-Correlation-ID existente', () => {
    http.get('/api/test', { headers: { 'X-Correlation-ID': 'preset-uuid' } }).subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('X-Correlation-ID')).toBe('preset-uuid');
    req.flush({ data: true });
  });

  it('guarda correlation_id en error envelope', () => {
    http.get('/api/fail').subscribe({ error: () => undefined });
    const req = httpMock.expectOne('/api/fail');
    req.flush(
      { errors: [{ code: 'X', message: 'y' }], meta: { correlation_id: 'err-cid' } },
      { status: 500, statusText: 'Server Error' },
    );
    expect(ctx.lastResponseCorrelationId()).toBe('err-cid');
  });
});

describe('createCorrelationId', () => {
  it('produce string no vacío', () => {
    expect(createCorrelationId().length).toBeGreaterThan(0);
  });
});
