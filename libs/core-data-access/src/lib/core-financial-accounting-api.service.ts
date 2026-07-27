import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import { coreAdminV1Base } from './core-api-base';
import { CoreMutationPreflightService } from './core-mutation-preflight';
import { encodePathSegment } from './core-path.util';

const FINANCIAL_ACCOUNTING_MUTATION = {
  operation: 'financial-accounting.mutation',
  requiredFlag: 'financialAccounting' as const,
};

export type CoaClass = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' | 'CONTINGENT' | 'ORDER';
export type JournalSide = 'DEBIT' | 'CREDIT';
export type AmountDriver = 'PRINCIPAL' | 'INTEREST' | 'FEE' | 'PROVISION' | 'TOTAL';
export type ProductType = 'COMMERCIAL' | 'CONSUMER' | 'MORTGAGE' | 'MICROCREDIT' | 'PAYROLL_ADVANCE' | 'ALL';

export interface ChartOfAccountDto {
  id: string;
  country_code: string;
  account_code: string;
  account_name: string;
  account_class: CoaClass;
  account_level: number;
  parent_account_code: string | null;
  is_movement_account: boolean;
  is_debit_balance: boolean;
  requires_third_party: boolean;
  requires_cost_center: boolean;
  is_tax_relevant: boolean;
  currency_constraint: string | null;
  sfc_code: string | null;
  cnbv_code: string | null;
  sbs_code: string | null;
  cosif_code: string | null;
  conau_code: string | null;
  ifrs_code: string | null;
  country_is_active: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  updated_by: string | null;
}

export interface JournalTemplateLineDto {
  account_code: string;
  side: JournalSide;
  amount_driver: AmountDriver;
}

export interface JournalTemplateDto {
  id: string;
  template_code: string;
  description: string;
  trigger_event: string;
  country_code: string;
  product_type: ProductType;
  lines: JournalTemplateLineDto[];
  is_active: boolean;
}

export interface TrialBalanceLineDto {
  account_code: string;
  account_name: string;
  account_class: CoaClass;
  is_debit_balance: boolean;
  parent_account_code: string | null;
}

export interface CoaListParams {
  country_code?: string;
  account_class?: CoaClass;
  parent?: string;
  leaf?: boolean;
  search?: string;
  offset?: number;
  limit?: number;
  include_inactive?: boolean;
}

export interface CoaCreateDto {
  account_code: string;
  account_name: string;
  account_class: CoaClass;
  account_level: number;
  parent_account_code?: string | null;
  is_movement_account?: boolean;
  is_debit_balance?: boolean;
  requires_third_party?: boolean;
  requires_cost_center?: boolean;
  is_tax_relevant?: boolean;
  currency_constraint?: string | null;
  sfc_code?: string | null;
  cnbv_code?: string | null;
  sbs_code?: string | null;
  cosif_code?: string | null;
  conau_code?: string | null;
  ifrs_code?: string | null;
}

export interface CoaUpdateDto {
  account_name?: string;
  is_movement_account?: boolean;
  requires_third_party?: boolean;
  requires_cost_center?: boolean;
  is_tax_relevant?: boolean;
  currency_constraint?: string | null;
  sfc_code?: string | null;
  cnbv_code?: string | null;
  sbs_code?: string | null;
  cosif_code?: string | null;
  conau_code?: string | null;
  ifrs_code?: string | null;
}

export interface CoaDeactivationImpact {
  can_deactivate: boolean;
  has_active_children: boolean;
  active_children_codes: string[];
  has_historical_postings: boolean;
  referenced_by_active_templates: boolean;
  template_codes: string[];
}

