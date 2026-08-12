import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';

export interface PayrollAdvanceMasterModelListParams {
  product_type?: string;
  country_code?: string;
  status?: string;
}

export interface PayrollAdvanceMasterModelCreateRequest {
  product_type?: string;
  country_code: string;
  model_version: string;
  policy_version?: string;
  base_terms?: Record<string, unknown>;
  /** Gap 2 (20260804_1000): plantilla contractual que rige el modelo. */
  contract_template_id?: string | null;
}

export interface PayrollAdvanceMasterModelUpdateRequest {
  /** Todos opcionales: solo se mutan los que se envían. */
  model_version?: string;
  policy_version?: string;
  base_terms?: Record<string, unknown>;
  status?: 'DRAFT' | 'ACTIVE' | 'RETIRED';
  /** Gap 2 (20260804_1000): vincular o cambiar la plantilla contractual. */
  contract_template_id?: string | null;
}

export interface PayrollAdvanceMasterModelDto {
  id: string;
  product_type: string;
  country_code: string;
  model_version: string;
  policy_version: string;
  status: string;
  contract_template_id?: string | null;
}

export interface PayrollAdvanceMasterContractCreateRequest {
  global_model_id: string;
  enterprise_id: string;
  approved_total_limit: number;
  safety_buffer_amount?: number;
  /** ADR-023: obligatoria en creación — fuente de fondeo del contrato. */
  custody_account_id: string;
  /**
   * Opcional -- si se omite, Core lo resuelve y congela contra la política
   * de financiación vigente (`PayrollAdvancePolicyResolver`) en vez de
   * aceptar un texto libre sin relación con la política real. Si se envía,
   * debe coincidir exactamente con el hash vigente o Core lo rechaza.
   */
  policy_version?: string;
  effective_from?: string | null;
  effective_to?: string | null;
}

export interface PayrollAdvanceMasterContractDto {
  id: string;
  global_model_id: string;
  enterprise_id: string;
  approved_total_limit: number;
  reserved_principal: number;
  consumed_principal: number;
  safety_buffer_amount: number;
  available_headroom: number;
  policy_version: string;
  status: string;
  effective_from: string;
  effective_to: string | null;
  contract_template_id?: string | null;
  /** ADR-023: custodia de fondeo asignada (obligatoria para activar). */
  custody_account_id?: string | null;
}

export interface PayrollAdvanceMasterAssignmentCreateRequest {
  master_contract_id: string;
  enterprise_id: string;
  sub_enterprise_id: string;
  company_code: string;
  approved_sub_limit?: number | null;
  /**
   * Monto individual ofrecido a cada empleado de la unidad al aceptar la
   * propuesta -- distinto de `approved_sub_limit` (techo agregado de toda
   * la unidad). Sin este valor, Core rechaza la activación del anticipo de
   * cualquier empleado bajo esta unidad (auditoría 2026-08-11).
   */
  default_employee_amount?: number | null;
  terms_override?: Record<string, unknown>;
  effective_from?: string | null;
  effective_to?: string | null;
}

export interface PayrollAdvanceMasterAssignmentDto {
  id: string;
  master_contract_id: string;
  enterprise_id: string;
  sub_enterprise_id: string;
  company_code: string;
  approved_sub_limit: number | null;
  default_employee_amount: number | null;
  status: string;
  effective_from: string;
  effective_to: string | null;
}

/** Edita el cupo agregado y/o el monto por empleado de una asignación ACTIVE ya existente. */
export interface PayrollAdvanceMasterAssignmentTermsUpdateRequest {
  approved_sub_limit?: number | null;
  default_employee_amount?: number | null;
  terms_override?: Record<string, unknown> | null;
}

export interface PayrollAdvanceMasterReconciliationDiscrepancyDto {
  category: string;
  core_reference: string;
  enterprise_id: string | null;
  sub_enterprise_id: string | null;
  correlation_id: string | null;
  details: Record<string, unknown>;
}

export interface PayrollAdvanceMasterReconciliationParams {
  category?: string;
  enterprise_id?: string;
  sub_enterprise_id?: string;
  limit?: number;
  offset?: number;
}

export interface MasterContractSyncErrorDto {
  client_contract_id: string;
  customer_id: string | null;
  sync_status: string;
  sync_attempt_count: number;
  sync_last_error: string | null;
  sync_next_retry_at: string | null;
}

export interface PayrollAdvanceEffectivePolicyValuesDto {
  max_salary_percentage: string;
  min_salary_percentage: string;
  min_tenure_months: number;
  max_monthly_frequency: number;
  max_active_count: number;
  max_discount_days: number;
  employer_daily_limit_amount: string;
}

