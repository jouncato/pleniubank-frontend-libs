import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Subject, of, throwError } from 'rxjs';
import { LendingArrangementService } from '@pleniu/loan-data-access';
import { LendingStatus } from '@pleniu/loan-domain';
import type { LendingArrangement } from '@pleniu/loan-domain';
import { LendingArrangementStore } from './lending-arrangement.store';

const ARRANGEMENT_ID = 'ARR-001';

const mockArrangement: LendingArrangement = {
  arrangementId: ARRANGEMENT_ID,
  version: 1,
  status: LendingStatus.Active,
  productId: 'PROD-001',
  productType: 'PAYROLL_ADVANCE' as never,
  customerId: 'CUST-001',
  jurisdiction: 'CO',
  principal: { amount: '5000000', currency: 'COP' },
  nominalRate: 0.18,
  termMonths: 12,
  currency: 'COP',
  rateType: 'FIXED' as never,
  dayCountConvention: 'ACT_365' as never,
  repaymentFrequency: 'MONTHLY' as never,
  effectiveDate: '2026-01-01',
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: 'system',
};

const mockV2: LendingArrangement = { ...mockArrangement, version: 2, nominalRate: 0.20 };

describe('LendingArrangementStore', () => {
  let store: InstanceType<typeof LendingArrangementStore>;
  let svc: LendingArrangementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        LendingArrangementStore,
      ],
    });
    store = TestBed.inject(LendingArrangementStore);
    svc = TestBed.inject(LendingArrangementService);
    TestBed.inject(HttpTestingController);
  });

  it('starts with empty state', () => {
    expect(store.currentArrangement()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.versions()).toEqual([]);
  });

  it('loadArrangement: sets currentArrangement on success', async () => {
    vi.spyOn(svc, 'getById').mockReturnValue(of(mockArrangement));

    store.loadArrangement(ARRANGEMENT_ID);
    await Promise.resolve();

    expect(store.currentArrangement()).toEqual(mockArrangement);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('loadArrangement: sets error on failure', async () => {
    vi.spyOn(svc, 'getById').mockReturnValue(throwError(() => ({ message: 'Network error' })));

    store.loadArrangement(ARRANGEMENT_ID);
    await Promise.resolve();

    expect(store.currentArrangement()).toBeNull();
    expect(store.error()).toBe('Network error');
    expect(store.loading()).toBe(false);
  });

  it('hasAmendments is true when versions.length > 1', async () => {
    vi.spyOn(svc, 'getVersions').mockReturnValue(of([mockArrangement, mockV2]));

    store.loadVersions(ARRANGEMENT_ID);
    await Promise.resolve();

    expect(store.hasAmendments()).toBe(true);
  });

  it('hasAmendments is false when only one version', async () => {
    vi.spyOn(svc, 'getVersions').mockReturnValue(of([mockArrangement]));

    store.loadVersions(ARRANGEMENT_ID);
    await Promise.resolve();

    expect(store.hasAmendments()).toBe(false);
  });

  it('isActive is true when status === Active', async () => {
    vi.spyOn(svc, 'getById').mockReturnValue(of(mockArrangement));

    store.loadArrangement(ARRANGEMENT_ID);
    await Promise.resolve();

    expect(store.isActive()).toBe(true);
  });

  it('activate updates currentArrangement', async () => {
    const activated = { ...mockArrangement, status: LendingStatus.Active };
    vi.spyOn(svc, 'getById').mockReturnValue(of(mockArrangement));
    vi.spyOn(svc, 'activate').mockReturnValue(of(activated));

    store.loadArrangement(ARRANGEMENT_ID);
    await Promise.resolve();

    store.activate();
    await Promise.resolve();

    expect(store.currentArrangement()?.status).toBe(LendingStatus.Active);
  });

  it('reset clears all state', async () => {
    vi.spyOn(svc, 'getById').mockReturnValue(of(mockArrangement));
    store.loadArrangement(ARRANGEMENT_ID);
    await Promise.resolve();

    store.reset();

    expect(store.currentArrangement()).toBeNull();
    expect(store.versions()).toEqual([]);
    expect(store.error()).toBeNull();
  });
});
