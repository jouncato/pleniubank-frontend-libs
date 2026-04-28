import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChargeFrequency, FeeCalculationBasis, FeeType } from '@pleniu/loan-domain';
import { LendingFeeService } from './lending-fee.service';
import { LOAN_API_BASE_URL } from '../tokens';
import type { ContractFeeResponse } from '../dtos/contract-fee.dto';

const BASE = '/api/v1';
const ARR_ID = 'ARR-001';
const FEE_ID = 'FEE-001';

const mockFeeDto: ContractFeeResponse = {
  id: FEE_ID,
  version: 1,
  lending_arrangement_id: ARR_ID,
  fee_type: FeeType.Origination,
  calculation_basis: FeeCalculationBasis.Fixed,
  currency: 'COP',
  charge_frequency: ChargeFrequency.OneTime,
  effective_from: '2025-01-01',
  metadata: {},
  created_at: '2025-01-01T00:00:00Z',
  created_by: 'user-1',
};

describe('LendingFeeService', () => {
  let service: LendingFeeService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOAN_API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(LendingFeeService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('list() calls GET /fees and maps to domain', () => {
    service.list(ARR_ID).subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0].id).toBe(FEE_ID);
      expect(items[0].feeType).toBe(FeeType.Origination);
    });
    controller
      .expectOne(`${BASE}/lending-arrangements/${ARR_ID}/fees`)
      .flush({ items: [mockFeeDto] });
  });

  it('add() calls POST /fees with payload', () => {
    service
      .add(ARR_ID, {
        fee_type: FeeType.Origination,
        calculation_basis: FeeCalculationBasis.Fixed,
        currency: 'COP',
        charge_frequency: ChargeFrequency.OneTime,
        effective_from: '2025-01-01',
      })
      .subscribe((f) => expect(f.id).toBe(FEE_ID));
    const req = controller.expectOne(`${BASE}/lending-arrangements/${ARR_ID}/fees`);
    expect(req.request.method).toBe('POST');
    req.flush(mockFeeDto);
  });

  it('update() calls PATCH /fees/:id', () => {
    service
      .update(ARR_ID, FEE_ID, { amount: '50000' })
      .subscribe((f) => expect(f.id).toBe(FEE_ID));
    const req = controller.expectOne(`${BASE}/lending-arrangements/${ARR_ID}/fees/${FEE_ID}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body['amount']).toBe('50000');
    req.flush(mockFeeDto);
  });

  it('retire() calls DELETE /fees/:id', () => {
    service.retire(ARR_ID, FEE_ID).subscribe((f) => expect(f.id).toBe(FEE_ID));
    const req = controller.expectOne(`${BASE}/lending-arrangements/${ARR_ID}/fees/${FEE_ID}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockFeeDto);
  });
});
