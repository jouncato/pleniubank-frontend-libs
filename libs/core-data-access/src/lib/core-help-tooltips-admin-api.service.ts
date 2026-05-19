import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';
import type {
  HelpTooltipCreateRequest,
  HelpTooltipDto,
  HelpTooltipListParams,
  HelpTooltipUpdateRequest,
} from './core-help-tooltips-api.service';

export { HelpTooltipCreateRequest, HelpTooltipDto, HelpTooltipListParams, HelpTooltipUpdateRequest };

@Injectable({ providedIn: 'root' })
export class CoreHelpTooltipsAdminApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/admin/help-tooltips`;
  }

  list(params: HelpTooltipListParams = {}): Observable<ApiEnvelope<HelpTooltipDto[]>> {
    let hp = new HttpParams();
    if (params.locale) hp = hp.set('locale', params.locale);
    if (params.context) hp = hp.set('context', params.context);
    if (params.search) hp = hp.set('search', params.search);
    if (params.offset != null) hp = hp.set('offset', String(params.offset));
    if (params.limit != null) hp = hp.set('limit', String(params.limit));
    return this.http.get<ApiEnvelope<HelpTooltipDto[]>>(this.base, { params: hp });
  }

  create(body: HelpTooltipCreateRequest): Observable<ApiEnvelope<HelpTooltipDto>> {
    return this.http.post<ApiEnvelope<HelpTooltipDto>>(this.base, body);
  }

  getById(tooltipId: string): Observable<ApiEnvelope<HelpTooltipDto>> {
    return this.http.get<ApiEnvelope<HelpTooltipDto>>(`${this.base}/${tooltipId}`);
  }

  update(
    tooltipId: string,
    body: HelpTooltipUpdateRequest,
  ): Observable<ApiEnvelope<HelpTooltipDto>> {
    return this.http.put<ApiEnvelope<HelpTooltipDto>>(`${this.base}/${tooltipId}`, body);
  }

  toggle(tooltipId: string, active: boolean): Observable<ApiEnvelope<HelpTooltipDto>> {
    return this.http.patch<ApiEnvelope<HelpTooltipDto>>(`${this.base}/${tooltipId}/toggle`, {
      active,
    });
  }

  getVersions(tooltipId: string): Observable<ApiEnvelope<HelpTooltipDto[]>> {
    return this.http.get<ApiEnvelope<HelpTooltipDto[]>>(`${this.base}/${tooltipId}/versions`);
  }
}
