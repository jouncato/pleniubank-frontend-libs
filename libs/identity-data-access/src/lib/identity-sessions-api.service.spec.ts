import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { IdentitySessionsApiService } from './identity-sessions-api.service';

const mockApiConfig = { identityBaseUrl: 'http://localhost:8010' };

describe('IdentitySessionsApiService', () => {
  let service: IdentitySessionsApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: mockApiConfig },
      ],
    });
    service = TestBed.inject(IdentitySessionsApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('list() marca la sesión actual', () => {
    service.list().subscribe((res) => {
      expect(res.sessions.find((s) => s.current)?.session_id).toBe('s-1');
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/me/sessions');
    expect(req.request.method).toBe('GET');
    req.flush({
      sessions: [
        { session_id: 's-1', ua_summary: 'Chrome / Windows', ip_truncated: '190.10.20.0', created_at: '2026-07-01T00:00:00Z', last_seen_at: '2026-07-15T00:00:00Z', current: true },
        { session_id: 's-2', ua_summary: 'App Android', ip_truncated: '181.5.0.0', created_at: '2026-06-01T00:00:00Z', last_seen_at: '2026-07-10T00:00:00Z', current: false },
      ],
    });
  });

  it('revoke() llama DELETE /auth/me/sessions/{id}', () => {
    service.revoke('s-2').subscribe();
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/me/sessions/s-2');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('revokeOthers() llama POST /auth/me/sessions/revoke-others y devuelve revoked_count', () => {
    service.revokeOthers().subscribe((res) => {
      expect(res.revoked_count).toBe(2);
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/me/sessions/revoke-others');
    expect(req.request.method).toBe('POST');
    req.flush({ revoked_count: 2 });
  });
});
