import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';

import {
  PAYROLL_PROVIDER_CONTEXT,
  PayrollProviderContext,
  payrollProviderGuard,
} from './payroll-provider.guard';

describe('payrollProviderGuard', () => {
  function configure(context: PayrollProviderContext | null): Router {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        ...(context ? [{ provide: PAYROLL_PROVIDER_CONTEXT, useValue: context }] : []),
      ],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    return router;
  }

  it('allows navigation when no context provider is registered', () => {
    configure(null);

    const result = TestBed.runInInjectionContext(() => payrollProviderGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('allows a payroll provider', async () => {
    configure({
      load: () => of(null),
      isPayrollProvider: () => true,
    });

    const result = TestBed.runInInjectionContext(() => payrollProviderGuard({} as never, {} as never));

    await expect(firstValueFrom(result as ReturnType<PayrollProviderContext['load']>)).resolves.toBe(true);
  });

  it('redirects a non-provider enterprise to dashboard', async () => {
    const router = configure({
      load: () => of(null),
      isPayrollProvider: () => false,
    });

    const result = TestBed.runInInjectionContext(() => payrollProviderGuard({} as never, {} as never));

    await expect(firstValueFrom(result as ReturnType<PayrollProviderContext['load']>)).resolves.toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/app/dashboard']);
  });

  it('allows navigation while provider state is unknown', async () => {
    configure({
      load: () => of(null),
      isPayrollProvider: () => null,
    });

    const result = TestBed.runInInjectionContext(() => payrollProviderGuard({} as never, {} as never));

    await expect(firstValueFrom(result as ReturnType<PayrollProviderContext['load']>)).resolves.toBe(true);
  });

  it('allows navigation when loading context fails', async () => {
    configure({
      load: () => throwError(() => new Error('summary unavailable')),
      isPayrollProvider: () => false,
    });

    const result = TestBed.runInInjectionContext(() => payrollProviderGuard({} as never, {} as never));

    await expect(firstValueFrom(result as ReturnType<PayrollProviderContext['load']>)).resolves.toBe(true);
  });
});
