import { InjectionToken } from '@angular/core';

/**
 * Tras login en el portal público, si `customerPortalOrigin` está definido, se redirige al customer
 * con la ruta B2C o B2B (evita rutas inexistentes en :4200). Origen vacío = navegación solo en el host actual.
 */
export interface PostLoginCustomerPortalConfig {
  customerPortalOrigin: string;
  allowCrossOriginTokenHandoff: boolean;
  /** Path en el customer tras login B2C (p. ej. /app/dashboard). */
  b2cPath: string;
  /** Path en el customer tras login B2B (p. ej. /app/dashboard). */
  b2bPath: string;
  /** Path al que se redirige cuando el teléfono aún no está verificado tras el login. */
  verifyPhonePath?: string;
  /** Path al que se redirige cuando el staff debe cambiar su contraseña antes de continuar. */
  changePasswordPath?: string;
}

export const POST_LOGIN_CUSTOMER_PORTAL = new InjectionToken<PostLoginCustomerPortalConfig>(
  'POST_LOGIN_CUSTOMER_PORTAL',
  {
    providedIn: 'root',
    factory: () => ({
      customerPortalOrigin: '',
      allowCrossOriginTokenHandoff: false,
      b2cPath: '/app/dashboard',
      b2bPath: '/app/dashboard',
      verifyPhonePath: '/app/verify-phone',
      changePasswordPath: '/staff/access/change-password',
    }),
  },
);
