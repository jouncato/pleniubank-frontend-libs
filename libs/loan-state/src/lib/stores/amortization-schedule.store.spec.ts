import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AmortizationScheduleService } from '@pleniu/loan-data-access';
import { AmortizationLineStatus, AmortizationType } from '@pleniu/loan-domain';
import type { AmortizationSchedule } from '@pleniu/loan-domain';
import { AmortizationScheduleStore } from './amortization-schedule.store';
import { LOAN_API_BASE_URL } from '@pleniu/loan-data-access';

const mockScheduleItem: AmortizationSchedule = {
  id: 'SCHED-001',
  version: 1,
  isActive: true,
  validFrom: '2025-01-01',
  generatedForVersion: 1,
  amortizationType: AmortizationType.French,
  numCuota: 1,
  fechaVencimiento: '2025-02-01',
  capital: '100000.00',
  interes: '1500.00',
  lateFee: '0.00',
  saldoInsoluto: '900000.00',
  status: AmortizationLineStatus.Pending,
  paidCapital: '0.00',
  paidInterest: '0.00',
  paidLateFee: '0.00',
  paidTotal: '0.00',
  createdAt: '2025-01-01T00:00:00Z',
  createdBy: 'system',
};

describe('AmortizationScheduleStore', () => {
  let store: InstanceType<typeof AmortizationScheduleStore>;
  let svc: AmortizationScheduleService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AmortizationScheduleStore,
        { provide: LOAN_API_BASE_URL, useValue: 'http://localhost' },
        {
          provide: AmortizationScheduleService,
          useValue: {
            get: vi.fn(),
            generate: vi.fn(),
          },
        },
      ],
    });
    store = TestBed.inject(AmortizationScheduleStore);
    svc = TestBed.inject(AmortizationScheduleService);
  });

  it('starts with empty state', () => {
    expect(store.schedule()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.arrangementId()).toBeNull();
  });

  it('loadSchedule: sets arrangementId and schedule on success', async () => {
    vi.spyOn(svc, 'get').mockReturnValue(of([mockScheduleItem]));

    store.loadSchedule('ARR-001');
    await Promise.resolve();

    expect(store.arrangementId()).toBe('ARR-001');
    expect(store.schedule()).toEqual([mockScheduleItem]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('loadSchedule: sets error on failure', async () => {
    vi.spyOn(svc, 'get').mockReturnValue(throwError(() => ({ message: 'Load failed' })));

    store.loadSchedule('ARR-001');
    await Promise.resolve();

    expect(store.schedule()).toEqual([]);
    expect(store.error()).toBe('Load failed');
    expect(store.loading()).toBe(false);
  });

  it('loadSchedule: uses fallback error message when message is missing', async () => {
    vi.spyOn(svc, 'get').mockReturnValue(throwError(() => ({})));

    store.loadSchedule('ARR-001');
    await Promise.resolve();

    expect(store.error()).toBe('Unknown error');
  });

  it('reset: clears all state', async () => {
    vi.spyOn(svc, 'get').mockReturnValue(of([mockScheduleItem]));

    store.loadSchedule('ARR-001');
    await Promise.resolve();

    store.reset();

    expect(store.schedule()).toEqual([]);
    expect(store.arrangementId()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('generateSchedule: loads schedule after generate succeeds', async () => {
    vi.spyOn(svc, 'generate').mockReturnValue(of([mockScheduleItem]));
    vi.spyOn(svc, 'get').mockReturnValue(of([mockScheduleItem]));

    store.generateSchedule('ARR-001', 'FRENCH');
    await Promise.resolve();
    await Promise.resolve();

    expect(svc.generate).toHaveBeenCalledWith('ARR-001', { amortization_type: 'FRENCH' });
    expect(svc.get).toHaveBeenCalledWith('ARR-001');
    expect(store.schedule()).toEqual([mockScheduleItem]);
    expect(store.loading()).toBe(false);
  });

  it('generateSchedule: uses FRENCH as default amortization type', async () => {
    vi.spyOn(svc, 'generate').mockReturnValue(of([]));
    vi.spyOn(svc, 'get').mockReturnValue(of([]));

    store.generateSchedule('ARR-001');
    await Promise.resolve();
    await Promise.resolve();

    expect(svc.generate).toHaveBeenCalledWith('ARR-001', { amortization_type: 'FRENCH' });
  });

  it('generateSchedule: sets error when generate fails', async () => {
    vi.spyOn(svc, 'generate').mockReturnValue(throwError(() => ({ message: 'Generate failed' })));

    store.generateSchedule('ARR-001');
    await Promise.resolve();

    expect(store.error()).toBe('Generate failed');
    expect(store.loading()).toBe(false);
  });

  it('generateSchedule: sets error when get after generate fails', async () => {
    vi.spyOn(svc, 'generate').mockReturnValue(of([]));
    vi.spyOn(svc, 'get').mockReturnValue(throwError(() => ({ message: 'Fetch failed' })));

    store.generateSchedule('ARR-001');
    await Promise.resolve();
    await Promise.resolve();

    expect(store.error()).toBe('Fetch failed');
    expect(store.loading()).toBe(false);
  });
});
