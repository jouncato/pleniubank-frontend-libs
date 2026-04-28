import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { ContractFee } from '@pleniu/loan-domain';
import type {
  AddFeeRequest,
  ContractFeeResponse,
  UpdateFeeRequest,
} from '../dtos/contract-fee.dto';
import { contractFeeToDomain } from '../mappers/contract-fee.mapper';
import { LOAN_API_BASE_URL } from '../tokens';

@Injectable({ providedIn: 'root' })
export class LendingFeeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(LOAN_API_BASE_URL);

  list(arrangementId: string): Observable<ContractFee[]> {
    return this.http
      .get<{ items: ContractFeeResponse[] }>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/fees`,
      )
      .pipe(map((res) => res.items.map(contractFeeToDomain)));
  }

  add(arrangementId: string, payload: AddFeeRequest): Observable<ContractFee> {
    return this.http
      .post<ContractFeeResponse>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/fees`,
        payload,
      )
      .pipe(map(contractFeeToDomain));
  }

  update(
    arrangementId: string,
    feeId: string,
    payload: UpdateFeeRequest,
  ): Observable<ContractFee> {
    return this.http
      .patch<ContractFeeResponse>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/fees/${feeId}`,
        payload,
      )
      .pipe(map(contractFeeToDomain));
  }

  retire(arrangementId: string, feeId: string): Observable<ContractFee> {
    return this.http
      .delete<ContractFeeResponse>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/fees/${feeId}`,
      )
      .pipe(map(contractFeeToDomain));
  }
}
