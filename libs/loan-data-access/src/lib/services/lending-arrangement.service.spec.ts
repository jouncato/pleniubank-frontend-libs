import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LendingStatus, ProductType, RateType, DayCountConvention, RepaymentFrequency } from '@pleniu/loan-domain';
import { LendingArrangementService } from './lending-arrangement.service';
import { LOAN_API_BASE_URL } from '../tokens';
import type { LendingArrangementResponse } from '../dtos/lending-arrangement.dto';

const BASE = '/api/v1';

const mockDto: LendingArrangementResponse = {
  id: 'ROW-001',
  arrangement_id: 'ARR-001',
  version: 1,
  product_id: 'PROD-1',
  product_type: ProductType.PayrollAdvance,
  customer_id: 'CUST-1',
  jurisdiction: 'CO',
  currency: 'COP',
  principal_amount: '1000000.00',
  rate_type: RateType.Fixed,
  day_count_convention: DayCountConvention.Act360,
  repayment_frequency: RepaymentFrequency.Monthly,
  effective_date: '2025-01-01',
  status: LendingStatus.Draft,
  extension_data: {},
  party_roles: [],
  created_at: '2025-01-01T00:00:00Z',
  created_by: 'user-1',
};

describe('LendingArrangementService', () => {
  let service: LendingArrangementService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOAN_API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(LendingArrangementService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('create() calls POST /lending-arrangements with snake_case body', () => {
    service.create({
      productType: ProductType.PayrollAdvance,
      productId: 'PROD-1',
      customerId: 'CUST-1',
      jurisdiction: 'CO',
      currency: 'COP',
      principal: { amount: '1000000.00', currency: 'COP' },
      rateType: RateType.Fixed,
      dayCountConvention: DayCountConvention.Act360,
      repaymentFrequency: RepaymentFrequency.Monthly,
      effectiveDate: '2025-01-01',
    }).subscribe();

    const req = controller.expectOne(`${BASE}/lending-arrangements`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body['product_type']).toBe(ProductType.PayrollAdvance);
    expect(req.request.body['customer_id']).toBe('CUST-1');
    expect(req.request.body['principal_amount']).toBe('1000000.00');
    req.flush(mockDto);
  });

  it('getById() maps response arrangement_id → arrangementId', () => {
    service.getById('ARR-001').subscribe((r) => {
      expect(r.arrangementId).toBe('ARR-001');
      expect(r.principal.amount).toBe('1000000.00');
      expect(r.productType).toBe(ProductType.PayrollAdvance);
    });
    controller.expectOne(`${BASE}/lending-arrangements/ARR-001`).flush(mockDto);
  });

  it('getVersions() maps items array', () => {
    service.getVersions('ARR-001').subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0].version).toBe(1);
    });
    controller
      .expectOne(`${BASE}/lending-arrangements/ARR-001/versions`)
      .flush({ data: [mockDto], meta: { total: 1, cursor: null, has_more: false }, errors: [] });
  });

  it('list() maps query params correctly', () => {
    service
      .list({ customerId: 'C', status: LendingStatus.Active, page: 2, pageSize: 10 })
      .subscribe();
    const req = controller.expectOne(
      (r) => r.url === `${BASE}/lending-arrangements`,
    );
    expect(req.request.params.get('customer_id')).toBe('C');
    expect(req.request.params.get('status')).toBe(LendingStatus.Active);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('page_size')).toBe('10');
    req.flush({ data: [mockDto], meta: { total: 1, cursor: null, has_more: false }, errors: [] });
  });

  it('activate() calls correct path with reason body', () => {
    service.activate('ARR-001', 'approved').subscribe();
    const req = controller.expectOne(`${BASE}/lending-arrangements/ARR-001/activate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason: 'approved' });
    req.flush(mockDto);
  });

  it('suspend() calls correct path', () => {
    service.suspend('ARR-001', 'compliance').subscribe();
    const req = controller.expectOne(`${BASE}/lending-arrangements/ARR-001/suspend`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body['reason']).toBe('compliance');
    req.flush(mockDto);
  });

  it('resume() calls correct path', () => {
    service.resume('ARR-001').subscribe();
    const req = controller.expectOne(`${BASE}/lending-arrangements/ARR-001/resume`);
    expect(req.request.method).toBe('POST');
    req.flush(mockDto);
  });

  it('close() calls correct path', () => {
    service.close('ARR-001', 'paid-off').subscribe();
    const req = controller.expectOne(`${BASE}/lending-arrangements/ARR-001/close`);
    expect(req.request.method).toBe('POST');
    req.flush(mockDto);
  });

  it('amend() passes changes to body', () => {
    service.amend('ARR-001', { nominalRate: 0.12 }).subscribe();
    const req = controller.expectOne(`${BASE}/lending-arrangements/ARR-001/amend`);
    expect(req.request.body['nominalRate']).toBe(0.12);
    req.flush(mockDto);
  });

  it('propagates HTTP 409 error observable', () => {
    let errorStatus = 0;
    service.activate('ARR-001').subscribe({ error: (e) => (errorStatus = e.status) });
    controller
      .expectOne(`${BASE}/lending-arrangements/ARR-001/activate`)
      .flush({ detail: 'conflict' }, { status: 409, statusText: 'Conflict' });
    expect(errorStatus).toBe(409);
  });
});
