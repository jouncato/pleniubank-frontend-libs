import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';
import type {
  CreateSubEnterpriseRequest,
  CreateUserEnterpriseRequest,
  UpdateSubEnterpriseRequest,
} from 'identity-domain';

import { IdentitySubEnterpriseApiService } from './identity-sub-enterprise-api.service';

const mockApiConfig = { identityBaseUrl: 'http://localhost:8010' };

describe('IdentitySubEnterpriseApiService', () => {
  let service: IdentitySubEnterpriseApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: mockApiConfig },
      ],
    });
    service = TestBed.inject(IdentitySubEnterpriseApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createEnterpriseUser() llama POST /enterprise/{id}/users con id url-encoded', () => {
    const payload: CreateUserEnterpriseRequest = {
      email: 'u@acme.test',
      password: 'x',
      full_name: 'Nuevo Usuario',
      role_in_enterprise: 'operator',
    };
    service.createEnterpriseUser('ent 1', payload).subscribe((res) => {
      expect(res.data.user_id).toBe('u1');
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/enterprise/ent%201/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: { user_id: 'u1', user_enterprise_id: 'ue-1', email: payload.email, role_in_enterprise: 'operator', is_active: true } });
  });

  it('createSubEnterpriseUser() llama POST /sub-enterprise/{id}/users con id url-encoded', () => {
    const payload: CreateUserEnterpriseRequest = {
      email: 'u@acme.test',
      password: 'x',
      full_name: 'Nuevo Usuario',
      role_in_enterprise: 'viewer',
    };
    service.createSubEnterpriseUser('sub 1', payload).subscribe();
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/sub-enterprise/sub%201/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: { user_id: 'u1', user_enterprise_id: 'ue-1', email: payload.email, role_in_enterprise: 'viewer', is_active: true } });
  });

  it('listSubEnterpriseUsers() llama GET /sub-enterprise/{id}/users', () => {
    service.listSubEnterpriseUsers('sub 1').subscribe((res) => {
      expect(res.total).toBe(1);
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/sub-enterprise/sub%201/users');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [{ user_id: 'u1', full_name: 'A', email: 'a@x.com', role: 'operator', status: 'active', created_at: '2026-07-01T00:00:00Z' }], total: 1 });
  });

  it('createSubEnterprise() llama POST /enterprise/{id}/sub-enterprises y normaliza a { data }', () => {
    const payload: CreateSubEnterpriseRequest = {
      business_name: 'Sucursal Norte',
      document_type: 'NIT',
      document_number: '900999999',
      company_code: 'NORTE',
      email: 'norte@acme.test',
      phone: '3000000000',
    };
    service.createSubEnterprise('ent 1', payload).subscribe((res) => {
      expect(res.data.sub_enterprise_id).toBe('sub-1');
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/enterprise/ent%201/sub-enterprises');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      sub_enterprise_id: 'sub-1',
      enterprise_id: 'ent-1',
      business_name: 'Sucursal Norte',
      company_code: 'NORTE',
      status: 'active',
      created_at: '2026-07-01T00:00:00Z',
    });
  });

  it('listSubEnterprises() sin params llama GET /enterprise/{id}/sub-enterprises sin query', () => {
    service.listSubEnterprises('ent 1').subscribe((res) => {
      expect(res.data.length).toBe(1);
    });
    const req = httpTesting.expectOne(
      (r) => r.url === 'http://localhost:8010/api/v1/enterprise/ent%201/sub-enterprises',
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({
      data: [
        {
          sub_enterprise_id: 'sub-1',
          enterprise_id: 'ent-1',
          business_name: 'Sucursal Norte',
          company_code: 'NORTE',
          document_type: 'NIT',
          document_number: '900999999',
          email: 'norte@acme.test',
          phone: '3000000000',
          status: 'active',
          created_at: '2026-07-01T00:00:00Z',
        },
      ],
    });
  });

  it('listSubEnterprises(params) agrega status, search (trim) y limit (>0)', () => {
    service
      .listSubEnterprises('ent-1', { status: 'active', search: '  norte  ', limit: 50 })
      .subscribe();
    const req = httpTesting.expectOne(
      (r) =>
        r.url === 'http://localhost:8010/api/v1/enterprise/ent-1/sub-enterprises' &&
        r.params.get('status') === 'active' &&
        r.params.get('search') === 'norte' &&
        r.params.get('limit') === '50',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('listSubEnterprises() ignora search en blanco y limit <= 0', () => {
    service.listSubEnterprises('ent-1', { search: '   ', limit: 0 }).subscribe();
    const req = httpTesting.expectOne(
      (r) => r.url === 'http://localhost:8010/api/v1/enterprise/ent-1/sub-enterprises',
    );
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ data: [] });
  });

  it('listSubEnterprises() normaliza un array plano a { data: [...] }', () => {
    service.listSubEnterprises('ent-1').subscribe((res) => {
      expect(res.data.length).toBe(1);
    });
    const req = httpTesting.expectOne(
      (r) => r.url === 'http://localhost:8010/api/v1/enterprise/ent-1/sub-enterprises',
    );
    req.flush([
      {
        sub_enterprise_id: 'sub-1',
        enterprise_id: 'ent-1',
        business_name: 'Sucursal Norte',
        company_code: 'NORTE',
        document_type: 'NIT',
        document_number: '900999999',
        email: 'norte@acme.test',
        phone: '3000000000',
        status: 'active',
        created_at: '2026-07-01T00:00:00Z',
      },
    ]);
  });

  it('getSubEnterprise() llama GET /sub-enterprise/{id} y normaliza a { data }', () => {
    service.getSubEnterprise('sub 1').subscribe((res) => {
      expect(res.data.user_count).toBe(3);
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/sub-enterprise/sub%201');
    expect(req.request.method).toBe('GET');
    req.flush({
      sub_enterprise_id: 'sub-1',
      enterprise_id: 'ent-1',
      business_name: 'Sucursal Norte',
      document_type: 'NIT',
      document_number: '900999999',
      company_code: 'NORTE',
      email: 'norte@acme.test',
      phone: '3000000000',
      status: 'active',
      user_count: 3,
      created_at: '2026-07-01T00:00:00Z',
    });
  });

  it('updateSubEnterprise() llama PATCH /sub-enterprise/{id} con el body tal cual y normaliza a { data }', () => {
    const payload: UpdateSubEnterpriseRequest = { email: 'nuevo@acme.test' };
    service.updateSubEnterprise('sub 1', payload).subscribe((res) => {
      expect(res.data.email).toBe('nuevo@acme.test');
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/sub-enterprise/sub%201');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush({
      sub_enterprise_id: 'sub-1',
      enterprise_id: 'ent-1',
      business_name: 'Sucursal Norte',
      document_type: 'NIT',
      document_number: '900999999',
      company_code: 'NORTE',
      email: 'nuevo@acme.test',
      phone: '3000000000',
      status: 'active',
      user_count: 3,
      created_at: '2026-07-01T00:00:00Z',
    });
  });

  it('deactivateSubEnterprise() llama DELETE /sub-enterprise/{id}', () => {
    service.deactivateSubEnterprise('sub 1').subscribe();
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/sub-enterprise/sub%201');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
