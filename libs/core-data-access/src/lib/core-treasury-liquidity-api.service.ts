import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import { coreAdminV1Base } from './core-api-base';

export type CustodyPurpose = 'DISBURSEMENT' | 'COLLECTION' | 'SETTLEMENT' | 'RESERVE';
export type PartyBankAccountKind = 'FBO' | 'TRUST' | 'ESCROW';
export type SubLedgerKind = 'USER_WALLET' | 'SERVICE_POOL';

export interface LegalEntityDto {
  id: string;
  name: string;
  tax_id: string;
  country_code: string;
  currencies: string[];
  status: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
}

export interface LegalEntityListPayload {
  items: LegalEntityDto[];
  total: number;
}

export interface PartyBankAccountDto {
  id: string;
  legal_entity_id: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_kind: PartyBankAccountKind;
  currency: string;
  purpose: CustodyPurpose;
  status: string;
  is_active: boolean;
  opened_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string | null;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface PartyBankAccountListPayload {
  items: PartyBankAccountDto[];
  total: number;
}

export interface PartyBankAccountCreateRequest {
  legal_entity_id: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_kind: PartyBankAccountKind;
  currency: string;
  purpose: CustodyPurpose;
  opened_at?: string | null;
}

export interface PartyBankAccountUpdateStatusRequest {
  is_active: boolean;
}

export interface MasterCustodyAccountDto {
  id: string;
  account_id: string;
  name: string;
  purpose: CustodyPurpose;
  denomination: string;
  is_active: boolean;
  extra_metadata: Record<string, unknown> | null;
  country_code: string | null;
  legal_entity_id: string | null;
  party_bank_account_id: string | null;
  created_at: string | null;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface MasterCustodyAccountListPayload {
  items: MasterCustodyAccountDto[];
  total: number;
}

export interface MasterCustodyAccountCreateRequest {
  account_id: string;
  name: string;
  purpose: CustodyPurpose;
  legal_entity_id: string;
  party_bank_account_id: string;
  denomination: string;
  extra_metadata?: Record<string, unknown>;
}

export interface MasterCustodyAccountUpdateRequest {
  name?: string;
  purpose?: CustodyPurpose;
  denomination?: string;
  extra_metadata?: Record<string, unknown> | null;
  is_active?: boolean;
}

export interface CustodyPositionDto {
  custody_master_id: string;
  denomination: string;
  contable: string;
  disponible: string;
  conciliado: string | null;
  as_of: string;
}

export interface SubLedgerAssignmentDto {
  id: string;
  account_id: string;
  custody_master_id: string;
  ledger_kind: SubLedgerKind;
  pool_name: string | null;
  is_active: boolean;
  created_at: string | null;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface SubLedgerAssignmentListPayload {
  items: SubLedgerAssignmentDto[];
  total: number;
}

export interface SubLedgerAssignmentCreateRequest {
  account_id: string;
  custody_master_id: string;
  ledger_kind: SubLedgerKind;
  pool_name?: string | null;
}

export interface SubLedgerBalanceDto {
  custody_master_id: string;
  denomination: string;
  total_committed: string;
}

@Injectable({ providedIn: 'root' })
export class CoreTreasuryLiquidityApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = coreAdminV1Base(apiConfig);
  }

  listLegalEntities(countryCode?: string, onlyActive = true): Observable<ApiEnvelope<LegalEntityListPayload>> {
    let hp = new HttpParams().set('only_active', String(onlyActive));
    if (countryCode) {
      hp = hp.set('country_code', countryCode);
    }
    return this.http.get<ApiEnvelope<LegalEntityListPayload>>(`${this.base}/legal-entities`, { params: hp });
  }

  listPartyBankAccounts(params: {
    legal_entity_id?: string;
    purpose?: CustodyPurpose;
    limit?: number;
    offset?: number;
  } = {}): Observable<ApiEnvelope<PartyBankAccountListPayload>> {
    let hp = new HttpParams();
    if (params.legal_entity_id) {
      hp = hp.set('legal_entity_id', params.legal_entity_id);
    }
    if (params.purpose) {
      hp = hp.set('purpose', params.purpose);
    }
    if (params.limit != null) {
      hp = hp.set('limit', String(params.limit));
    }
    if (params.offset != null) {
      hp = hp.set('offset', String(params.offset));
    }
    return this.http.get<ApiEnvelope<PartyBankAccountListPayload>>(`${this.base}/party-bank-accounts`, { params: hp });
  }

