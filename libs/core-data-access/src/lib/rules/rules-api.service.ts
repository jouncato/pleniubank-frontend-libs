import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from 'shared-http';

import type {
  CreateRuleRequest,
  CreateRuleSetRequest,
  Evaluation,
  EvaluationFilters,
  Rule,
  RuleSet,
  RuleVersion,
  UpdateRuleRequest,
  UpdateRuleSetRequest,
} from './rules.models';

export function buildEvaluationParams(filters: EvaluationFilters): HttpParams {
  let params = new HttpParams();
  if (filters.ruleset_code) {
    params = params.set('ruleset_code', filters.ruleset_code);
  }
  if (filters.decision) {
    params = params.set('decision', filters.decision);
  }
  if (filters.date_from) {
    params = params.set('date_from', filters.date_from);
  }
  if (filters.date_to) {
    params = params.set('date_to', filters.date_to);
  }
  if (filters.page != null) {
    params = params.set('page', String(filters.page));
  }
  if (filters.size != null) {
    params = params.set('size', String(filters.size));
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class RulesApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    const root = apiConfig.rulesEngineBaseUrl?.replace(/\/$/, '');
    if (!root) {
      throw new Error('API_CONFIG.rulesEngineBaseUrl no está configurado.');
    }
    this.base = `${root}/api/v1`;
  }

  getRuleSets(): Observable<ApiEnvelope<RuleSet[]>> {
    return this.http.get<ApiEnvelope<RuleSet[]>>(`${this.base}/rulesets`);
  }

  getRuleSet(code: string): Observable<ApiEnvelope<RuleSet>> {
    return this.http.get<ApiEnvelope<RuleSet>>(`${this.base}/rulesets/${encodeURIComponent(code)}`);
  }

  createRuleSet(body: CreateRuleSetRequest): Observable<ApiEnvelope<RuleSet>> {
    return this.http.post<ApiEnvelope<RuleSet>>(`${this.base}/rulesets`, body);
  }

  updateRuleSet(code: string, body: UpdateRuleSetRequest): Observable<ApiEnvelope<RuleSet>> {
    return this.http.put<ApiEnvelope<RuleSet>>(
      `${this.base}/rulesets/${encodeURIComponent(code)}`,
      body,
    );
  }

  getRules(rulesetCode: string): Observable<ApiEnvelope<Rule[]>> {
    return this.http.get<ApiEnvelope<Rule[]>>(
      `${this.base}/rulesets/${encodeURIComponent(rulesetCode)}/rules`,
    );
  }

  createRule(rulesetCode: string, body: CreateRuleRequest): Observable<ApiEnvelope<Rule>> {
    return this.http.post<ApiEnvelope<Rule>>(
      `${this.base}/rulesets/${encodeURIComponent(rulesetCode)}/rules`,
      body,
    );
  }

  updateRule(
    rulesetCode: string,
    ruleCode: string,
    body: UpdateRuleRequest,
  ): Observable<ApiEnvelope<Rule>> {
    return this.http.put<ApiEnvelope<Rule>>(
      `${this.base}/rulesets/${encodeURIComponent(rulesetCode)}/rules/${encodeURIComponent(ruleCode)}`,
      body,
    );
  }

  deleteRule(rulesetCode: string, ruleCode: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/rulesets/${encodeURIComponent(rulesetCode)}/rules/${encodeURIComponent(ruleCode)}`,
    );
  }

  getRuleVersions(rulesetCode: string, ruleCode: string): Observable<ApiEnvelope<RuleVersion[]>> {
    return this.http.get<ApiEnvelope<RuleVersion[]>>(
      `${this.base}/rulesets/${encodeURIComponent(rulesetCode)}/rules/${encodeURIComponent(ruleCode)}/versions`,
    );
  }

  getEvaluations(filters: EvaluationFilters): Observable<ApiEnvelope<Evaluation[]>> {
    const params = buildEvaluationParams(filters);
    return this.http.get<ApiEnvelope<Evaluation[]>>(`${this.base}/evaluations`, { params });
  }

  getEvaluation(id: string): Observable<ApiEnvelope<Evaluation>> {
    return this.http.get<ApiEnvelope<Evaluation>>(`${this.base}/evaluations/${encodeURIComponent(id)}`);
  }
}
