import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { LendingArrangementService } from '@pleniu/loan-data-access';
import { LendingStatus } from '@pleniu/loan-domain';
import type { LendingArrangement } from '@pleniu/loan-domain';

interface LendingArrangementState {
  currentArrangement: LendingArrangement | null;
  versions: LendingArrangement[];
  loading: boolean;
  error: string | null;
}

const initialState: LendingArrangementState = {
  currentArrangement: null,
  versions: [],
  loading: false,
  error: null,
};

export const LendingArrangementStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ currentArrangement, versions }) => ({
    currentVersion: computed(() => currentArrangement()?.version ?? null),
    hasAmendments: computed(() => versions().length > 1),
    isActive: computed(() => currentArrangement()?.status === LendingStatus.Active),
    arrangementId: computed(() => currentArrangement()?.arrangementId ?? null),
  })),
  withMethods((store) => {
    const svc = inject(LendingArrangementService);

    return {
      loadArrangement: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((id) =>
            svc.getById(id).pipe(
              tap((arrangement: LendingArrangement) =>
                patchState(store, { currentArrangement: arrangement, loading: false }),
              ),
              catchError((err: { message?: string }) => {
                patchState(store, { error: err.message ?? 'Unknown error', loading: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      loadVersions: rxMethod<string>(
        pipe(
          switchMap((id) =>
            svc.getVersions(id).pipe(
              tap((vs: LendingArrangement[]) => patchState(store, { versions: vs })),
              catchError(() => EMPTY),
            ),
          ),
        ),
      ),

      activate(reason?: string): void {
        const current = store.currentArrangement();
        if (!current) return;
        patchState(store, { loading: true, error: null });
        svc.activate(current.arrangementId, reason).subscribe({
          next: (updated: LendingArrangement) =>
            patchState(store, { currentArrangement: updated, loading: false }),
          error: (e: { message?: string }) =>
            patchState(store, { error: e.message ?? 'Unknown error', loading: false }),
        });
      },

      close(reason?: string): void {
        const current = store.currentArrangement();
        if (!current) return;
        patchState(store, { loading: true, error: null });
        svc.close(current.arrangementId, reason).subscribe({
          next: (updated: LendingArrangement) =>
            patchState(store, { currentArrangement: updated, loading: false }),
          error: (e: { message?: string }) =>
            patchState(store, { error: e.message ?? 'Unknown error', loading: false }),
        });
      },

      suspend(reason: string): void {
        const current = store.currentArrangement();
        if (!current) return;
        patchState(store, { loading: true, error: null });
        svc.suspend(current.arrangementId, reason).subscribe({
          next: (updated: LendingArrangement) =>
            patchState(store, { currentArrangement: updated, loading: false }),
          error: (e: { message?: string }) =>
            patchState(store, { error: e.message ?? 'Unknown error', loading: false }),
        });
      },

      resume(): void {
        const current = store.currentArrangement();
        if (!current) return;
        patchState(store, { loading: true, error: null });
        svc.resume(current.arrangementId).subscribe({
          next: (updated: LendingArrangement) =>
            patchState(store, { currentArrangement: updated, loading: false }),
          error: (e: { message?: string }) =>
            patchState(store, { error: e.message ?? 'Unknown error', loading: false }),
        });
      },

      markDefaulted(reason: string): void {
        const current = store.currentArrangement();
        if (!current) return;
        patchState(store, { loading: true, error: null });
        svc.markDefaulted(current.arrangementId, reason).subscribe({
          next: (updated: LendingArrangement) =>
            patchState(store, { currentArrangement: updated, loading: false }),
          error: (e: { message?: string }) =>
            patchState(store, { error: e.message ?? 'Unknown error', loading: false }),
        });
      },

      writeOff(reason: string): void {
        const current = store.currentArrangement();
        if (!current) return;
        patchState(store, { loading: true, error: null });
        svc.writeOff(current.arrangementId, reason).subscribe({
          next: (updated: LendingArrangement) =>
            patchState(store, { currentArrangement: updated, loading: false }),
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
