import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import { coreAdminV1Base } from './core-api-base';
import { CoreMutationPreflightService } from './core-mutation-preflight';
import { encodePathSegment } from './core-path.util';

const TREASURY_LIQUIDITY_MUTATION = {
  operation: 'treasury-liquidity.mutation',
  requiredFlag: 'treasuryLiquidity' as const,
};

export type CustodyPurpose = 'DISBURSEMENT' | 'COLLECTION' | 'SETTLEMENT' | 'RESERVE' | 'TREASURY_EXTERNAL' | 'PAYROLL_ADVANCE_DISBURSEMENT';
export type FundingMode = 'AUTOMATIC' | 'MANUAL';
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
  funding_mode: FundingMode;
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
  funding_mode?: FundingMode;
}

export interface MasterCustodyAccountUpdateRequest {
  name?: string;
  purpose?: CustodyPurpose;
  denomination?: string;
  extra_metadata?: Record<string, unknown> | null;
  is_active?: boolean;
  funding_mode?: FundingMode;
}

export interface CustodyPositionDto {
  custody_master_id: string;
  denomination: string;
  contable: string;
  disponible: string;
  conciliado: string | null;
  as_of: string;
}

export interface TreasuryMovementRequestDto {
  amount: string;
  reference: string;
  country_code?: string;
}

export interface TreasuryMovementResponseDto {
  id: string;
  movement_type: 'FUNDING' | 'SWEEP';
  amount: string;
  reference: string;
  country_code: string;
  origin: 'MANUAL' | 'WEBHOOK';
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'POSTED' | 'REJECTED';
  journal_entry_id: string | null;
  bank_statement_line_id: string | null;
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

// AUDITORÍA Ola 14 — dashboard cruzado caja-vs-GL + vista por cuenta + alertas.

export interface TreasuryDashboardCustodyPositionDto {
  custody_master_id: string;
  name: string;
  purpose: string;
  denomination: string;
  contable: string;
  disponible: string;
  conciliado: string | null;
}

export interface TreasuryDashboardBreakDto {
  id: string;
  source_system: string;
  discrepancy_type: string;
  core_reference: string;
  external_reference: string;
  core_amount: string;
  external_amount: string;
  currency: string;
  created_at: string;
}

export interface TreasuryDashboardAlertDto {
  id: string;
  rule_code: string;
  rule_name: string;
  metric_value: string;
  threshold: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  triggered_at: string;
}

export interface TreasuryDashboardDto {
  custody_positions: TreasuryDashboardCustodyPositionDto[];
  open_reconciliation_breaks: TreasuryDashboardBreakDto[];
  open_alerts: TreasuryDashboardAlertDto[];
}

export interface CustodyMovementDto {
  posting_batch_id: string;
  booking_timestamp: string;
  amount: string;
  denomination: string;
  is_credit: boolean;
  journal_entry_id: string | null;
  has_gl_backing: boolean;
}

export interface CustodyAccountDetailDto {
  custody_master_id: string;
  denomination: string;
  contable: string;
  disponible: string;
  conciliado: string | null;
  movements: CustodyMovementDto[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface AlertRuleDto {
  id: string;
  code: string;
  name: string;
  metric: string;
  comparator: 'GT' | 'LT';
  threshold_amount: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  is_active: boolean;
  notify_channel: string | null;
  created_at: string;
}

export interface GlLedgerLineDto {
  entry_id: string;
  entry_date: string;
  trigger_event: string;
  source_event_id: string | null;
  description: string | null;
  side: 'DEBIT' | 'CREDIT';
  amount: string;
  amount_driver: string;
  running_balance: string;
}

export interface GlAccountLedgerPageDto {
  account_code: string;
  country_code: string;
  total_debit: string;
  total_credit: string;
  has_more: boolean;
  next_cursor: string | null;
  lines: GlLedgerLineDto[];
}

export interface GlTrialBalanceLineDto {
  account_code: string;
  account_class: string;
  total_debit: string;
  total_credit: string;
  closing_balance: string;
}

export interface GlTrialBalanceDto {
  period: string;
  country_code: string;
  total_debit: string;
  total_credit: string;
  is_balanced: boolean;
  accounts: GlTrialBalanceLineDto[];
}

export interface AccountingPeriodDto {
  period: string;
  status: 'OPEN' | 'CLOSED';
  total_debit: string;
  total_credit: string;
  entry_count: number;
  is_balanced: boolean;
  closed_at: string | null;
}

export interface TriggeredAlertDto {
  id: string;
  rule_id: string;
  rule_code: string;
  rule_name: string;
  triggered_at: string;
  metric_value: string;
  threshold: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'OPEN' | 'RESOLVED';
  related_reference: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
}

@Injectable({ providedIn: 'root' })
export class CoreTreasuryLiquidityApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
    private readonly preflight: CoreMutationPreflightService,
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
    return this.runMutation({ legalEntityId: payload.legal_entity_id }, () => this.http.post<ApiEnvelope<PartyBankAccountDto>>(`${this.base}/party-bank-accounts`, payload));
  }

