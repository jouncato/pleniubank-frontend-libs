import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, Observable, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { LendingArrangementService } from '@pleniu/loan-data-access';
import { LendingStatus } from '@pleniu/loan-domain';
import type { LendingArrangement } from '@pleniu/loan-domain';
import type { ApiHttpError } from '@pleniu/shared-http';

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

type StoreSlice = { currentArrangement: () => LendingArrangement | null };

function applyTransition(
  store: StoreSlice & Parameters<typeof patchState>[0],
  request$: Observable<LendingArrangement>,
): void {
  patchState(store, { loading: true, error: null });
  request$.subscribe({
    next: (updated) => patchState(store, { currentArrangement: updated, loading: false }),
    error: (e: ApiHttpError) =>
      patchState(store, { error: e.message ?? 'Error al aplicar la transición', loading: false }),
  });
}

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

    function currentId(): string | null {
      return store.currentArrangement()?.arrangementId ?? null;
    }

    return {
      loadArrangement: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((id) =>
            svc.getById(id).pipe(
              tap((arrangement: LendingArrangement) =>
                patchState(store, { currentArrangement: arrangement, loading: false }),
              ),
              catchError((err: ApiHttpError) => {
                patchState(store, { error: err.message ?? 'Error al cargar el préstamo', loading: false });
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
        const id = currentId();
        if (!id) return;
        applyTransition(store, svc.activate(id, reason));
      },

      close(reason?: string): void {
        const id = currentId();
        if (!id) return;
        applyTransition(store, svc.close(id, reason));
      },

      suspend(reason: string): void {
        const id = currentId();
        if (!id) return;
        applyTransition(store, svc.suspend(id, reason));
      },

      resume(): void {
        const id = currentId();
        if (!id) return;
        applyTransition(store, svc.resume(id));
      },

      markDefaulted(reason: string): void {
        const id = currentId();
        if (!id) return;
        applyTransition(store, svc.markDefaulted(id, reason));
      },

      writeOff(reason: string): void {
        const id = currentId();
        if (!id) return;
        applyTransition(store, svc.writeOff(id, reason));
      },

      reset(): void {
        patchState(store, initialState);
      },
    };
  }),
);
