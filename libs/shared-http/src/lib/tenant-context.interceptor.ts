import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantContextService } from './tenant-context.service';
import {
  DEFAULT_TENANT,
  SupportedTenant,
  isSupportedTenant,
} from './tenant-country.types';
import { TENANT_INTERCEPTOR_EXCLUDE_URLS } from './tenant-interceptor-exclude-urls.token';
import { TENANT_HEADER_ENABLED } from './tenant-interceptor.config';
import { decodeJwtPayload } from './jwt-payload.util';

const TENANT_HEADER = 'X-Tenant-Country';

/**
 * Interceptor que inyecta automáticamente `X-Tenant-Country` en los requests
 * salientes cuando la flag `TENANT_HEADER_ENABLED` está activa (HU-RE-049).
 *
 * Alcance actual: solo `CO`. La arquitectura permite extensión futura añadiendo
 * tenants a `SUPPORTED_TENANTS` sin cambios aquí.
 *
 * Estrategia de resolución (en orden, primera válida gana):
 *   1. `TenantContextService.selectedCountry()` — siempre válida por construcción.
 *   2. Claim `country_code` del bearer token del propio request (solo si es
 *      un tenant soportado; si no, se ignora).
 *   3. Fallback: `DEFAULT_TENANT` (`CO`).
 *
 * No sobreescribe el header si el request ya lo trae.
 * No inyecta si la URL contiene alguno de los fragmentos de
 * `TENANT_INTERCEPTOR_EXCLUDE_URLS`.
 */
export const tenantContextInterceptor: HttpInterceptorFn = (req, next) => {
  const enabled = inject(TENANT_HEADER_ENABLED);
  if (!enabled) {
    return next(req);
  }

  // Respeto del header ya presente (explicit wins).
  if (req.headers.has(TENANT_HEADER)) {
    return next(req);
  }

  // Exclusiones por substring de URL.
  const excludes = inject(TENANT_INTERCEPTOR_EXCLUDE_URLS);
  if (excludes.some((frag) => req.url.includes(frag))) {
    return next(req);
  }

  const ctx = inject(TenantContextService);
  const resolved = resolveTenant(ctx.selectedCountry(), req);

  return next(
    req.clone({
      setHeaders: {
        [TENANT_HEADER]: resolved,
      },
    }),
  );
};

function resolveTenant(
  fromService: SupportedTenant,
  req: HttpRequest<unknown>,
): SupportedTenant {
  // 1. Selección explícita del service (siempre válida por construcción).
  //    Si está en el default y el JWT ofrece algo soportado, lo respeta.
  if (fromService !== DEFAULT_TENANT) {
    return fromService;
  }
  // 2. Claim country_code del bearer token del request, solo si es soportado.
  const fromJwt = extractCountryFromAuthHeader(req.headers.get('Authorization'));
  if (isSupportedTenant(fromJwt)) {
    return fromJwt;
  }
  // 3. Default final.
  return DEFAULT_TENANT;
}

function extractCountryFromAuthHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const token = m[1].trim();
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const cc = (payload as { country_code?: unknown }).country_code;
  return typeof cc === 'string' ? cc : null;
}
