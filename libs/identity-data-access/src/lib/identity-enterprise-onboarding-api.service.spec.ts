import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';
import type { RegisterEnterpriseRequest, VerifyEnterpriseEmailRequest } from 'identity-domain';

import { IdentityEnterpriseOnboardingApiService } from './identity-enterprise-onboarding-api.service';

const mockApiConfig = { identityBaseUrl: 'http://localhost:8010' };

describe('IdentityEnterpriseOnboardingApiService', () => {
  let service: IdentityEnterpriseOnboardingApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: mockApiConfig },
      ],
    });
    service = TestBed.inject(IdentityEnterpriseOnboardingApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('registerEnterprise() llama POST /auth/register-enterprise y normaliza cuerpo plano a { data }', () => {
    const payload: RegisterEnterpriseRequest = {
      business_name: 'Acme SAS',
      document_type: 'NIT',
      document_number: '900123456',
      company_email: 'contacto@acme.test',
      company_phone: '3001234567',
      economic_sector_id: 'sec-1',
      principal: { email: 'principal@acme.test', password: 'x', full_name: 'Ana Principal' },
      admin: { email: 'admin@acme.test', password: 'x', full_name: 'Ana Admin' },
    };
    service.registerEnterprise(payload).subscribe((res) => {
      expect(res.data.enterprise_id).toBe('ent-1');
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/register-enterprise');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ enterprise_id: 'ent-1', principal_user_id: 'u1', admin_user_id: 'u2', status: 'pending' });
  });

  it('registerEnterprise() respeta un cuerpo ya envuelto en { data }', () => {
    service.registerEnterprise({} as RegisterEnterpriseRequest).subscribe((res) => {
      expect(res.data.enterprise_id).toBe('ent-2');
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/register-enterprise');
    req.flush({ data: { enterprise_id: 'ent-2', principal_user_id: 'u1', admin_user_id: 'u2', status: 'pending' } });
  });

  it('listPublicEconomicSectors() sin category llama GET /economic-sectors sin params', () => {
    service.listPublicEconomicSectors().subscribe((res) => {
      expect(res.data.length).toBe(1);
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/economic-sectors');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ data: [{ sector_id: 's1', code: 'AGR', label_es: 'Agro', category: 'primario', ui_sort_order: 1 }] });
  });

  it('listPublicEconomicSectors(category) agrega el query param category', () => {
    service.listPublicEconomicSectors('primario').subscribe();
    const req = httpTesting.expectOne(
      (r) => r.url === 'http://localhost:8010/api/v1/economic-sectors' && r.params.get('category') === 'primario',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('listPublicEconomicSectors() normaliza una respuesta sin data a { data: [] }', () => {
    service.listPublicEconomicSectors().subscribe((res) => {
      expect(res.data).toEqual([]);
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/economic-sectors');
    req.flush([{ sector_id: 's1' }]);
  });

  it('verifyEnterpriseEmail() llama POST /auth/verify-enterprise-email y normaliza a { data }', () => {
    const payload: VerifyEnterpriseEmailRequest = { user_id: 'u1', code: '123456' };
    service.verifyEnterpriseEmail(payload).subscribe((res) => {
      expect(res.data.email_verified).toBe(true);
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/verify-enterprise-email');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      user_id: 'u1',
      enterprise_id: 'ent-1',
      email_verified: true,
      enterprise_status: 'pending',
      enterprise_emails_complete: false,
      principal_email_verified: true,
      admin_email_verified: false,
      is_active: true,
    });
  });

  it('resendEnterpriseEmailOtp() llama POST /auth/resend-enterprise-email-otp y normaliza a { data }', () => {
    service.resendEnterpriseEmailOtp({ user_id: 'u1' }).subscribe((res) => {
      expect(res.data.status).toBe('sent');
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/resend-enterprise-email-otp');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ user_id: 'u1' });
    req.flush({ status: 'sent' });
  });

  it('submitKybDocuments() llama POST /enterprise/kyb/documents sin normalizar la respuesta', () => {
    service.submitKybDocuments({ waive_all_mvp: true }).subscribe((res) => {
      expect(res.data.enterprise_status).toBe('kyb_pending');
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/enterprise/kyb/documents');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ waive_all_mvp: true });
    req.flush({ data: { enterprise_id: 'ent-1', enterprise_status: 'kyb_pending', stages: [] } });
  });

  it('getEnterpriseMeSummary() llama GET /enterprise/me/summary y devuelve cuerpo plano', () => {
    service.getEnterpriseMeSummary().subscribe((res) => {
      expect(res.enterprise_id).toBe('ent-1');
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/enterprise/me/summary');
    expect(req.request.method).toBe('GET');
    req.flush({
      enterprise_id: 'ent-1',
      enterprise_name: 'Acme SAS',
      enterprise_status: 'active',
      kyb_complete: true,
    });
  });
});
