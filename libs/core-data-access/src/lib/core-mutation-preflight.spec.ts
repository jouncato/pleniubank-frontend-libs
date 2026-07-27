import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { APP_FEATURE_FLAGS, DEFAULT_APP_FEATURE_FLAGS, FeatureFlagService } from '@pleniu/shared-auth';

import {
  CoreMutationPreflightError,
  CoreMutationPreflightService,
  type CoreMutationPreflightRule,
} from './core-mutation-preflight';

describe('CoreMutationPreflightService', () => {
  let service: CoreMutationPreflightService;
  let flags: FeatureFlagService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_FEATURE_FLAGS, useValue: { ...DEFAULT_APP_FEATURE_FLAGS, financialAccounting: true } },
      ],
    });
    service = TestBed.inject(CoreMutationPreflightService);
    flags = TestBed.inject(FeatureFlagService);
  });

  it('allows enabled operations and executes the request factory', async () => {
    const rule: CoreMutationPreflightRule<{ amount: number }> = {
      operation: 'test.mutation',
      requiredFlag: 'financialAccounting',
    };
    const result = await new Promise<string>((resolve, reject) => {
      service.run(rule, { amount: 1 }, () => of('ok')).subscribe({ next: resolve, error: reject });
    });

    expect(result).toBe('ok');
  });

  it('returns a typed feature-disabled failure without executing the request factory', () => {
    flags.setFlags({ financialAccounting: false });
    let requestExecuted = false;
    let failure: unknown;

    service
      .run(
        { operation: 'test.mutation', requiredFlag: 'financialAccounting' },
        {},
        () => {
          requestExecuted = true;
          return of('unexpected');
        },
      )
      .subscribe({ error: (error) => (failure = error) });

    expect(requestExecuted).toBe(false);
    expect(failure).toBeInstanceOf(CoreMutationPreflightError);
    expect((failure as CoreMutationPreflightError).code).toBe('FEATURE_DISABLED');
    expect((failure as CoreMutationPreflightError).failure.operation).toBe('test.mutation');
  });

  it('returns an unsafe-combination failure before HTTP execution', () => {
    let requestExecuted = false;
    let failure: unknown;

    service
      .run(
        {
          operation: 'test.mutation',
          requiredFlag: 'financialAccounting',
          unsafeWhen: (context: { amount: number }) => context.amount <= 0,
        },
        { amount: 0 },
        () => {
          requestExecuted = true;
          return of('unexpected');
        },
      )
      .subscribe({ error: (error) => (failure = error) });

    expect(requestExecuted).toBe(false);
    expect(failure).toBeInstanceOf(CoreMutationPreflightError);
    expect((failure as CoreMutationPreflightError).code).toBe('UNSAFE_COMBINATION');
  });
});
