import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { LendingArrangementService } from '@pleniu/loan-data-access';
import type { ApiHttpError } from '@pleniu/shared-http';
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
                catchError((err: ApiHttpError) => {
                  patchState(store, { error: err.message ?? 'Error al cargar los préstamos', loading: false });
                  return EMPTY;
                }),
              ),
          ),
        ),
      ),
    };
  }),
  withMethods((store) => ({
    setFilter(filters: LendingListFilters): void {
      patchState(store, { filters, page: 1 });
      store.load();
    },

    setPage(page: number): void {
      patchState(store, { page });
      store.load();
    },

    setPageSize(pageSize: number): void {
      patchState(store, { pageSize, page: 1 });
      store.load();
    },

    reset(): void {
      patchState(store, initialState);
    },
  })),
);

export type { LendingListFilters };
