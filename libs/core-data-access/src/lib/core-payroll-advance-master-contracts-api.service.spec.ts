import { HttpParams } from '@angular/common/http';
import { of } from 'rxjs';

import { CorePayrollAdvanceMasterContractsApiService } from './core-payroll-advance-master-contracts-api.service';

describe('CorePayrollAdvanceMasterContractsApiService', () => {
  const apiConfig = {
    coreBaseUrl: 'http://localhost:8000',
    identityBaseUrl: 'http://localhost:8080',
    coreAdminApiPrefix: '/api/v1/admin',
  };

  const mockHttp = () => ({
    get: vi.fn().mockReturnValue(of({ data: {} })),
    post: vi.fn().mockReturnValue(of({ data: {} })),
    patch: vi.fn().mockReturnValue(of({ data: {} })),
  });

  it('creates a model through the admin route', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);

    service
      .createModel({
        country_code: 'CO',
        model_version: 'PA-2026-01',
        policy_version: 'CO-PA-2026-01',
      })
      .subscribe();

    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/admin/payroll-advance-master-contracts/models',
      {
        country_code: 'CO',
        model_version: 'PA-2026-01',
        policy_version: 'CO-PA-2026-01',
      },
    );
  });

  it('updates status and assigns a business unit under the master contract', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);

    service.updateStatus('master-1', 'ACTIVE').subscribe();
    service
      .assign('master-1', {
        master_contract_id: 'master-1',
        enterprise_id: 'enterprise-1',
        sub_enterprise_id: 'sub-1',
        company_code: 'PAYROLL-NORTH',
      })
      .subscribe();

    expect(http.patch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/admin/payroll-advance-master-contracts/master-1/status',
      { status: 'ACTIVE' },
    );
    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/admin/payroll-advance-master-contracts/master-1/assignments',
      {
        master_contract_id: 'master-1',
        enterprise_id: 'enterprise-1',
        sub_enterprise_id: 'sub-1',
        company_code: 'PAYROLL-NORTH',
      },
    );
  });

  it('lists models with the given filters as query params', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);

    service
      .listModels({ product_type: 'PAYROLL_ADVANCE', country_code: 'CO', status: 'ACTIVE' })
      .subscribe();

    expect(http.get).toHaveBeenCalledTimes(1);
    const [url, options] = http.get.mock.calls[0];
    expect(url).toBe('http://localhost:8000/api/v1/admin/payroll-advance-master-contracts/models');
    expect((options.params as HttpParams).toString()).toBe(
      'product_type=PAYROLL_ADVANCE&country_code=CO&status=ACTIVE',
    );
  });

  it('lists models with no query params when no filters are given', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);

    service.listModels().subscribe();

    const [, options] = http.get.mock.calls[0];
    expect((options.params as HttpParams).toString()).toBe('');
  });

  it('lists assignments for a master contract', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);

    service.listAssignments('master-1').subscribe();

    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/admin/payroll-advance-master-contracts/master-1/assignments',
    );
  });

  it('lists master reconciliation with filters and pagination', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);

    service
      .listReconciliation({
        category: 'SYNC_FAILED',
        enterprise_id: 'enterprise-1',
        sub_enterprise_id: 'sub-1',
        limit: 50,
        offset: 100,
      })
      .subscribe();

    const [url, options] = http.get.mock.calls[0];
    expect(url).toBe(
      'http://localhost:8000/api/v1/admin/payroll-advance-master-contracts/reconciliation/report',
    );
    expect((options.params as HttpParams).toString()).toBe(
      'category=SYNC_FAILED&enterprise_id=enterprise-1&sub_enterprise_id=sub-1&limit=50&offset=100',
    );
  });

  it('lists the version history of a master contract', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);

    service.listVersions('master-1').subscribe();

    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/admin/payroll-advance-master-contracts/master-1/versions',
    );
  });

  it('revokes an assignment through the admin route', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);

    service.revokeAssignment('master-1', 'assignment-1').subscribe();

    expect(http.patch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/admin/payroll-advance-master-contracts/master-1/assignments/assignment-1/revoke',
      {},
    );
  });
});
