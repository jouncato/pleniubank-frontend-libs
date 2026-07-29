import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

import type {
  ClientContractCreateRequest,
  ClientContractDto,
  ClientContractFromProposalRequest,
  ContractTemplateDto,
} from '@pleniu/core-domain';
import type { ClientContractPatchRequest, CompanyCodeOptionDto, EligibilitySummaryDto } from './core-types';

export interface BulkAssignContractRequest {
  sub_enterprise_id: string;
  template_contract_id: string;
  customer_ids: string[];
  terms?: Record<string, unknown>;
}

export interface BulkAssignContractResultEntry {
  customer_id: string;
  status: 'created' | 'skipped' | 'error';
  client_contract_id: string | null;
  reason: string | null;
}

export interface BulkAssignContractResponse {
  assigned: number;
  skipped: number;
  errors: number;
  entries: BulkAssignContractResultEntry[];
}

export interface ContractAuditEntryDto {
  id: string;
  action: string;
  changes: Record<string, unknown>;
  performed_by: string | null;
  performed_at: string;
}

export interface ListClientContractAuditParams {
  page?: number;
  page_size?: number;
}

export interface ListClientContractsParams {
  company_code: string;
  customer_id?: string | null;
  cursor?: string | null;
  limit?: number;
  include_terminated?: boolean;
  status?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CoreClientContractsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/client-contracts`;
  }

  list(params: ListClientContractsParams): Observable<ApiEnvelope<ClientContractDto[]>> {
    let hp = new HttpParams().set('company_code', params.company_code);
    if (params.customer_id) {
      hp = hp.set('customer_id', params.customer_id);
    }
    if (params.cursor) {
      hp = hp.set('cursor', params.cursor);
    }
    if (params.limit != null) {
      hp = hp.set('limit', String(params.limit));
    }
    if (params.include_terminated) {
      hp = hp.set('include_terminated', 'true');
    }
    if (params.status) {
      hp = hp.set('status', params.status);
    }
    return this.http.get<ApiEnvelope<ClientContractDto[]>>(this.base, { params: hp });
  }

  getById(contractId: string): Observable<ApiEnvelope<ClientContractDto>> {
    return this.http.get<ApiEnvelope<ClientContractDto>>(`${this.base}/${contractId}`);
  }

  listAllowedCompanyCodes(): Observable<ApiEnvelope<CompanyCodeOptionDto[]>> {
    return this.http.get<ApiEnvelope<CompanyCodeOptionDto[]>>(`${this.base}/company-codes`);
  }

  patch(contractId: string, body: ClientContractPatchRequest): Observable<ApiEnvelope<ClientContractDto>> {
    return this.http.patch<ApiEnvelope<ClientContractDto>>(`${this.base}/${contractId}`, body);
  }

  create(body: ClientContractCreateRequest): Observable<ApiEnvelope<ClientContractDto>> {
    return this.http.post<ApiEnvelope<ClientContractDto>>(this.base, body);
  }

  createFromProposal(body: ClientContractFromProposalRequest): Observable<ApiEnvelope<ClientContractDto>> {
    return this.http.post<ApiEnvelope<ClientContractDto>>(`${this.base}/from-proposal`, body);
  }

  /**
   * Lists contract templates (products) inherited by a business unit.
   * Core endpoint: GET /client-contracts/sub-enterprise/{id}/templates
   *
   * @deprecated Since v0.5.0. For BIAN lending products use `LendingArrangementService.getAll()`
   * from `@pleniu/loan-data-access` instead. This method is specific to the libranza/payroll
   * product model and will be removed on 2026-12-31.
   * See `docs/migration/libranza-to-lending-arrangement.md`.
   */
  listSubEnterpriseTemplates(
    subEnterpriseId: string,
  ): Observable<ApiEnvelope<ContractTemplateDto[]>> {
    return this.http.get<ApiEnvelope<ContractTemplateDto[]>>(
      `${this.base}/sub-enterprise/${encodeURIComponent(subEnterpriseId)}/templates`,
    );
  }

  /**
   * Lists client contracts already issued under a business unit.
   * Core endpoint: GET /client-contracts/sub-enterprise/{id}/contracts
   *
   * @deprecated Since v0.5.0. For BIAN lending arrangements use `LendingArrangementService.getAll()`
   * from `@pleniu/loan-data-access` instead. This method is specific to the libranza/payroll
   * product model and will be removed on 2026-12-31.
   * See `docs/migration/libranza-to-lending-arrangement.md`.
   */
  listSubEnterpriseContracts(
    subEnterpriseId: string,
    options: {
      cursor?: string | null;
      limit?: number;
      include_terminated?: boolean;
      status?: string | null;
    } = {},
  ): Observable<ApiEnvelope<ClientContractDto[]>> {
    let hp = new HttpParams();
    if (options.cursor) {
      hp = hp.set('cursor', options.cursor);
    }
    if (options.limit != null) {
      hp = hp.set('limit', String(options.limit));
    }
    if (options.include_terminated) {
      hp = hp.set('include_terminated', 'true');
    }
    if (options.status) {
      hp = hp.set('status', options.status);
    }
    return this.http.get<ApiEnvelope<ClientContractDto[]>>(
      `${this.base}/sub-enterprise/${encodeURIComponent(subEnterpriseId)}/contracts`,
      { params: hp },
    );
  }

  listEligibilitySummary(companyCode: string): Observable<ApiEnvelope<EligibilitySummaryDto>> {
    const params = new HttpParams().set('company_code', companyCode);
    return this.http.get<ApiEnvelope<EligibilitySummaryDto>>(`${this.base}/eligibility-summary`, { params });
  }

  /**
   * Lists financial products assigned to the authenticated beneficiary (customer portal).
   * Resolves company_code server-side via the session's sub-enterprise, so no params are needed.
   */
  listMyAssignedContracts(options: {
    cursor?: string | null;
    limit?: number;
    includeTerminated?: boolean;
  } = {}): Observable<ApiEnvelope<ClientContractDto[]>> {
    let hp = new HttpParams();
    if (options.cursor) {
      hp = hp.set('cursor', options.cursor);
    }
    if (options.limit != null) {
      hp = hp.set('limit', String(options.limit));
    }
    if (options.includeTerminated) {
      hp = hp.set('include_terminated', 'true');
    }
    return this.http.get<ApiEnvelope<ClientContractDto[]>>(`${this.base}/me`, { params: hp });
  }

  bulkAssign(body: BulkAssignContractRequest): Observable<ApiEnvelope<BulkAssignContractResponse>> {
    return this.http.post<ApiEnvelope<BulkAssignContractResponse>>(`${this.base}/bulk-assign`, body);
  }

  getContractAudit(
    contractId: string,
    params: ListClientContractAuditParams = {},
  ): Observable<ApiEnvelope<ContractAuditEntryDto[]>> {
    let hp = new HttpParams();
    if (params.page != null) hp = hp.set('page', String(params.page));
    if (params.page_size != null) hp = hp.set('page_size', String(params.page_size));
    return this.http.get<ApiEnvelope<ContractAuditEntryDto[]>>(
      `${this.base}/${contractId}/audit`,
      { params: hp },
    );
  }
}