  verifyPartyBankAccount(partyBankAccountId: string): Observable<ApiEnvelope<PartyBankAccountDto>> {
    return this.runMutation({ partyBankAccountId }, () => this.http.post<ApiEnvelope<PartyBankAccountDto>>(
      `${this.base}/party-bank-accounts/${encodePathSegment(partyBankAccountId)}/verify`,
      {},
    ));
  }

  updatePartyBankAccountStatus(
    partyBankAccountId: string,
    payload: PartyBankAccountUpdateStatusRequest,
  ): Observable<ApiEnvelope<PartyBankAccountDto>> {
    return this.runMutation({ partyBankAccountId }, () => this.http.patch<ApiEnvelope<PartyBankAccountDto>>(
      `${this.base}/party-bank-accounts/${encodePathSegment(partyBankAccountId)}`,
      payload,
    ));
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
    return this.runMutation({ accountId: payload.account_id }, () => this.http.post<ApiEnvelope<MasterCustodyAccountDto>>(`${this.base}/master-custody-accounts`, payload));
  }

  updateMasterCustodyAccount(
    custodyId: string,
    payload: MasterCustodyAccountUpdateRequest,
  ): Observable<ApiEnvelope<MasterCustodyAccountDto>> {
    return this.runMutation({ custodyId }, () => this.http.patch<ApiEnvelope<MasterCustodyAccountDto>>(
      `${this.base}/master-custody-accounts/${encodePathSegment(custodyId)}`, payload,
    ));
  }

  getCustodyPosition(custodyId: string, denomination = 'COP'): Observable<ApiEnvelope<CustodyPositionDto>> {
    const hp = new HttpParams().set('denomination', denomination);
    return this.http.get<ApiEnvelope<CustodyPositionDto>>(`${this.base}/master-custody-accounts/${encodePathSegment(custodyId)}/positions`, { params: hp });
  }

  listSubLedgers(custodyMasterId: string): Observable<ApiEnvelope<SubLedgerAssignmentListPayload>> {
    const hp = new HttpParams().set('custody_master_id', custodyMasterId);
    return this.http.get<ApiEnvelope<SubLedgerAssignmentListPayload>>(`${this.base}/sub-ledgers`, { params: hp });
  }

  createSubLedgerAssignment(payload: SubLedgerAssignmentCreateRequest): Observable<ApiEnvelope<SubLedgerAssignmentDto>> {
    return this.runMutation({
      accountId: payload.account_id,
      custodyMasterId: payload.custody_master_id,
      ledgerKind: payload.ledger_kind,
    }, () => this.http.post<ApiEnvelope<SubLedgerAssignmentDto>>(`${this.base}/sub-ledgers`, payload));
  }

  getSubLedgersBalance(custodyMasterId: string, denomination = 'COP'): Observable<ApiEnvelope<SubLedgerBalanceDto>> {
    const hp = new HttpParams()
      .set('custody_master_id', custodyMasterId)
      .set('denomination', denomination);
    return this.http.get<ApiEnvelope<SubLedgerBalanceDto>>(`${this.base}/sub-ledgers/balance`, { params: hp });
  }

  deactivateSubLedger(assignmentId: string): Observable<ApiEnvelope<SubLedgerAssignmentDto>> {
    return this.runMutation({ assignmentId }, () => this.http.delete<ApiEnvelope<SubLedgerAssignmentDto>>(
      `${this.base}/sub-ledgers/${encodePathSegment(assignmentId)}`,
    ));
  }

  // AUDITORÍA Ola 14 — dashboard cruzado caja-vs-GL, vista por cuenta, alertas.

  getTreasuryDashboard(): Observable<ApiEnvelope<TreasuryDashboardDto>> {
    return this.http.get<ApiEnvelope<TreasuryDashboardDto>>(`${this.base}/gl-reporting/treasury/dashboard`);
  }

  getCustodyAccountDetail(
    custodyId: string,
    params: { denomination?: string; cursor?: string; limit?: number } = {},
  ): Observable<ApiEnvelope<CustodyAccountDetailDto>> {
    let hp = new HttpParams().set('denomination', params.denomination ?? 'COP');
    if (params.cursor) {
      hp = hp.set('cursor', params.cursor);
    }
    if (params.limit != null) {
      hp = hp.set('limit', String(params.limit));
    }
    return this.http.get<ApiEnvelope<CustodyAccountDetailDto>>(
      `${this.base}/master-custody-accounts/${encodePathSegment(custodyId)}/detail`,
      { params: hp },
    );
  }

