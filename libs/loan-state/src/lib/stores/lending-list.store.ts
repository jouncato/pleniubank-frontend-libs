import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { LendingArrangementService } from '@pleniu/loan-data-access';
import type { LendingArrangement, LendingStatus, ProductType } from '@pleniu/loan-domain';

interface LendingListFilters {
  customerId?: string;
  status?: LendingStatus;
  productType?: ProductType;
}

interface LendingListState {
  items: LendingArrangement[];
  total: number;
  page: number;
  pageSize: number;
  filters: LendingListFilters;
  loading: boolean;
  error: string | null;
}

const initialState: LendingListState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  filters: {},
  loading: false,
  error: null,
};

export const LendingListStore = signalStore(
  withState(initialState),
  withMethods((store) => {
    const svc = inject(LendingArrangementService);

    const loadFromState = (): void => {
      patchState(store, { loading: true, error: null });
      svc
        .list({
          ...store.filters(),
          page: store.page(),
          pageSize: store.pageSize(),
        })
        .pipe(
          catchError((err: { message?: string }) => {
            patchState(store, { error: err.message ?? 'Unknown error', loading: false });
            return EMPTY;
          }),
        )
        .subscribe((result: { items: LendingArrangement[]; total: number }) => {
          patchState(store, { items: result.items, total: result.total, loading: false });
        });
    };

    return {
      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            svc
              .list({
                ...store.filters(),
                page: store.page(),
                pageSize: store.pageSize(),
              })
              .pipe(
                tap((r: { items: LendingArrangement[]; total: number }) =>
                  patchState(store, { items: r.items, total: r.total, loading: false }),
                ),
                catchError((err: { message?: string }) => {
                  patchState(store, { error: err.message ?? 'Unknown error', loading: false });
                  return EMPTY;
                }),
              ),
          ),
        ),
      ),

      setFilter(filters: LendingListFilters): void {
        patchState(store, { filters, page: 1 });
        loadFromState();
      },

      setPage(page: number): void {
        patchState(store, { page });
        loadFromState();
      },

      setPageSize(pageSize: number): void {
        patchState(store, { pageSize, page: 1 });
        loadFromState();
      },

      reset(): void {
        patchState(store, initialState);
      },
    };
  }),
);

export type { LendingListFilters };
