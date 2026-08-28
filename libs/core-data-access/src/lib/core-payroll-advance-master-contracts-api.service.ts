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
  cutoff_day?: number | null;
  payment_day?: number | null;
  enterprise_due_day?: number | null;
  cycle_timezone?: string | null;
  cycle_denomination?: string;
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
  cutoff_day?: number | null;
  payment_day?: number | null;
  enterprise_due_day?: number | null;
  cycle_timezone?: string | null;
  cycle_denomination?: string;
  contract_template_id?: string | null;
  /** ADR-023: custodia de fondeo asignada (obligatoria para activar). */
  custody_account_id?: string | null;
  /** openspec add-payroll-advance-partner-commission: % sobre
   * payroll_advance_disbursement_fee_amount, default "0" -- solo lectura,
   * editable exclusivamente vía el maker-checker de commission-change-requests. */
  partner_commission_percentage?: string;
}

/** Ajusta (sube o baja) el cupo agregado total de un contrato ACTIVE. El
 * motivo es obligatorio -- se persiste como `change_reason` de la nueva
 * versión inmutable del contrato. */
export interface PayrollAdvanceMasterContractCapacityAdjustmentRequest {
  new_approved_total_limit: number;
  reason: string;
}

export type PayrollAdvanceCycleReportType = 'PRE_CYCLE' | 'POST_CYCLE';

export interface PayrollAdvanceCycleReportListParams {
  enterprise_id?: string;
  master_contract_id?: string;
  master_contract_version_id?: string;
  master_assignment_id?: string;
  report_type?: PayrollAdvanceCycleReportType;
  status?: string;
  scheduled_cycle_date?: string;
  limit?: number;
  offset?: number;
}

export interface PayrollAdvanceCycleReportDto {
  id: string;
  master_contract_id: string;
  master_contract_version_id: string | null;
  enterprise_id: string;
  report_type: PayrollAdvanceCycleReportType;
  status: string;
  schema_version: string;
  cutoff_date: string;
  enterprise_due_date: string;
  payment_day: number | null;
  cycle_timezone: string | null;
  scheduled_cycle_date: string;
  generated_at: string;
  retention_until: string | null;
  total_lines: number;
  total_principal: string;
  total_commission: string;
  total_interest: string;
  total_late_fee: string;
  total_owed: string;
  denomination: string;
  content_hash: string | null;
  error_details: Record<string, unknown> | null;
  correlation_id: string | null;
  trigger_source: string;
}

export interface PayrollAdvanceCycleReportLineDto {
  id: string;
  advance_id: string;
  advance_version: number;
  master_assignment_id: string | null;
  employer_id: string;
  customer_id: string;
  amount: string;
  principal_outstanding: string;
  commission_outstanding: string;
  accrued_interest: string;
  accrued_late_fee: string;
  total_owed: string;
  payment_day: number | null;
  b2b_amount_received: string;
  b2b_amount_applied: string;
  document_status: string;
  ledger_status: string;
  gl_status: string;
  reservation_status: string;
  reconciliation_status: string;
  posting_batch_id: string | null;
  journal_entry_id: string | null;
  discrepancy_details: Record<string, unknown> | null;
  status: string;
}

export interface PayrollAdvanceCycleDocumentDto {
  id: string;
  report_id: string;
  master_contract_id: string;
  enterprise_id: string;
  document_type: 'OPERATIONAL_REPORT' | 'COLLECTION_NOTICE';
  status: string;
  schema_version: string;
  scheduled_cycle_date: string;
  denomination: string;
  total_owed: string;
  snapshot_content_hash: string | null;
  retention_until: string | null;
}

export interface PayrollAdvanceCycleReportDetailDto {
  report: PayrollAdvanceCycleReportDto;
  documents: PayrollAdvanceCycleDocumentDto[];
  lines: PayrollAdvanceCycleReportLineDto[];
}