/**
 * Snapshot de solo lectura de `GET /policy-preview`: la política efectiva
 * para una Empresa Principal (`employer_id`), resuelta con el mismo
 * `PayrollAdvancePolicyResolver` que `resolve_master_contract_terms` congela
 * al crear el contrato maestro -- a diferencia de la política global (sin
 * `employer_id`), esta sí refleja overrides de
 * `loan.employer_payroll_products`.
 */
export interface PayrollAdvanceEffectivePolicyPreviewDto {
  policy_version: string;
  country_code: string;
  product_type: string;
  currency: string;
  employer_id: string | null;
  evaluated_at: string;
  effective_from: string;
  effective_to: string | null;
  global_values: PayrollAdvanceEffectivePolicyValuesDto;
  employer_overrides: Record<string, unknown> | null;
  effective_values: PayrollAdvanceEffectivePolicyValuesDto;
  sources: Record<string, 'GLOBAL' | 'EMPLOYER'>;
  source_value_ids: string[];
}

export interface PayrollAdvanceMasterDocumentVersionDto {
  id: string;
  version_number: number;
  supersedes_version_id: string | null;
  terms_snapshot: Record<string, unknown>;
  effective_from: string;
  effective_to: string | null;
  change_reason: string;
  created_at: string;
  created_by: string;
}

