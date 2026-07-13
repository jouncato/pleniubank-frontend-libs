import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import { coreAdminV1Base } from './core-api-base';

export interface JurisdictionProfileSummaryDto {
  iso3166_2: string;
  country_name: string;
  currency: string;
  draft: boolean;
  verified_at: string | null;
  is_active: boolean;
}

export interface JurisdictionProfileDetailDto extends JurisdictionProfileSummaryDto {
  id: string;
  usury_ceiling_apr: string | null;
  payroll_max_pct: string | null;
  ltv_max: string | null;
  cession_tax_pct: string | null;
  day_count_convention: string;
  legal_clauses_ref: Record<string, unknown>;
  regulatory_codes: Record<string, unknown>;
  tax_matrix: Record<string, unknown>;
  bureau_reporting_template: string | null;
  e_invoice_validator: string | null;
  verified_by: string | null;
  schema_version: number;
  created_at: string;
  updated_at: string;
}

export interface JurisdictionProfileListResponseDto {
  items: JurisdictionProfileSummaryDto[];
  total: number;
  verified_count: number;
}

export interface JurisdictionProfileCreateDto {
  iso3166_2: string;
  country_name: string;
  currency: string;
  usury_ceiling_apr?: string | null;
  payroll_max_pct?: string | null;
  ltv_max?: string | null;
  cession_tax_pct?: string | null;
  day_count_convention?: string;
}

export interface JurisdictionProfileUpdateDto {
  country_name?: string;
  currency?: string;
  usury_ceiling_apr?: string | null;
  payroll_max_pct?: string | null;
  ltv_max?: string | null;
  cession_tax_pct?: string | null;
  day_count_convention?: string;
  legal_clauses_ref?: Record<string, unknown>;
  regulatory_codes?: Record<string, unknown>;
  tax_matrix?: Record<string, unknown>;
  bureau_reporting_template?: string | null;
  e_invoice_validator?: string | null;
  verified?: boolean;
}

export interface JurisdictionProfileVerifyDto {
  verified_by: string;
  notes?: string;
}

export interface CompanyJurisdictionOverrideSetDto {
  usury_ceiling_apr?: string | null;
  payroll_max_pct?: string | null;
  ltv_max?: string | null;
  cession_tax_pct?: string | null;
}

export interface EffectiveJurisdictionProfileDto {
  iso3166_2: string;
  country_name: string;
  currency: string;
  company_code: string | null;
  usury_ceiling_apr: string | null;
  payroll_max_pct: string | null;
  ltv_max: string | null;
  cession_tax_pct: string | null;
  is_active: boolean;
  country_is_active: boolean;
  company_is_active: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class CoreJurisdictionsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/jurisdictions`;
  }

  list(onlyVerified = false): Observable<ApiEnvelope<JurisdictionProfileListResponseDto>> {
    return this.http.get<ApiEnvelope<JurisdictionProfileListResponseDto>>(this.base, {
      params: { only_verified: String(onlyVerified) },
    });
  }

  get(iso: string): Observable<ApiEnvelope<JurisdictionProfileDetailDto>> {
    return this.http.get<ApiEnvelope<JurisdictionProfileDetailDto>>(`${this.base}/${iso}`);
  }

  create(dto: JurisdictionProfileCreateDto): Observable<ApiEnvelope<JurisdictionProfileDetailDto>> {
    return this.http.post<ApiEnvelope<JurisdictionProfileDetailDto>>(this.base, dto);
  }

  update(iso: string, dto: JurisdictionProfileUpdateDto): Observable<ApiEnvelope<JurisdictionProfileDetailDto>> {
    return this.http.patch<ApiEnvelope<JurisdictionProfileDetailDto>>(`${this.base}/${iso}`, dto);
  }

  verify(iso: string, dto: JurisdictionProfileVerifyDto): Observable<ApiEnvelope<JurisdictionProfileDetailDto>> {
    return this.http.post<ApiEnvelope<JurisdictionProfileDetailDto>>(`${this.base}/${iso}/verify`, dto);
  }

  activate(iso: string): Observable<ApiEnvelope<JurisdictionProfileDetailDto>> {
    return this.http.post<ApiEnvelope<JurisdictionProfileDetailDto>>(`${this.base}/${iso}/activate`, {});
  }

  deactivate(iso: string): Observable<ApiEnvelope<JurisdictionProfileDetailDto>> {
    return this.http.post<ApiEnvelope<JurisdictionProfileDetailDto>>(`${this.base}/${iso}/deactivate`, {});
  }

  setCompanyOverride(
    iso: string,
    companyCode: string,
    dto: CompanyJurisdictionOverrideSetDto,
  ): Observable<ApiEnvelope<EffectiveJurisdictionProfileDto>> {
    return this.http.post<ApiEnvelope<EffectiveJurisdictionProfileDto>>(
      `${this.base}/${iso}/companies/${companyCode}/override`,
      dto,
    );
  }

  getCompanyEffective(iso: string, companyCode: string): Observable<ApiEnvelope<EffectiveJurisdictionProfileDto>> {
    return this.http.get<ApiEnvelope<EffectiveJurisdictionProfileDto>>(
      `${this.base}/${iso}/companies/${companyCode}/effective`,
    );
  }

  activateCompany(iso: string, companyCode: string): Observable<ApiEnvelope<EffectiveJurisdictionProfileDto>> {
    return this.http.post<ApiEnvelope<EffectiveJurisdictionProfileDto>>(
      `${this.base}/${iso}/companies/${companyCode}/activate`,
      {},
    );
  }

  deactivateCompany(iso: string, companyCode: string): Observable<ApiEnvelope<EffectiveJurisdictionProfileDto>> {
    return this.http.post<ApiEnvelope<EffectiveJurisdictionProfileDto>>(
      `${this.base}/${iso}/companies/${companyCode}/deactivate`,
      {},
    );
  }
}
