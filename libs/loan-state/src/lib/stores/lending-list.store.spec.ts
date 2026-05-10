import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LendingArrangementService, LOAN_API_BASE_URL } from '@pleniu/loan-data-access';
import { LendingStatus } from '@pleniu/loan-domain';
import type { LendingArrangement } from '@pleniu/loan-domain';
import { LendingListStore } from './lending-list.store';

const mockArrangement: LendingArrangement = {
  arrangementId: 'ARR-001',
  version: 1,
  status: LendingStatus.Active,
  productId: 'PROD-001',
  productType: 'PAYROLL_ADVANCE' as never,
  customerId: 'CUST-001',
  jurisdiction: 'CO',
  principal: { amount: '5000000', currency: 'COP' },
  currency: 'COP',
  rateType: 'FIXED' as never,
  dayCountConvention: 'ACT/360' as never,
  repaymentFrequency: 'MONTHLY' as never,
  effectiveDate: '2025-01-01',
  createdAt: '2025-01-01T00:00:00Z',
  createdBy: 'system',
};

const mockArrangement2: LendingArrangement = {
  ...mockArrangement,
  arrangementId: 'ARR-002',
  customerId: 'CUST-002',
};

describe('LendingListStore', () => {
  let store: InstanceType<typeof LendingListStore>;
  let svc: LendingArrangementService;

  function setupSvc(listResult: { items: LendingArrangement[]; total: number }) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        LendingListStore,
        { provide: LOAN_API_BASE_URL, useValue: 'http://localhost' },
        {
          provide: LendingArrangementService,
          useValue: {
            list: vi.fn().mockReturnValue(of(listResult)),
          },
        },
      ],
    });
    store = TestBed.inject(LendingListStore);
    svc = TestBed.inject(LendingArrangementService);
  }

  beforeEach(() => {
    setupSvc({ items: [mockArrangement, mockArrangement2], total: 2 });
  });

  it('starts with empty state', () => {
    expect(store.items()).toEqual([]);
    expect(store.total()).toBe(0);
    expect(store.page()).toBe(1);
    expect(store.pageSize()).toBe(20);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.filters()).toEqual({});
  });

  it('load: populates items and total on success', async () => {
    store.load();
    await Promise.resolve();
    await Promise.resolve();

    expect(store.items()).toEqual([mockArrangement, mockArrangement2]);
    expect(store.total()).toBe(2);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('load: sets error on failure', async () => {
    vi.spyOn(svc, 'list').mockReturnValue(throwError(() => ({ message: 'Network error' })));

    store.load();
    await Promise.resolve();
    await Promise.resolve();

    expect(store.items()).toEqual([]);
    expect(store.error()).toBe('Network error');
    expect(store.loading()).toBe(false);
  });

  it('load: uses fallback error message when message is missing', async () => {
    vi.spyOn(svc, 'list').mockReturnValue(throwError(() => ({})));

    store.load();
    await Promise.resolve();
    await Promise.resolve();

    expect(store.error()).toBe('Unknown error');
  });

  it('setFilter: updates filters, resets page to 1, and reloads', async () => {
    store.setFilter({ customerId: 'CUST-001' });
    await Promise.resolve();

    expect(store.filters()).toEqual({ customerId: 'CUST-001' });
    expect(store.page()).toBe(1);
    expect(svc.list).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'CUST-001', page: 1 }),
    );
  });

  it('setPage: updates page and reloads with correct page number', async () => {
    store.setPage(3);
    await Promise.resolve();

    expect(store.page()).toBe(3);
    expect(svc.list).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }));
  });

  it('setPageSize: updates pageSize, resets page to 1, and reloads', async () => {
    store.setPageSize(50);
    await Promise.resolve();

    expect(store.pageSize()).toBe(50);
    expect(store.page()).toBe(1);
    expect(svc.list).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 50, page: 1 }),
    );
  });

  it('setFilter: passes status filter to service', async () => {
    store.setFilter({ status: LendingStatus.Active });
    await Promise.resolve();

    expect(svc.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: LendingStatus.Active }),
    );
  });

  it('reset: clears all state back to initial', async () => {
    store.load();
    await Promise.resolve();
    await Promise.resolve();

    store.reset();

    expect(store.items()).toEqual([]);
    expect(store.total()).toBe(0);
    expect(store.page()).toBe(1);
    expect(store.pageSize()).toBe(20);
    expect(store.filters()).toEqual({});
    expect(store.error()).toBeNull();
    expect(store.loading()).toBe(false);
  });

  it('setFilter: error during reload sets error state', async () => {
    vi.spyOn(svc, 'list').mockReturnValue(throwError(() => ({ message: 'Filter error' })));

    store.setFilter({ customerId: 'CUST-X' });
    await Promise.resolve();

    expect(store.error()).toBe('Filter error');
    expect(store.loading()).toBe(false);
  });
});
