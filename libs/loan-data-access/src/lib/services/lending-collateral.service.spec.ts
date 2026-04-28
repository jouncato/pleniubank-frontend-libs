import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CollateralPerfectionStatus, CollateralType } from '@pleniu/loan-domain';
import { LendingCollateralService } from './lending-collateral.service';
import { LOAN_API_BASE_URL } from '../tokens';
import type { CollateralResponse } from '../dtos/collateral.dto';

const BASE = '/api/v1';
const ARR_ID = 'ARR-001';
const COL_ID = 'COL-001';

const mockCollateralDto: CollateralResponse = {
  id: COL_ID,
  version: 1,
  lending_arrangement_id: ARR_ID,
  collateral_type: CollateralType.Vehicle,
  perfection_status: CollateralPerfectionStatus.Pending,
  metadata: {},
  created_at: '2025-01-01T00:00:00Z',
  created_by: 'user-1',
};

describe('LendingCollateralService', () => {
  let service: LendingCollateralService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOAN_API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(LendingCollateralService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('list() calls GET /collaterals and maps to domain', () => {
    service.list(ARR_ID).subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0].id).toBe(COL_ID);
      expect(items[0].collateralType).toBe(CollateralType.Vehicle);
    });
    controller
      .expectOne(`${BASE}/lending-arrangements/${ARR_ID}/collaterals`)
      .flush({ items: [mockCollateralDto] });
  });

  it('add() calls POST /collaterals with payload', () => {
    service
      .add(ARR_ID, { collateral_type: CollateralType.Vehicle })
      .subscribe((c) => expect(c.id).toBe(COL_ID));
    const req = controller.expectOne(`${BASE}/lending-arrangements/${ARR_ID}/collaterals`);
    expect(req.request.method).toBe('POST');
    req.flush(mockCollateralDto);
  });

  it('update() calls PATCH /collaterals/:id', () => {
    service
      .update(ARR_ID, COL_ID, { description: 'updated' })
      .subscribe((c) => expect(c.id).toBe(COL_ID));
    const req = controller.expectOne(
      `${BASE}/lending-arrangements/${ARR_ID}/collaterals/${COL_ID}`,
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body['description']).toBe('updated');
    req.flush(mockCollateralDto);
  });

  it('retire() calls DELETE /collaterals/:id', () => {
    service.retire(ARR_ID, COL_ID).subscribe((c) => expect(c.id).toBe(COL_ID));
    const req = controller.expectOne(
      `${BASE}/lending-arrangements/${ARR_ID}/collaterals/${COL_ID}`,
    );
    expect(req.request.method).toBe('DELETE');
    req.flush(mockCollateralDto);
  });
});
