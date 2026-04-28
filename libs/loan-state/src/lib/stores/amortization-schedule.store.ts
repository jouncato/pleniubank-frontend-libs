import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { AmortizationScheduleService } from '@pleniu/loan-data-access';
import type { AmortizationSchedule } from '@pleniu/loan-domain';

interface AmortizationScheduleState {
  arrangementId: string | null;
  schedule: AmortizationSchedule[];
  loading: boolean;
  error: string | null;
}

const initialState: AmortizationScheduleState = {
  arrangementId: null,
  schedule: [],
  loading: false,
  error: null,
};

export const AmortizationScheduleStore = signalStore(
  withState(initialState),
  withMethods((store) => {
    const svc = inject(AmortizationScheduleService);

    return {
      loadSchedule: rxMethod<string>(
        pipe(
          tap((id) => patchState(store, { loading: true, error: null, arrangementId: id })),
          switchMap((id) =>
            svc.get(id).pipe(
              tap((schedule: AmortizationSchedule[]) =>
                patchState(store, { schedule, loading: false }),
              ),
              catchError((err: { message?: string }) => {
                patchState(store, { error: err.message ?? 'Unknown error', loading: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      generateSchedule(
        arrangementId: string,
        amortizationType: string = 'FRENCH',
      ): void {
        patchState(store, { loading: true, error: null });
        svc.generate(arrangementId, { amortization_type: amortizationType }).subscribe({
          next: () => {
            svc.get(arrangementId).subscribe({
              next: (schedule: AmortizationSchedule[]) =>
                patchState(store, { schedule, loading: false }),
              error: (e: { message?: string }) =>
                patchState(store, { error: e.message ?? 'Unknown error', loading: false }),
            });
          },
          error: (e: { message?: string }) =>
            patchState(store, { error: e.message ?? 'Unknown error', loading: false }),
        });
      },

      reset(): void {
        patchState(store, initialState);
      },
    };
  }),
);
