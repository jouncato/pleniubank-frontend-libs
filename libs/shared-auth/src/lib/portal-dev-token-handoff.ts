/**
 * Handoff de sesión entre orígenes distintos en local (p. ej. :4200 → :4200).
 * Solo debe usarse cuando `environment.allowCrossOriginTokenHandoff` es true;
 * en producción con SSO real o mismo sitio no aplica.
 */
export const DEV_PORTAL_TOKEN_HANDOFF_KEY = 'pleniu_dev_portal_token_handoff_v1';

interface HandoffPayload {
  access_token: string;
  refresh_token: string | null;
  ts: number;
}

export function stashDevPortalTokenHandoff(
  accessToken: string,
  refreshToken: string | null,
): void {
  const payload: HandoffPayload = {
    access_token: accessToken,
    refresh_token: refreshToken,
    ts: Date.now(),
  };
  try {
    localStorage.setItem(DEV_PORTAL_TOKEN_HANDOFF_KEY, JSON.stringify(payload));
  } catch {
    // quota / modo privado
  }
}

export function consumeDevPortalTokenHandoff(
  maxAgeMs: number,
): { access_token: string; refresh_token: string | null } | null {
  const raw = localStorage.getItem(DEV_PORTAL_TOKEN_HANDOFF_KEY);
  localStorage.removeItem(DEV_PORTAL_TOKEN_HANDOFF_KEY);
  if (!raw) {
    return null;
  }
  try {
    const o = JSON.parse(raw) as Partial<HandoffPayload>;
    if (typeof o.access_token !== 'string' || !o.access_token) {
      return null;
    }
    const ts = typeof o.ts === 'number' ? o.ts : 0;
    if (Date.now() - ts > maxAgeMs) {
      return null;
    }
    return {
      access_token: o.access_token,
      refresh_token: typeof o.refresh_token === 'string' ? o.refresh_token : null,
    };
  } catch {
    return null;
  }
}