@Injectable({ providedIn: 'root' })
export class CoreFinancialAccountingApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
    private readonly preflight: CoreMutationPreflightService,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/chart-of-accounts`;
  }

  listJournalTemplates(countryCode?: string): Observable<ApiEnvelope<JournalTemplateDto[]>> {
    let hp = new HttpParams();
    if (countryCode) hp = hp.set('country_code', countryCode);
    return this.http.get<ApiEnvelope<JournalTemplateDto[]>>(
      `${this.base}/journal-templates`, { params: hp }
    );
  }

  list(params: CoaListParams = {}): Observable<ApiEnvelope<ChartOfAccountDto[]>> {
    let hp = new HttpParams();
    if (params.country_code) hp = hp.set('country_code', params.country_code);
    if (params.account_class) hp = hp.set('account_class', params.account_class);
    if (params.parent != null) hp = hp.set('parent', params.parent);
    if (params.leaf != null) hp = hp.set('leaf', String(params.leaf));
    if (params.search) hp = hp.set('search', params.search);
    if (params.offset != null) hp = hp.set('offset', String(params.offset));
    if (params.limit != null) hp = hp.set('limit', String(params.limit));
    if (params.include_inactive) hp = hp.set('include_inactive', 'true');
    return this.http.get<ApiEnvelope<ChartOfAccountDto[]>>(this.base, { params: hp });
  }

  get(countryCode: string, accountCode: string): Observable<ApiEnvelope<ChartOfAccountDto>> {
    return this.http.get<ApiEnvelope<ChartOfAccountDto>>(
      `${this.base}/${encodePathSegment(countryCode)}/${encodePathSegment(accountCode)}`
    );
  }

  getChildren(countryCode: string, accountCode: string): Observable<ApiEnvelope<ChartOfAccountDto[]>> {
    return this.http.get<ApiEnvelope<ChartOfAccountDto[]>>(
      `${this.base}/${encodePathSegment(countryCode)}/${encodePathSegment(accountCode)}/children`
    );
  }

  getTrialBalanceStructure(countryCode: string): Observable<ApiEnvelope<TrialBalanceLineDto[]>> {
    return this.http.get<ApiEnvelope<TrialBalanceLineDto[]>>(
      `${this.base}/${encodePathSegment(countryCode)}/trial-balance`
    );
  }

  getActiveCountries(): Observable<ApiEnvelope<string[]>> {
    return this.http.get<ApiEnvelope<string[]>>(`${this.base}/countries`);
  }

  create(countryCode: string, dto: CoaCreateDto): Observable<ApiEnvelope<ChartOfAccountDto>> {
    return this.runMutation({ countryCode, accountCode: dto.account_code }, () => this.http.post<ApiEnvelope<ChartOfAccountDto>>(
      `${this.base}/${encodePathSegment(countryCode)}`, dto
    ));
  }

  update(
    countryCode: string,
    accountCode: string,
    dto: CoaUpdateDto
  ): Observable<ApiEnvelope<ChartOfAccountDto>> {
    return this.runMutation({ countryCode, accountCode }, () => this.http.patch<ApiEnvelope<ChartOfAccountDto>>(
      `${this.base}/${encodePathSegment(countryCode)}/${encodePathSegment(accountCode)}`, dto
    ));
  }

  deactivate(
    countryCode: string,
    accountCode: string
  ): Observable<ApiEnvelope<ChartOfAccountDto>> {
    return this.runMutation({ countryCode, accountCode }, () => this.http.delete<ApiEnvelope<ChartOfAccountDto>>(
      `${this.base}/${encodePathSegment(countryCode)}/${encodePathSegment(accountCode)}`
    ));
  }

  getDeactivationImpact(
    countryCode: string,
    accountCode: string
  ): Observable<ApiEnvelope<CoaDeactivationImpact>> {
    return this.http.get<ApiEnvelope<CoaDeactivationImpact>>(
      `${this.base}/${encodePathSegment(countryCode)}/${encodePathSegment(accountCode)}/deactivation-impact`
    );
  }

  activate(
    countryCode: string,
    accountCode: string
  ): Observable<ApiEnvelope<ChartOfAccountDto>> {
    return this.runMutation({ countryCode, accountCode }, () => this.http.post<ApiEnvelope<ChartOfAccountDto>>(
      `${this.base}/${encodePathSegment(countryCode)}/${encodePathSegment(accountCode)}/activate`, {}
    ));
  }

  activateCountry(
    countryCode: string
  ): Observable<ApiEnvelope<{ country_code: string; accounts_activated: number }>> {
    return this.runMutation({ countryCode }, () => this.http.post<ApiEnvelope<{ country_code: string; accounts_activated: number }>>(
      `${this.base}/countries/${encodePathSegment(countryCode)}/activate`, {}
    ));
  }

  private runMutation<T>(context: unknown, requestFactory: () => Observable<T>): Observable<T> {
    return this.preflight.run(FINANCIAL_ACCOUNTING_MUTATION, context, requestFactory);
  }
}
