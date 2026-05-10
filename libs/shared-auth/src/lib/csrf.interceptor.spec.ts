import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SESSION_STRATEGY } from './session-strategy.token';
import { SessionStore } from './session-store.service';
import { csrfInterceptor } from './csrf.interceptor';

function setCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}`;
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

describe('csrfInterceptor (httpOnlyCookie strategy)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([csrfInterceptor])),
        provideHttpClientTesting(),
        SessionStore,
        { provide: SESSION_STRATEGY, useValue: 'httpOnlyCookie' },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    clearCookie('pleniu_csrf');
    sessionStorage.clear();
  });

  it('adds X-CSRF-Token header on POST requests when cookie is present', () => {
    setCookie('pleniu_csrf', 'test-csrf-token');

    http.post('/api/v1/resource', {}).subscribe();
    const req = httpMock.expectOne('/api/v1/resource');
    expect(req.request.headers.get('X-CSRF-Token')).toBe('test-csrf-token');
    req.flush({});
  });

  it('adds X-CSRF-Token header on PUT requests when cookie is present', () => {
    setCookie('pleniu_csrf', 'test-csrf-token');

    http.put('/api/v1/resource', {}).subscribe();
    const req = httpMock.expectOne('/api/v1/resource');
    expect(req.request.headers.get('X-CSRF-Token')).toBe('test-csrf-token');
    req.flush({});
  });

  it('adds X-CSRF-Token header on PATCH requests when cookie is present', () => {
    setCookie('pleniu_csrf', 'test-csrf-token');

    http.patch('/api/v1/resource', {}).subscribe();
    const req = httpMock.expectOne('/api/v1/resource');
    expect(req.request.headers.get('X-CSRF-Token')).toBe('test-csrf-token');
    req.flush({});
  });

  it('adds X-CSRF-Token header on DELETE requests when cookie is present', () => {
    setCookie('pleniu_csrf', 'test-csrf-token');

    http.delete('/api/v1/resource').subscribe();
    const req = httpMock.expectOne('/api/v1/resource');
    expect(req.request.headers.get('X-CSRF-Token')).toBe('test-csrf-token');
    req.flush({});
  });

  it('does not add X-CSRF-Token header on GET requests', () => {
    setCookie('pleniu_csrf', 'test-csrf-token');

    http.get('/api/v1/resource').subscribe();
    const req = httpMock.expectOne('/api/v1/resource');
    expect(req.request.headers.get('X-CSRF-Token')).toBeNull();
    req.flush({});
  });

  it('does not add X-CSRF-Token header when CSRF cookie is absent', () => {
    clearCookie('pleniu_csrf');

    http.post('/api/v1/resource', {}).subscribe();
    const req = httpMock.expectOne('/api/v1/resource');
    expect(req.request.headers.get('X-CSRF-Token')).toBeNull();
    req.flush({});
  });
});

describe('csrfInterceptor (sessionStorage strategy)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([csrfInterceptor])),
        provideHttpClientTesting(),
        SessionStore,
        { provide: SESSION_STRATEGY, useValue: 'sessionStorage' },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    clearCookie('pleniu_csrf');
    sessionStorage.clear();
  });

  it('does not add X-CSRF-Token header even for POST when not using cookie strategy', () => {
    setCookie('pleniu_csrf', 'test-csrf-token');

    http.post('/api/v1/resource', {}).subscribe();
    const req = httpMock.expectOne('/api/v1/resource');
    expect(req.request.headers.get('X-CSRF-Token')).toBeNull();
    req.flush({});
  });
});
