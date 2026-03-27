import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminCreateEnterpriseEnvelope,
  AdminCreateEnterpriseRequest,
  AdminCreateUserEnvelope,
  AdminCreateUserRequest,
} from 'identity-domain';
import { API_CONFIG, ApiConfig } from 'shared-http';

@Injectable({ providedIn: 'root' })
export class IdentityAdminApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  createUser(payload: AdminCreateUserRequest): Observable<AdminCreateUserEnvelope> {
    return this.http.post<AdminCreateUserEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/admin/users`,
      payload,
    );
  }

  createEnterprise(payload: AdminCreateEnterpriseRequest): Observable<AdminCreateEnterpriseEnvelope> {
    return this.http.post<AdminCreateEnterpriseEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/admin/enterprises`,
      payload,
    );
  }
}
