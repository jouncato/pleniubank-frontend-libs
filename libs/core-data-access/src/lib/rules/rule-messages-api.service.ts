import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { API_CONFIG, ApiConfig } from '@pleniu/shared-http';

import type {
  CreateRuleMessageRequest,
  EvaluationExplanation,
  RuleMessage,
  UpdateRuleMessageRequest,
} from './rules.models';

@Injectable({ providedIn: 'root' })
export class RuleMessagesApiService {
  private readonly base: string;
  private readonly _cache = new Map<string, Observable<RuleMessage | null>>();

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = (apiConfig.rulesEngineBaseUrl ?? '').replace(/\/$/, '');
  }

  getMessage(ruleCode: string, locale: string): Observable<RuleMessage | null> {
    const key = `${ruleCode}:${locale}`;
    if (!this._cache.has(key)) {
      const params = new HttpParams().set('rule_code', ruleCode).set('locale', locale);
      const req$ = this.http
        .get<RuleMessage | null>(`${this.base}/api/v1/rule-messages`, { params })
        .pipe(
          catchError(() => of(null)),
          shareReplay(1),
        );
      this._cache.set(key, req$);
    }
    return this._cache.get(key)!;
  }

  invalidateCache(): void {
    this._cache.clear();
  }

  listMessages(params?: { ruleset_code?: string; active_only?: boolean }): Observable<RuleMessage[]> {
    let httpParams = new HttpParams();
    if (params?.ruleset_code) {
      httpParams = httpParams.set('ruleset_code', params.ruleset_code);
    }
    if (params?.active_only !== undefined) {
      httpParams = httpParams.set('active_only', String(params.active_only));
    }
    return this.http.get<RuleMessage[]>(`${this.base}/api/v1/admin/rule-messages`, {
      params: httpParams,
    });
  }

  createMessage(body: CreateRuleMessageRequest): Observable<RuleMessage> {
    this.invalidateCache();
    return this.http.post<RuleMessage>(`${this.base}/api/v1/admin/rule-messages`, body);
  }

  updateMessage(messageId: string, body: UpdateRuleMessageRequest): Observable<RuleMessage> {
    this.invalidateCache();
    return this.http.patch<RuleMessage>(
      `${this.base}/api/v1/admin/rule-messages/${messageId}`,
      body,
    );
  }

  getEvaluationExplanation(
    evaluationId: string,
    locale: string,
  ): Observable<EvaluationExplanation> {
    const params = new HttpParams().set('locale', locale);
    return this.http.get<EvaluationExplanation>(
      `${this.base}/api/v1/customer/evaluations/${evaluationId}/explanation`,
      { params },
    );
  }
}
