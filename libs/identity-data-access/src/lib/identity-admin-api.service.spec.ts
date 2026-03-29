import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from 'shared-http';

import { IdentityAdminApiService } from './identity-admin-api.service';

describe('IdentityAdminApiService', () => {
  let service: IdentityAdminApiService;
  let httpMock: HttpTestingController;
  const base = 'http://identity.test';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        IdentityAdminApiService,
        {
          provide: API_CONFIG,
          useValue: { identityBaseUrl: base, coreBaseUrl: 'http://core.test' },
        },
      ],
    });
    service = TestBed.inject(IdentityAdminApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('listUsers incluye solo query definidas y normaliza respuesta plana', () => {
    service
      .listUsers({
        limit: 10,
        email: 'a@b.com',
        enterprise_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'inactive',
        cursor: 'c1',
      })
      .subscribe((env) => {
        expect(env.data).toEqual([]);
        expect(env.meta?.has_more).toBe(true);
        expect(env.meta?.cursor).toBe('next');
      });

    const req = httpMock.expectOne((r) => r.url === `${base}/api/v1/admin/users`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('email')).toBe('a@b.com');
    expect(req.request.params.get('enterprise_id')).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(req.request.params.get('status')).toBe('inactive');
    expect(req.request.params.get('cursor')).toBe('c1');
    expect(req.request.params.has('role')).toBe(false);

    req.flush({ items: [], has_more: true, cursor: 'next' });
  });

  it('listUsers sin filtros no agrega query params', () => {
    service.listUsers({}).subscribe();
    const req = httpMock.expectOne(`${base}/api/v1/admin/users`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ data: [] });
  });

  it('listEnterprises incluye solo query definidas y normaliza respuesta plana', () => {
    service
      .listEnterprises({
        limit: 10,
        search: 'Acme',
        status: 'pending_kyb',
        cursor: 'cur1',
      })
      .subscribe((env) => {
        expect(env.data?.length).toBe(0);
        expect(env.meta?.has_more).toBe(false);
      });

    const req = httpMock.expectOne((r) => r.url === `${base}/api/v1/admin/enterprises`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('search')).toBe('Acme');
    expect(req.request.params.get('status')).toBe('pending_kyb');
    expect(req.request.params.get('cursor')).toBe('cur1');

    req.flush({ items: [], has_more: false, cursor: null });
  });
});
