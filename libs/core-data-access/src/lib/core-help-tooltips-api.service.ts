import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base, corePublicV1Base } from './core-api-base';

export interface HelpTooltipDto {
  id: string;
  tooltip_id: string;
  tooltip_key: string;
  context: string;
  locale: string;
  title: string;
  content_paragraphs: string[];
  bullets: string[];
  version: number;
  is_active: boolean;
}

export interface HelpTooltipCreateRequest {
  tooltip_key: string;
  context: string;
  locale?: string;
  title: string;
  content_paragraphs: string[];
  bullets?: string[];
}

export interface HelpTooltipUpdateRequest {
  title?: string;
  content_paragraphs?: string[];
  bullets?: string[];
}

export interface HelpTooltipListParams {
  locale?: string;
  context?: string;
  search?: string;
  offset?: number;
  limit?: number;
}

export interface HelpTooltipListMeta {
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

@Injectable({ providedIn: 'root' })
export class CoreHelpTooltipsApiService {
  private readonly publicBase: string;
  private readonly adminBase: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.publicBase = `${corePublicV1Base(apiConfig)}/help-tooltips`;
    this.adminBase = `${coreAdminV1Base(apiConfig)}/admin/help-tooltips`;
  }

  // ---------------------------------------------------- PÚBLICO (sin auth)

  getByKey(
    tooltipKey: string,
    context: string,
    locale = 'es',
  ): Observable<ApiEnvelope<HelpTooltipDto>> {
    const params = new HttpParams().set('context', context).set('locale', locale);
    return this.http.get<ApiEnvelope<HelpTooltipDto>>(
      `${this.publicBase}/${encodeURIComponent(tooltipKey)}`,
      { params },
    );
  }

  listByContext(
    context: string,
    locale = 'es',
  ): Observable<ApiEnvelope<HelpTooltipDto[]>> {
    const params = new HttpParams().set('context', context).set('locale', locale);
    return this.http.get<ApiEnvelope<HelpTooltipDto[]>>(this.publicBase, { params });
  }

  // ---------------------------------------------------- ADMIN (requieren JWT admin)

  adminList(
    params: HelpTooltipListParams = {},
  ): Observable<ApiEnvelope<HelpTooltipDto[]>> {
    let hp = new HttpParams();
    if (params.locale) hp = hp.set('locale', params.locale);
    if (params.context) hp = hp.set('context', params.context);
    if (params.search) hp = hp.set('search', params.search);
    if (params.offset != null) hp = hp.set('offset', String(params.offset));
    if (params.limit != null) hp = hp.set('limit', String(params.limit));
    return this.http.get<ApiEnvelope<HelpTooltipDto[]>>(this.adminBase, { params: hp });
  }

  adminCreate(body: HelpTooltipCreateRequest): Observable<ApiEnvelope<HelpTooltipDto>> {
    return this.http.post<ApiEnvelope<HelpTooltipDto>>(this.adminBase, body);
  }

  adminGetById(tooltipId: string): Observable<ApiEnvelope<HelpTooltipDto>> {
    return this.http.get<ApiEnvelope<HelpTooltipDto>>(`${this.adminBase}/${tooltipId}`);
  }

  adminUpdate(
    tooltipId: string,
    body: HelpTooltipUpdateRequest,
  ): Observable<ApiEnvelope<HelpTooltipDto>> {
    return this.http.put<ApiEnvelope<HelpTooltipDto>>(`${this.adminBase}/${tooltipId}`, body);
  }

  adminToggle(
    tooltipId: string,
    active: boolean,
  ): Observable<ApiEnvelope<HelpTooltipDto>> {
    return this.http.patch<ApiEnvelope<HelpTooltipDto>>(
      `${this.adminBase}/${tooltipId}/toggle`,
      { active },
    );
  }

  adminGetVersions(tooltipId: string): Observable<ApiEnvelope<HelpTooltipDto[]>> {
    return this.http.get<ApiEnvelope<HelpTooltipDto[]>>(
      `${this.adminBase}/${tooltipId}/versions`,
    );
  }
}
