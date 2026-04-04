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
