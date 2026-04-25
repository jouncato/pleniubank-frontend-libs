import type {
  CreateRuleMessageRequest,
  Evaluation,
  EvaluationExplanation,
  Rule,
  RuleMessage,
  RuleSet,
  TraceStep,
} from './rules.types';

describe('@pleniu/rules-types', () => {
  it('compila estructuras de Rule/RuleSet', () => {
    const rs: RuleSet = {
      id: 'rs-1',
      code: 'LOAN_V1',
      name: 'Loan Rules',
      description: 'desc',
      domain: 'loans',
      is_active: true,
      version: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    const r: Rule = {
      id: 'r-1',
      ruleset_id: rs.id,
      rule_code: 'AGE_MIN',
      subject: 'PERSONA',
      variable: 'age',
      relation: 'GTE',
      value: { min: 18 },
      result_on_match: 'PASS',
      rule_type: 'STATIC',
      priority: 1,
      hard_stop: false,
      product_types: [],
      config: {},
      depends_on: null,
      version: 1,
      valid_from: '2024-01-01',
      valid_to: null,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      created_by: 'u1',
    };
    expect(rs.code).toBe('LOAN_V1');
    expect(r.rule_code).toBe('AGE_MIN');
  });

  it('compila Evaluation con decision literal', () => {
    const e: Evaluation = {
      id: 'e-1',
      ruleset_code: 'LOAN_V1',
      correlation_id: 'c-1',
      context: {},
      decision: 'APPROVED',
      product_type: null,
      rules_evaluated: 5,
      rules_passed: 5,
      rules_failed: 0,
      max_amount: 1000,
      evaluated_at: '2024-01-01T00:00:00Z',
      evaluated_by: 'u1',
      duration_ms: 12,
      results: [],
    };
    expect(e.decision).toBe('APPROVED');
  });

  it('compila TraceStep con outcome tipado', () => {
    const step: TraceStep = {
      id: 's-1',
      rule_code: 'AGE_MIN',
      title: 'Edad mínima',
      outcome: 'pass',
      duration_ms: 5,
      children: [],
    };
    expect(step.outcome).toBe('pass');
  });

  it('compila tipos de i18n rule messages', () => {
    const msg: RuleMessage = {
      id: 'm-1',
      ruleset_code: 'LOAN_V1',
      rule_code: 'AGE_MIN',
      locale: 'es-CO',
      title: 'Edad insuficiente',
      description: 'Debes ser mayor de 18 años',
      action_hint: null,
      is_active: true,
      updated_by: null,
      updated_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    };
    const req: CreateRuleMessageRequest = {
      ruleset_code: msg.ruleset_code,
      rule_code: msg.rule_code,
      locale: msg.locale,
      title: msg.title,
      description: msg.description,
    };
    const exp: EvaluationExplanation = {
      evaluation_id: 'e-1',
      decision: 'REJECTED',
      explanations: [
        {
          rule_code: msg.rule_code,
          title: msg.title,
          description: msg.description,
          action_hint: null,
        },
      ],
    };
    expect(msg.locale).toBe('es-CO');
    expect(req.rule_code).toBe('AGE_MIN');
    expect(exp.explanations.length).toBe(1);
  });
});
