import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  const size = filters.size ?? 50;
  const page = filters.page ?? 1;
  const offset = Math.max(0, (page - 1) * size);
  params = params.set('limit', String(size));
  params = params.set('offset', String(offset));
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

  /**
   * Rules Engine devuelve cuerpos JSON directos; el Core usa { data, meta }.
   * Normalizamos aquí para que el backoffice pueda usar siempre env.data.
   */
  private static asEnvelope<T>(body: unknown): ApiEnvelope<T> {
    if (body !== null && typeof body === 'object' && 'data' in body) {
      return body as ApiEnvelope<T>;
    }
    return { data: body as T };
  }

  getRuleSets(): Observable<ApiEnvelope<RuleSet[]>> {
    return this.http
      .get<unknown>(`${this.base}/rulesets`)
      .pipe(map((body) => RulesApiService.asEnvelope<RuleSet[]>(body)));
  }

  getRuleSet(code: string): Observable<ApiEnvelope<RuleSet>> {
    return this.http
      .get<unknown>(`${this.base}/rulesets/${encodeURIComponent(code)}`)
      .pipe(map((body) => RulesApiService.asEnvelope<RuleSet>(body)));
  }

  createRuleSet(body: CreateRuleSetRequest): Observable<ApiEnvelope<RuleSet>> {
    return this.http
      .post<unknown>(`${this.base}/rulesets`, body)
      .pipe(map((res) => RulesApiService.asEnvelope<RuleSet>(res)));
  }

  updateRuleSet(code: string, body: UpdateRuleSetRequest): Observable<ApiEnvelope<RuleSet>> {
    return this.http
      .put<unknown>(`${this.base}/rulesets/${encodeURIComponent(code)}`, body)
      .pipe(map((res) => RulesApiService.asEnvelope<RuleSet>(res)));
  }

  getRules(rulesetCode: string): Observable<ApiEnvelope<Rule[]>> {
    return this.http
      .get<unknown>(`${this.base}/rulesets/${encodeURIComponent(rulesetCode)}/rules`)
      .pipe(map((body) => RulesApiService.asEnvelope<Rule[]>(body)));
  }

  createRule(rulesetCode: string, body: CreateRuleRequest): Observable<ApiEnvelope<Rule>> {
    return this.http
      .post<unknown>(`${this.base}/rulesets/${encodeURIComponent(rulesetCode)}/rules`, body)
      .pipe(map((res) => RulesApiService.asEnvelope<Rule>(res)));
  }

  updateRule(
    rulesetCode: string,
    ruleCode: string,
    body: UpdateRuleRequest,
  ): Observable<ApiEnvelope<Rule>> {
    return this.http
      .put<unknown>(
        `${this.base}/rulesets/${encodeURIComponent(rulesetCode)}/rules/${encodeURIComponent(ruleCode)}`,
        body,
      )
      .pipe(map((res) => RulesApiService.asEnvelope<Rule>(res)));
  }

  deleteRule(rulesetCode: string, ruleCode: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/rulesets/${encodeURIComponent(rulesetCode)}/rules/${encodeURIComponent(ruleCode)}`,
    );
  }

  getRuleVersions(rulesetCode: string, ruleCode: string): Observable<ApiEnvelope<RuleVersion[]>> {
    return this.http
      .get<unknown>(
        `${this.base}/rulesets/${encodeURIComponent(rulesetCode)}/rules/${encodeURIComponent(ruleCode)}/versions`,
      )
      .pipe(map((body) => RulesApiService.asEnvelope<RuleVersion[]>(body)));
  }

  getEvaluations(filters: EvaluationFilters): Observable<ApiEnvelope<Evaluation[]>> {
    const params = buildEvaluationParams(filters);
    return this.http
      .get<unknown>(`${this.base}/evaluations`, { params })
      .pipe(map((body) => RulesApiService.asEnvelope<Evaluation[]>(body)));
  }

  getEvaluation(id: string): Observable<ApiEnvelope<Evaluation>> {
    return this.http
      .get<unknown>(`${this.base}/evaluations/${encodeURIComponent(id)}`)
      .pipe(map((body) => RulesApiService.asEnvelope<Evaluation>(body)));
  }
}