  createPartyBankAccount(payload: PartyBankAccountCreateRequest): Observable<ApiEnvelope<PartyBankAccountDto>> {
    return this.http.post<ApiEnvelope<PartyBankAccountDto>>(`${this.base}/party-bank-accounts`, payload);
  }

  verifyPartyBankAccount(partyBankAccountId: string): Observable<ApiEnvelope<PartyBankAccountDto>> {
    return this.http.post<ApiEnvelope<PartyBankAccountDto>>(
      `${this.base}/party-bank-accounts/${partyBankAccountId}/verify`,
      {},
    );
  }

  updatePartyBankAccountStatus(
    partyBankAccountId: string,
    payload: PartyBankAccountUpdateStatusRequest,
  ): Observable<ApiEnvelope<PartyBankAccountDto>> {
    return this.http.patch<ApiEnvelope<PartyBankAccountDto>>(
      `${this.base}/party-bank-accounts/${partyBankAccountId}`,
      payload,
    );
  }

  listMasterCustodyAccounts(params: {
    purpose?: CustodyPurpose;
    limit?: number;
    offset?: number;
  } = {}): Observable<ApiEnvelope<MasterCustodyAccountListPayload>> {
    let hp = new HttpParams();
    if (params.purpose) {
      hp = hp.set('purpose', params.purpose);
    }
    if (params.limit != null) {
      hp = hp.set('limit', String(params.limit));
    }
    if (params.offset != null) {
      hp = hp.set('offset', String(params.offset));
    }
    return this.http.get<ApiEnvelope<MasterCustodyAccountListPayload>>(`${this.base}/master-custody-accounts`, { params: hp });
  }

  createMasterCustodyAccount(payload: MasterCustodyAccountCreateRequest): Observable<ApiEnvelope<MasterCustodyAccountDto>> {
    return this.http.post<ApiEnvelope<MasterCustodyAccountDto>>(`${this.base}/master-custody-accounts`, payload);
  }

  updateMasterCustodyAccount(
    custodyId: string,
    payload: MasterCustodyAccountUpdateRequest,
  ): Observable<ApiEnvelope<MasterCustodyAccountDto>> {
    return this.http.patch<ApiEnvelope<MasterCustodyAccountDto>>(`${this.base}/master-custody-accounts/${custodyId}`, payload);
  }

  getCustodyPosition(custodyId: string, denomination = 'COP'): Observable<ApiEnvelope<CustodyPositionDto>> {
    const hp = new HttpParams().set('denomination', denomination);
    return this.http.get<ApiEnvelope<CustodyPositionDto>>(`${this.base}/master-custody-accounts/${custodyId}/positions`, { params: hp });
  }

  listSubLedgers(custodyMasterId: string): Observable<ApiEnvelope<SubLedgerAssignmentListPayload>> {
    const hp = new HttpParams().set('custody_master_id', custodyMasterId);
    return this.http.get<ApiEnvelope<SubLedgerAssignmentListPayload>>(`${this.base}/sub-ledgers`, { params: hp });
  }

  createSubLedgerAssignment(payload: SubLedgerAssignmentCreateRequest): Observable<ApiEnvelope<SubLedgerAssignmentDto>> {
    return this.http.post<ApiEnvelope<SubLedgerAssignmentDto>>(`${this.base}/sub-ledgers`, payload);
  }

  getSubLedgersBalance(custodyMasterId: string, denomination = 'COP'): Observable<ApiEnvelope<SubLedgerBalanceDto>> {
    const hp = new HttpParams()
      .set('custody_master_id', custodyMasterId)
      .set('denomination', denomination);
    return this.http.get<ApiEnvelope<SubLedgerBalanceDto>>(`${this.base}/sub-ledgers/balance`, { params: hp });
  }

  deactivateSubLedger(assignmentId: string): Observable<ApiEnvelope<SubLedgerAssignmentDto>> {
    return this.http.delete<ApiEnvelope<SubLedgerAssignmentDto>>(`${this.base}/sub-ledgers/${assignmentId}`);
  }
}