export interface PayrollAdvanceCycleReportPageDto {
  items: PayrollAdvanceCycleReportDto[];
  total: number;
  limit: number;
  offset: number;
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

/** Una fila de la asignación masiva (plan "Carga masiva de jerarquía",
 * 2026-08-18). `fila_id` correlaciona esta fila con su resultado en la
 * respuesta -- no se persiste. */
export interface BulkMasterAssignmentItem {
  fila_id: string;
  sub_enterprise_id: string;
  company_code: string;
}

export interface BulkAssignMasterContractRequest {
  enterprise_id: string;
  items: BulkMasterAssignmentItem[];
  approved_sub_limit?: number | null;
  default_employee_amount?: number | null;
}

export interface BulkMasterAssignmentResultEntry {
  fila_id: string;
  sub_enterprise_id: string;
  status: 'assigned' | 'skipped' | 'error';
  assignment_id?: string | null;
  reason?: string | null;
}

export interface BulkAssignMasterContractResponse {
  assigned: number;
  skipped: number;
  errors: number;
  entries: BulkMasterAssignmentResultEntry[];
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
  /** Derived concentration evidence returned by Core for active assignments. */
  allocation_mode?: 'EXPLICIT' | 'SHARED_POOL' | null;
  master_available_headroom?: number | null;
  shared_units_count?: number | null;
  explicit_capacity?: number | null;
  shared_unit_cap?: number | null;
  unit_exposure?: number | null;
  unit_concentration_headroom?: number | null;
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
  enterprise_name?: string | null;
  sub_enterprise_id: string | null;
  sub_enterprise_name?: string | null;
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

/**
 * openspec/changes/add-payroll-advance-partner-commission (sección 5): gobernanza
 * maker-checker del porcentaje de comisión por alianza estratégica y de la
 * cuenta de pago destino -- creador != aprobador, aplicado por Core.
 */
export type CommissionChangeRequestStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface CommissionChangeRequestDto {
  id: string;
  master_contract_id: string;
  status: CommissionChangeRequestStatus | string;
  proposed_by: string;
  proposed_partner_commission_percentage: string | null;
  proposed_payout_account_id: string | null;
  change_reason: string;
  decided_by: string | null;
  decision_reason: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface ProposeCommissionChangeRequestBody {
  proposed_partner_commission_percentage?: number;
  proposed_payout_account_id?: string;
  change_reason: string;
}

export interface DecideCommissionChangeRequestBody {
  decision: 'approve' | 'reject';
  decision_reason: string;
}

/** openspec add-payroll-advance-partner-commission (sección 6): cuenta bancaria
 * de pago de la Empresa Principal. Se crea en PENDING_APPROVAL -- solo se
 * activa vía el maker-checker de arriba, nunca por un endpoint de escritura
 * directa. */
export type EnterprisePayoutAccountStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE';

export interface EnterprisePayoutAccountDto {
  id: string;
  enterprise_id: string;
  bank_code: string;
  masked_account_number: string;
  account_type: string;
  holder_name: string;
  status: EnterprisePayoutAccountStatus | string;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
}

export interface CreateEnterprisePayoutAccountRequest {
  bank_code: string;
  account_number: string;
  account_type: string;
  holder_name: string;
  holder_document_type: string;
  holder_document_number: string;
}

/** openspec add-payroll-advance-partner-commission (sección 7): historial de
 * liquidaciones (payouts) -- ejecución MOCKEADA, nunca dinero real, hasta que
 * se reemplace el adaptador del gateway en Core. */
export type PartnerCommissionPayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface PartnerCommissionPayoutDto {
  id: string;
  master_contract_id: string;
  enterprise_id: string;
  payout_account_id: string;
  gross_amount: string;
  tax_amount: string;
  net_amount: string;
  currency: string;
  status: PartnerCommissionPayoutStatus | string;
  gateway_reference: string | null;
  period_start: string;
  period_end: string;
  failure_reason: string | null;
  created_at: string;
  completed_at: string | null;
}

@Injectable({ providedIn: 'root' })
export class CorePayrollAdvanceMasterContractsApiService {
  private readonly base: string;
  private readonly reportsBase: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    const coreBase = coreAdminV1Base(apiConfig);
    this.base = `${coreBase}/payroll-advance-master-contracts`;
    this.reportsBase = `${coreBase}/payroll-advance-cycle-reports`;
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

  /**
   * Lista pendientes directamente desde Core, sin depender de una
   * notificación histórica (incluye contratos legacy en PENDING_APPROVAL).
   */
  listPendingApprovals(limit = 100, offset = 0): Observable<ApiEnvelope<PayrollAdvanceMasterContractDto[]>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceMasterContractDto[]>>(
      `${this.base}/pending-approval`,
      { params: this.toHttpParams({ limit, offset }) },
    );
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

  /** Ajusta (sube o baja) el cupo agregado total de un contrato ACTIVE.
   * Dual control en Core: el creador del contrato no puede ajustar su
   * propio cupo -- debe hacerlo otro administrador. */
  adjustCapacity(
    contractId: string,
    body: PayrollAdvanceMasterContractCapacityAdjustmentRequest,
  ): Observable<ApiEnvelope<PayrollAdvanceMasterContractDto>> {
    return this.http.patch<ApiEnvelope<PayrollAdvanceMasterContractDto>>(
      `${this.base}/${contractId}/capacity`,
      body,
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

  /** Asignación masiva de Unidades de Negocio a un Contrato Maestro ya
   * activo (plan "Carga masiva de jerarquía", 2026-08-18) -- reutiliza el
   * mismo control dual que `assign()` (evaluado una vez para todo el
   * lote, no por fila, en el backend). */
  bulkAssign(
    contractId: string,
    body: BulkAssignMasterContractRequest,
  ): Observable<ApiEnvelope<BulkAssignMasterContractResponse>> {
    return this.http.post<ApiEnvelope<BulkAssignMasterContractResponse>>(
      `${this.base}/${contractId}/assignments/bulk`,
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

  // ── openspec add-payroll-advance-partner-commission (sección 5): gobernanza ──

  proposeCommissionChange(
    contractId: string,
    body: ProposeCommissionChangeRequestBody,
  ): Observable<ApiEnvelope<CommissionChangeRequestDto>> {
    return this.http.post<ApiEnvelope<CommissionChangeRequestDto>>(
      `${this.base}/${contractId}/commission-change-requests`,
      body,
    );
  }

  listCommissionChangeRequests(
    contractId: string,
    status?: CommissionChangeRequestStatus | string,
  ): Observable<ApiEnvelope<CommissionChangeRequestDto[]>> {
    return this.http.get<ApiEnvelope<CommissionChangeRequestDto[]>>(
      `${this.base}/${contractId}/commission-change-requests`,
      { params: this.toHttpParams({ status }) },
    );
  }

  decideCommissionChange(
    contractId: string,
    requestId: string,
    body: DecideCommissionChangeRequestBody,
  ): Observable<ApiEnvelope<CommissionChangeRequestDto>> {
    return this.http.post<ApiEnvelope<CommissionChangeRequestDto>>(
      `${this.base}/${contractId}/commission-change-requests/${requestId}/decide`,
      body,
    );
  }

  // ── openspec add-payroll-advance-partner-commission (sección 6): cuenta de pago ──

  createPayoutAccount(
    contractId: string,
    body: CreateEnterprisePayoutAccountRequest,
  ): Observable<ApiEnvelope<EnterprisePayoutAccountDto>> {
    return this.http.post<ApiEnvelope<EnterprisePayoutAccountDto>>(
      `${this.base}/${contractId}/payout-accounts`,
      body,
    );
  }

  listPayoutAccounts(contractId: string): Observable<ApiEnvelope<EnterprisePayoutAccountDto[]>> {
    return this.http.get<ApiEnvelope<EnterprisePayoutAccountDto[]>>(
      `${this.base}/${contractId}/payout-accounts`,
    );
  }

  // ── openspec add-payroll-advance-partner-commission (sección 7): liquidaciones ──

  listPartnerCommissionPayouts(
    contractId: string,
    status?: PartnerCommissionPayoutStatus | string,
  ): Observable<ApiEnvelope<PartnerCommissionPayoutDto[]>> {
    return this.http.get<ApiEnvelope<PartnerCommissionPayoutDto[]>>(
      `${this.base}/${contractId}/partner-commission-payouts`,
      { params: this.toHttpParams({ status }) },
    );
  }

  listCycleReports(
    params: PayrollAdvanceCycleReportListParams = {},
  ): Observable<ApiEnvelope<PayrollAdvanceCycleReportPageDto>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceCycleReportPageDto>>(
      this.reportsBase,
      {
        params: this.toHttpParams({
          enterprise_id: params.enterprise_id,
          master_contract_id: params.master_contract_id,
          master_contract_version_id: params.master_contract_version_id,
          master_assignment_id: params.master_assignment_id,
          report_type: params.report_type,
          status: params.status,
          scheduled_cycle_date: params.scheduled_cycle_date,
          limit: params.limit,
          offset: params.offset,
        }),
      },
    );
  }

  getCycleReport(
    reportId: string,
  ): Observable<ApiEnvelope<PayrollAdvanceCycleReportDetailDto>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceCycleReportDetailDto>>(
      `${this.reportsBase}/${reportId}`,
    );
  }

  downloadCycleReport(reportId: string): Observable<Blob> {
    return this.http.get(
      `${this.reportsBase}/${reportId}/download.csv`,
      { responseType: 'blob' },
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