@Injectable({ providedIn: 'root' })
export class CorePayrollAdvanceMasterContractsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/payroll-advance-master-contracts`;
  }

  createModel(
    body: PayrollAdvanceMasterModelCreateRequest,
  ): Observable<ApiEnvelope<PayrollAdvanceMasterModelDto>> {
    return this.http.post<ApiEnvelope<PayrollAdvanceMasterModelDto>>(`${this.base}/models`, body);
  }

  updateModel(
    modelId: string,
    body: PayrollAdvanceMasterModelUpdateRequest,
  ): Observable<ApiEnvelope<PayrollAdvanceMasterModelDto>> {
    return this.http.patch<ApiEnvelope<PayrollAdvanceMasterModelDto>>(
      `${this.base}/models/${modelId}`,
      body,
    );
  }

  listModels(
    params: PayrollAdvanceMasterModelListParams = {},
  ): Observable<ApiEnvelope<PayrollAdvanceMasterModelDto[]>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceMasterModelDto[]>>(`${this.base}/models`, {
      params: this.toHttpParams({
        product_type: params.product_type,
        country_code: params.country_code,
        status: params.status,
      }),
    });
  }

  /** Read-only list of active Backoffice-approved payroll master contracts. */
  listActiveContracts(enterpriseId?: string): Observable<ApiEnvelope<PayrollAdvanceMasterContractDto[]>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceMasterContractDto[]>>(this.base, {
      params: this.toHttpParams({ enterprise_id: enterpriseId }),
    });
  }

  /** Read-only preflight for the single active payroll assignment of a BU. */
  getActiveAssignmentForUnit(
    subEnterpriseId: string,
  ): Observable<ApiEnvelope<PayrollAdvanceMasterAssignmentDto>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceMasterAssignmentDto>>(
      `${this.base}/assignments/active`,
      { params: this.toHttpParams({ sub_enterprise_id: subEnterpriseId }) },
    );
  }

  /**
   * Auditoría 2026-08-11: Core exige `X-Idempotency-Key` en creación (ver
   * `payroll_advance_master_contracts_router.py`), pero este método nunca lo
   * enviaba -- confirmado en vivo, 422 `{"loc":["header","X-Idempotency-Key"]}`
   * al crear/aprobar/asignar desde el portal. Misma convención que
   * `CorePayrollAdvancesApiService.register()`: clave fresca por llamada, sin
   * exponerla al caller.
   */
  createContract(
    body: PayrollAdvanceMasterContractCreateRequest,
  ): Observable<ApiEnvelope<PayrollAdvanceMasterContractDto>> {
    return this.http.post<ApiEnvelope<PayrollAdvanceMasterContractDto>>(this.base, body, {
      headers: new HttpHeaders({ 'X-Idempotency-Key': crypto.randomUUID() }),
    });
  }

  /** Vista previa de solo lectura de la política efectiva para una Empresa Principal. */
  previewPolicy(params: {
    enterprise_id: string;
    country_code?: string;
    product_type?: string;
  }): Observable<ApiEnvelope<PayrollAdvanceEffectivePolicyPreviewDto>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceEffectivePolicyPreviewDto>>(
      `${this.base}/policy-preview`,
      {
        params: this.toHttpParams({
          enterprise_id: params.enterprise_id,
          country_code: params.country_code,
          product_type: params.product_type,
        }),
      },
    );
  }

  updateStatus(
    contractId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'EXPIRED',
    custodyAccountId?: string | null,
  ): Observable<ApiEnvelope<PayrollAdvanceMasterContractDto>> {
    return this.http.patch<ApiEnvelope<PayrollAdvanceMasterContractDto>>(
      `${this.base}/${contractId}/status`,
      custodyAccountId ? { status, custody_account_id: custodyAccountId } : { status },
      { headers: new HttpHeaders({ 'X-Idempotency-Key': crypto.randomUUID() }) },
    );
  }

  assign(
    contractId: string,
    body: PayrollAdvanceMasterAssignmentCreateRequest,
  ): Observable<ApiEnvelope<PayrollAdvanceMasterAssignmentDto>> {
    return this.http.post<ApiEnvelope<PayrollAdvanceMasterAssignmentDto>>(
      `${this.base}/${contractId}/assignments`,
      body,
      { headers: new HttpHeaders({ 'X-Idempotency-Key': crypto.randomUUID() }) },
    );
  }

  get(contractId: string): Observable<ApiEnvelope<PayrollAdvanceMasterContractDto>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceMasterContractDto>>(`${this.base}/${contractId}`);
  }

  listAssignments(contractId: string): Observable<ApiEnvelope<PayrollAdvanceMasterAssignmentDto[]>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceMasterAssignmentDto[]>>(
      `${this.base}/${contractId}/assignments`,
    );
  }

  listReconciliation(
    params: PayrollAdvanceMasterReconciliationParams = {},
  ): Observable<ApiEnvelope<PayrollAdvanceMasterReconciliationDiscrepancyDto[]>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceMasterReconciliationDiscrepancyDto[]>>(
      `${this.base}/reconciliation/report`,
      {
        params: this.toHttpParams({
          category: params.category,
          enterprise_id: params.enterprise_id,
          sub_enterprise_id: params.sub_enterprise_id,
          limit: params.limit,
          offset: params.offset,
        }),
      },
    );
  }

  listVersions(contractId: string): Observable<ApiEnvelope<PayrollAdvanceMasterDocumentVersionDto[]>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceMasterDocumentVersionDto[]>>(
      `${this.base}/${contractId}/versions`,
    );
  }

  listSyncErrors(contractId: string): Observable<ApiEnvelope<MasterContractSyncErrorDto[]>> {
    return this.http.get<ApiEnvelope<MasterContractSyncErrorDto[]>>(
      `${this.base}/${contractId}/sync-errors`,
    );
  }

  revokeAssignment(
    contractId: string,
    assignmentId: string,
  ): Observable<ApiEnvelope<PayrollAdvanceMasterAssignmentDto>> {
    return this.http.patch<ApiEnvelope<PayrollAdvanceMasterAssignmentDto>>(
      `${this.base}/${contractId}/assignments/${assignmentId}/revoke`,
      {},
    );
  }

  /** Revierte una asignación REVOKED a ACTIVE ("des-revocar"). */
  reactivateAssignment(
    contractId: string,
    assignmentId: string,
  ): Observable<ApiEnvelope<PayrollAdvanceMasterAssignmentDto>> {
    return this.http.patch<ApiEnvelope<PayrollAdvanceMasterAssignmentDto>>(
      `${this.base}/${contractId}/assignments/${assignmentId}/reactivate`,
      {},
    );
  }

  /**
   * Edita el cupo agregado y/o el monto por empleado de una asignación ACTIVE
   * ya existente, sin pasar por revoke/reactivate (auditoría 2026-08-11 --
   * antes no había ninguna forma de fijar `default_employee_amount` en
   * unidades ya asignadas, bloqueando la activación del anticipo de todos
   * sus empleados).
   */
  updateAssignmentTerms(
    contractId: string,
    assignmentId: string,
    body: PayrollAdvanceMasterAssignmentTermsUpdateRequest,
  ): Observable<ApiEnvelope<PayrollAdvanceMasterAssignmentDto>> {
    return this.http.patch<ApiEnvelope<PayrollAdvanceMasterAssignmentDto>>(
      `${this.base}/${contractId}/assignments/${assignmentId}`,
      body,
    );
  }

  private toHttpParams(record: Record<string, string | number | boolean | undefined | null>): HttpParams {
    let hp = new HttpParams();
    for (const [key, value] of Object.entries(record)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      hp = hp.set(key, String(value));
    }
    return hp;
  }
}
