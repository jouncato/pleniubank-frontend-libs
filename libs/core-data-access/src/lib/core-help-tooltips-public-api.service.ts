import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';
import type { HelpTooltipDto } from './core-help-tooltips-api.service';

export { HelpTooltipDto };

@Injectable({ providedIn: 'root' })
export class CoreHelpTooltipsPublicApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/help-tooltips`;
  }

  getByKey(
    tooltipKey: string,
    context: string,
    locale = 'es',
  ): Observable<ApiEnvelope<HelpTooltipDto>> {
    const params = new HttpParams().set('context', context).set('locale', locale);
    return this.http.get<ApiEnvelope<HelpTooltipDto>>(
      `${this.base}/${encodeURIComponent(tooltipKey)}`,
      { params },
    );
  }

  listByContext(
    context: string,
    locale = 'es',
  ): Observable<ApiEnvelope<HelpTooltipDto[]>> {
    const params = new HttpParams().set('context', context).set('locale', locale);
    return this.http.get<ApiEnvelope<HelpTooltipDto[]>>(this.base, { params });
  }
}
