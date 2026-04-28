import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { Collateral } from '@pleniu/loan-domain';
import type {
  AddCollateralRequest,
  CollateralResponse,
  UpdateCollateralRequest,
} from '../dtos/collateral.dto';
import { collateralToDomain } from '../mappers/collateral.mapper';
import { LOAN_API_BASE_URL } from '../tokens';

@Injectable({ providedIn: 'root' })
export class LendingCollateralService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(LOAN_API_BASE_URL);

  list(arrangementId: string): Observable<Collateral[]> {
    return this.http
      .get<{ items: CollateralResponse[] }>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/collaterals`,
      )
      .pipe(map((res) => res.items.map(collateralToDomain)));
  }

  add(arrangementId: string, payload: AddCollateralRequest): Observable<Collateral> {
    return this.http
      .post<CollateralResponse>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/collaterals`,
        payload,
      )
      .pipe(map(collateralToDomain));
  }

  update(
    arrangementId: string,
    collateralId: string,
    payload: UpdateCollateralRequest,
  ): Observable<Collateral> {
    return this.http
      .patch<CollateralResponse>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/collaterals/${collateralId}`,
        payload,
      )
      .pipe(map(collateralToDomain));
  }

  retire(arrangementId: string, collateralId: string): Observable<Collateral> {
    return this.http
      .delete<CollateralResponse>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/collaterals/${collateralId}`,
      )
      .pipe(map(collateralToDomain));
  }
}
