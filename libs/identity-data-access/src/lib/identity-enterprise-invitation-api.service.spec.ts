import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { IdentityEnterpriseInvitationApiService } from './identity-enterprise-invitation-api.service';

const mockApiConfig = { identityBaseUrl: 'http://localhost:8010' };

describe('IdentityEnterpriseInvitationApiService', () => {
  let service: IdentityEnterpriseInvitationApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: mockApiConfig },
      ],
    });
    service = TestBed.inject(IdentityEnterpriseInvitationApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('inviteUser() llama POST /enterprise/invite-user con el body tal cual', () => {
    service.inviteUser({ email: 'nuevo@acme.test', role_hint: 'operator' }).subscribe((res) => {
      expect(res.data.invite_id).toBe('inv-1');
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/enterprise/invite-user');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'nuevo@acme.test', role_hint: 'operator' });
    req.flush({ data: { invite_id: 'inv-1', expires_at: '2026-08-01T00:00:00Z' } });
  });

  it('acceptInvite() llama POST /auth/accept-invite con el body tal cual', () => {
    service.acceptInvite({ token: 'tok-1', password: 'x' }).subscribe((res) => {
      expect(res.data.user_id).toBe('u1');
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/accept-invite');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'tok-1', password: 'x' });
    req.flush({ data: { user_id: 'u1', enterprise_id: 'ent-1', email: 'x@acme.test', role_in_enterprise: 'operator' } });
  });

  it('inviteEmployee() llama POST /enterprise/invite-employee con sub_enterprise_id y email', () => {
    service.inviteEmployee({ email: 'emp@acme.test', sub_enterprise_id: 'sub-1' }).subscribe((res) => {
      expect(res.data.invite_id).toBe('inv-2');
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/enterprise/invite-employee');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'emp@acme.test', sub_enterprise_id: 'sub-1' });
    req.flush({
      data: {
        invite_id: 'inv-2',
        sub_enterprise_id: 'sub-1',
        email: 'emp@acme.test',
        expires_at: '2026-08-01T00:00:00Z',
        status: 'pending',
      },
    });
  });

  it('validateEmployeeInvitation() llama GET /employee-invitations/{token}/validate', () => {
    service.validateEmployeeInvitation('tok-abc').subscribe((res) => {
      expect(res.data.is_valid).toBe(true);
    });
    const req = httpTesting.expectOne(
      'http://localhost:8010/api/v1/employee-invitations/tok-abc/validate',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      data: {
        enterprise_id: 'ent-1',
        sub_enterprise_id: 'sub-1',
        business_name: 'Empresa SAS',
        sub_enterprise_name: 'Unidad Norte',
        email: 'emp@acme.test',
        status: 'pending',
        expires_at: '2026-08-01T00:00:00Z',
        is_valid: true,
      },
    });
  });

  it('acceptEmployeeInvitation() llama POST /employee-invitations/{token}/accept con token y email', () => {
    service.acceptEmployeeInvitation('tok-abc', { token: 'tok-abc', email: 'emp@acme.test' }).subscribe((res) => {
      expect(res.data.next_step).toBe('register');
    });
    const req = httpTesting.expectOne(
      'http://localhost:8010/api/v1/employee-invitations/tok-abc/accept',
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'tok-abc', email: 'emp@acme.test' });
    req.flush({
      data: {
        next_step: 'register',
        email: 'emp@acme.test',
        sub_enterprise_id: 'sub-1',
        enterprise_id: 'ent-1',
        token: 'tok-abc',
      },
    });
  });
});
