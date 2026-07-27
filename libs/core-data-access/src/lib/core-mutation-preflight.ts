import { Injectable, inject } from '@angular/core';
import { defer, Observable, throwError } from 'rxjs';
import { FeatureFlagService, type AppFeatureFlags } from '@pleniu/shared-auth';

export type CoreMutationPreflightCode = 'FEATURE_DISABLED' | 'UNSAFE_COMBINATION';

export interface CoreMutationPreflightFailure {
  readonly operation: string;
  readonly requiredFlag?: keyof AppFeatureFlags;
}

export class CoreMutationPreflightError extends Error {
  override readonly name = 'CoreMutationPreflightError';

  constructor(
    public readonly code: CoreMutationPreflightCode,
    public readonly failure: CoreMutationPreflightFailure,
  ) {
    super(code === 'FEATURE_DISABLED' ? 'La operación no está habilitada.' : 'La combinación de datos no es compatible.');
  }
}

export interface CoreMutationPreflightRule<TContext> {
  readonly operation: string;
  readonly requiredFlag?: keyof AppFeatureFlags;
  readonly unsafeWhen?: (context: TContext) => boolean;
}

@Injectable({ providedIn: 'root' })
export class CoreMutationPreflightService {
  private readonly featureFlags = inject(FeatureFlagService);

  assertAllowed<TContext>(rule: CoreMutationPreflightRule<TContext>, context: TContext): void {
    if (rule.requiredFlag && !this.featureFlags.isEnabled(rule.requiredFlag)) {
      throw new CoreMutationPreflightError('FEATURE_DISABLED', {
        operation: rule.operation,
        requiredFlag: rule.requiredFlag,
      });
    }

    if (rule.unsafeWhen?.(context)) {
      throw new CoreMutationPreflightError('UNSAFE_COMBINATION', {
        operation: rule.operation,
        requiredFlag: rule.requiredFlag,
      });
    }
  }

  run<TContext, TResult>(
    rule: CoreMutationPreflightRule<TContext>,
    context: TContext,
    requestFactory: () => Observable<TResult>,
  ): Observable<TResult> {
    return defer(() => {
      try {
        this.assertAllowed(rule, context);
        return requestFactory();
      } catch (error) {
        return throwError(() => error);
      }
    });
  }
}
