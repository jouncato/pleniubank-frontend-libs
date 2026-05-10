import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SESSION_STRATEGY } from './session-strategy.token';
import { SessionStore } from './session-store.service';
import { authTokenInterceptor } from './auth-token.interceptor';

describe('authTokenInterceptor (sessionStorage strategy)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let store: SessionStore;

  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authTokenInterceptor])),
        provideHttpClientTesting(),
        SessionStore,
        { provide: SESSION_STRATEGY, useValue: 'sessionStorage' },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('attaches Authorization Bearer header when user token is present', () => {
    store.setUserToken('my-access-token');

    http.get('/api/v1/resource').subscribe();
    const req = httpMock.expectOne('/api/v1/resource');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-access-token');
    req.flush({});
  });

  it('does not attach Authorization header for public identity routes (/auth/login)', () => {
    store.setUserToken('my-access-token');

    http.get('/auth/login').subscribe();
    const req = httpMock.expectOne('/auth/login');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
  });

  it('does not attach Authorization header for /auth/register', () => {
    store.setUserToken('my-access-token');

    http.get('/auth/register').subscribe();
    const req = httpMock.expectOne('/auth/register');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
  });

  it('does not attach Authorization header for /auth/forgot-password', () => {
    store.setUserToken('my-access-token');

    http.get('/auth/forgot-password').subscribe();
    const req = httpMock.expectOne('/auth/forgot-password');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
  });

  it('does not attach Authorization header for /health endpoint', () => {
    store.setUserToken('my-access-token');

    http.get('/health').subscribe();
    const req = httpMock.expectOne('/health');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
  });

  it('does not attach Authorization header when no token is present', () => {
    http.get('/api/v1/resource').subscribe();
    const req = httpMock.expectOne('/api/v1/resource');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
  });

  it('uses adminToken for /api/v1/admin/ routes', () => {
    store.setUserToken('user-token');
    store.setAdminToken('admin-token');

    http.get('/api/v1/admin/users').subscribe();
    const req = httpMock.expectOne('/api/v1/admin/users');
    expect(req.request.headers.get('Authorization')).toBe('Bearer admin-token');
    req.flush({});
  });

  it('uses adminToken for /api/identity/api/v1/enterprise/ routes', () => {
    store.setUserToken('user-token');
    store.setAdminToken('admin-token');

    http.get('/api/identity/api/v1/enterprise/list').subscribe();
    const req = httpMock.expectOne('/api/identity/api/v1/enterprise/list');
    expect(req.request.headers.get('Authorization')).toBe('Bearer admin-token');
    req.flush({});
  });

  it('falls back to userToken for admin routes when adminToken is null', () => {
    store.setUserToken('user-token');
    // no adminToken set

    http.get('/api/v1/admin/users').subscribe();
    const req = httpMock.expectOne('/api/v1/admin/users');
    expect(req.request.headers.get('Authorization')).toBe('Bearer user-token');
    req.flush({});
  });
});

describe('authTokenInterceptor (httpOnlyCookie strategy)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authTokenInterceptor])),
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
    sessionStorage.clear();
  });

  it('sets withCredentials on all requests when using cookie strategy', () => {
    http.get('/api/v1/resource').subscribe();
    const req = httpMock.expectOne('/api/v1/resource');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });
});