  exportCustodyAccountReportCsv(custodyId: string, denomination = 'COP'): Observable<Blob> {
    const hp = new HttpParams().set('denomination', denomination);
    return this.http.get(`${this.base}/master-custody-accounts/${encodePathSegment(custodyId)}/detail/export.csv`, {
      params: hp,
      responseType: 'blob',
    });
  }

  getAccountLedger(params: {
    accountCode: string;
    from: string;
    to: string;
    countryCode?: string;
    cursor?: string;
    limit?: number;
  }): Observable<ApiEnvelope<GlAccountLedgerPageDto>> {
    let hp = new HttpParams()
      .set('account_code', params.accountCode)
      .set('from', params.from)
      .set('to', params.to)
      .set('country', params.countryCode ?? 'CO');
    if (params.cursor) {
      hp = hp.set('cursor', params.cursor);
    }
    if (params.limit != null) {
      hp = hp.set('limit', String(params.limit));
    }
    return this.http.get<ApiEnvelope<GlAccountLedgerPageDto>>(`${this.base}/gl-reporting/ledger`, { params: hp });
  }

  getAlertRules(): Observable<ApiEnvelope<AlertRuleDto[]>> {
    return this.http.get<ApiEnvelope<AlertRuleDto[]>>(`${this.base}/treasury-alerts/rules`);
  }

  getTriggeredAlerts(params: { status?: 'OPEN' | 'RESOLVED'; severity?: string; limit?: number } = {}): Observable<ApiEnvelope<TriggeredAlertDto[]>> {
    let hp = new HttpParams();
    if (params.status) {
      hp = hp.set('status', params.status);
    }
    if (params.severity) {
      hp = hp.set('severity', params.severity);
    }
    if (params.limit != null) {
      hp = hp.set('limit', String(params.limit));
    }
    return this.http.get<ApiEnvelope<TriggeredAlertDto[]>>(`${this.base}/treasury-alerts`, { params: hp });
  }

  getGlTrialBalance(period: string, country = 'CO'): Observable<ApiEnvelope<GlTrialBalanceDto>> {
    const hp = new HttpParams().set('period', period).set('country', country);
    return this.http.get<ApiEnvelope<GlTrialBalanceDto>>(`${this.base}/gl-reporting/trial-balance`, { params: hp });
  }

  getAccountingPeriods(country = 'CO'): Observable<ApiEnvelope<AccountingPeriodDto[]>> {
    const hp = new HttpParams().set('country', country);
    return this.http.get<ApiEnvelope<AccountingPeriodDto[]>>(`${this.base}/gl-reporting/periods`, { params: hp });
  }

  // -- Treasury funding / sweep (operativo) --

  requestTreasuryFunding(payload: TreasuryMovementRequestDto): Observable<ApiEnvelope<TreasuryMovementResponseDto>> {
    return this.http.post<ApiEnvelope<TreasuryMovementResponseDto>>(
      `${this.base}/gl-reporting/treasury/funding`,
      payload,
    );
  }

  requestTreasurySweep(payload: TreasuryMovementRequestDto): Observable<ApiEnvelope<TreasuryMovementResponseDto>> {
    return this.http.post<ApiEnvelope<TreasuryMovementResponseDto>>(
      `${this.base}/gl-reporting/treasury/sweep`,
      payload,
    );
  }

  approveTreasuryMovement(movementId: string): Observable<ApiEnvelope<TreasuryMovementResponseDto>> {
    return this.http.post<ApiEnvelope<TreasuryMovementResponseDto>>(
      `${this.base}/gl-reporting/treasury/${encodePathSegment(movementId)}/approve`,
      {},
    );
  }

  requestLocalFunding(payload: TreasuryMovementRequestDto): Observable<ApiEnvelope<TreasuryMovementResponseDto>> {
    return this.http.post<ApiEnvelope<TreasuryMovementResponseDto>>(
      `${this.base}/gl-reporting/treasury/local-funding`,
      payload,
    );
  }

  requestLocalSweep(payload: TreasuryMovementRequestDto): Observable<ApiEnvelope<TreasuryMovementResponseDto>> {
    return this.http.post<ApiEnvelope<TreasuryMovementResponseDto>>(
      `${this.base}/gl-reporting/treasury/local-sweep`,
      payload,
    );
  }

  private runMutation<T>(context: unknown, requestFactory: () => Observable<T>): Observable<T> {
    return this.preflight.run(TREASURY_LIQUIDITY_MUTATION, context, requestFactory);
  }
}

