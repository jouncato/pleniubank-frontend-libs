export type RuleSubject = 'PERSONA' | 'PAGADOR_NOMINA' | 'TRANSACTION' | 'ACCOUNT';
export type RuleRelation =
  | 'GTE'
  | 'LTE'
  | 'EQ'
  | 'NEQ'
  | 'EXCLUDES'
  | 'IN_RANGE'
  | 'BETWEEN'
  | 'VELOCITY';
export type RuleType = 'STATIC' | 'DYNAMIC' | 'COMPUTED';
export type EvaluationDecision = 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';

export interface RuleSet {
  id: string;
  code: string;
  name: string;
  description: string;
  domain: string;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Rule {
  id: string;
  ruleset_id: string;
  rule_code: string;
  subject: RuleSubject;
  variable: string;
  measure?: string;
  relation: RuleRelation;
  value: Record<string, unknown>;
  result_on_match: string;
  rule_type: RuleType;
  priority: number;
  hard_stop: boolean;
  product_types: string[];
  config: Record<string, unknown>;
  depends_on: string | null;
  version: number;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export interface RuleVersion {
  version: number;
  value: Record<string, unknown>;
  relation: RuleRelation;
  priority: number;
  hard_stop: boolean;
  valid_from: string;
  valid_to: string | null;
  created_by: string;
}

export interface EvaluationResult {
  rule_code: string;
  rule_version: number;
  passed: boolean;
  actual_value: unknown;
  threshold_value: unknown;
  message: string;
}

export interface Evaluation {
  id: string;
  ruleset_code: string;
  correlation_id: string;
  context: Record<string, unknown>;
  decision: EvaluationDecision;
  product_type: string | null;
  rules_evaluated: number;
  rules_passed: number;
  rules_failed: number;
  max_amount: number | null;
  evaluated_at: string;
  evaluated_by: string;
  duration_ms: number;
  results: EvaluationResult[];
}

export interface CreateRuleSetRequest {
  code: string;
  name: string;
  description?: string;
  domain: string;
}

export interface UpdateRuleSetRequest {
  name?: string;
  description?: string;
}

export interface CreateRuleRequest {
  rule_code: string;
  subject: RuleSubject;
  variable: string;
  measure?: string;
  relation: RuleRelation;
  value: Record<string, unknown>;
  result_on_match: string;
  rule_type?: RuleType;
  priority: number;
  hard_stop?: boolean;
  product_types?: string[];
  config?: Record<string, unknown>;
}

export interface UpdateRuleRequest {
  variable?: string;
  relation?: RuleRelation;
  value?: Record<string, unknown>;
  result_on_match?: string;
  priority?: number;
  hard_stop?: boolean;
  product_types?: string[];
  config?: Record<string, unknown>;
}

export interface EvaluationFilters {
  ruleset_code?: string;
  decision?: EvaluationDecision;
  date_from?: string;
  date_to?: string;
  page?: number;
  size?: number;
}

export type ProposalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface Proposal {
  id: string;
  ruleset_code: string;
  rule_code: string;
  proposed_payload: Record<string, unknown>;
  status: ProposalStatus;
  author_user_id: string;
  approver_user_id: string | null;
  decided_at: string | null;
  decided_comment: string | null;
  created_at: string;
}

export interface CreateProposalRequest {
  ruleset_code: string;
  rule_code: string;
  proposed_payload: Record<string, unknown>;
  author_user_id: string;
}

export interface DecideProposalRequest {
  approver_user_id: string;
  comment?: string;
}

export interface BulkDecideRequest {
  proposal_ids: string[];
  action: 'APPROVED' | 'REJECTED';
  comment: string;
  approver_user_id: string;
}

export interface BulkDecideResult {
  proposal_id: string;
  status: 'ok' | 'error';
  error?: string;
}

export interface BulkDecideResponse {
  results: BulkDecideResult[];
}

export interface DiffFieldChange {
  field: string;
  current_value: unknown;
  proposed_value: unknown;
  changed: boolean;
}

export interface RuleDiff {
  proposal_id: string;
  ruleset_code: string;
  rule_code: string;
  is_new_rule: boolean;
  changes: DiffFieldChange[];
}

export interface TestCase {
  id: string;
  ruleset_code: string;
  name: string;
  description: string | null;
  input_context: Record<string, unknown>;
  expected_decision: EvaluationDecision;
  expected_max_amount: number | null;
  expected_rules_failed: number | null;
  country_code: string | null;
  company_code: string | null;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateTestCaseRequest {
  name: string;
  description?: string;
  input_context: Record<string, unknown>;
  expected_decision: EvaluationDecision;
  expected_max_amount?: number;
  expected_rules_failed?: number;
  country_code?: string;
  company_code?: string;
  created_by?: string;
}

export interface TestCaseResult {
  test_case_id: string;
  name: string;
  passed: boolean;
  expected_decision: string;
  actual_decision: string;
  expected_rules_failed: number | null;
  actual_rules_failed: number;
  duration_ms: number;
  trace: unknown[] | null;
}

export interface TestSuiteReport {
  ruleset_code: string;
  proposal_id: string | null;
  total: number;
  passed: number;
  failed: number;
  duration_total_ms: number;
  results: TestCaseResult[];
}

export interface SimulateRequest {
  ruleset_code: string;
  context: Record<string, unknown>;
  product_type?: string;
  correlation_id?: string;
}

export interface SimulateResponse {
  evaluation_id: string | null;
  decision: EvaluationDecision;
  max_amount: number | null;
  rules_evaluated: number;
  rules_passed: number;
  rules_failed: number;
  short_circuited: boolean;
  rejection_reason: string | null;
  results: EvaluationResult[];
  evaluated_at: string;
  duration_ms: number;
  trace: unknown[] | null;
}

export interface AuditLog {
  id: string;
  ruleset_code: string;
  rule_code: string;
  actor_user_id: string;
  payload_hash: string;
  previous_hash: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface AuditVerifyResult {
  valid: boolean;
  broken_at?: string;
  broken_entry?: AuditLog;
}
