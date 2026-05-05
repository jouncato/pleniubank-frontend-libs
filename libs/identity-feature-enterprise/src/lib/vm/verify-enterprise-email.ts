import { Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { SessionStore } from '@pleniu/shared-auth';
import { mapHttpError } from '@pleniu/shared-http';
import { EnterpriseOnboardingStore } from '../enterprise-onboarding.store';

export type EnterpriseEmailRole = 'principal' | 'admin';

/** Decodifica el payload de un JWT (base64url → JSON). Compatible con browser y Node. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }
    const payloadSegment = parts[1];
    // base64url → base64
    const b64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '==='.slice((b64.length + 3) % 4);
    // Libs frontend: atob siempre disponible (browser + jsdom/test env).
    const decoded = atob(padded);
    // Unicode-safe decode (para caracteres no-ASCII en claims)
    const json = decodeURIComponent(
      decoded
        .split('')
        .map((c: string) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    const parsed: unknown = JSON.parse(json);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function verifyEnterpriseEmailUserMessage(status: number, raw: string): string {
  if (status === 404) {
    return 'Proceso expirado, reinicia el registro empresa.';
  }
  if (status === 422) {
    return 'Datos inválidos. Reinicia el proceso de registro.';
  }
  const key = raw.trim();
  const known: Record<string, string> = {
    'Invalid verification code': 'Código incorrecto.',
    'Verification code expired':
      'El código expiró. Puedes solicitar uno nuevo con «Reenviar código».',
    'Verification temporarily locked due to repeated failed attempts':
      'Demasiados intentos incorrectos. Espera unos minutos o solicita un nuevo código.',
    'No pending verification challenge':
      'No hay un código pendiente. Pulsa «Reenviar código» para recibir uno nuevo.',
    'Invalid user for enterprise email verification': 'Este paso no aplica a tu usuario. Reinicia el registro.',
  };
  if (known[key]) {
    return known[key];
  }
  if (key.length > 0) {
    return key;
  }
  return 'No se pudo verificar el código. Revisa e intenta de nuevo.';
}

function resendEnterpriseOtpUserMessage(status: number, raw: string): string {
  if (status === 404) {
    return 'Proceso expirado, reinicia el registro empresa.';
  }
  if (status === 429) {
    return raw.trim().length > 0 ? raw.trim() : 'Espera unos segundos antes de volver a pedir el código.';
  }
  if (status === 409) {
    return 'Este correo ya está verificado. Continúa con el inicio de sesión.';
  }
  const known: Record<string, string> = {
    'Email OTP is disabled on this server': 'Verificación por correo no disponible en este entorno.',
    'Invalid user for enterprise email verification': 'No se puede reenviar el código para este usuario.',
  };
  const key = raw.trim();
  if (known[key]) {
    return known[key];
  }
  if (key.length > 0) {
    return key;
  }
  return 'No se pudo reenviar el código. Intenta de nuevo.';
}

@Injectable({
  providedIn: 'root',
})
export class VerifyEnterpriseEmailVm {
  readonly state = signal<'idle' | 'submitting' | 'error' | 'expired'>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly resendSubmitting = signal(false);
  readonly resendInfo = signal<string | null>(null);

  constructor(
    private readonly api: IdentityEnterpriseApiService,
    private readonly onboarding: EnterpriseOnboardingStore,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly sessionStore: SessionStore,
  ) {}

  getRole(): EnterpriseEmailRole {
    const r = this.route.snapshot.queryParamMap.get('role');
    return r === 'admin' ? 'admin' : 'principal';
  }

  maskedEmail(): string {
    const s = this.onboarding.state();
    if (!s) {
      return 'tu correo';
    }
    const email = this.getRole() === 'principal' ? s.principalEmail : s.adminEmail;
    const [user, domain] = email.split('@');
    if (!domain) {
      return email;
    }
    const u = user.length <= 2 ? `${user[0] ?? ''}*` : `${user.slice(0, 1)}***`;
    return `${u}@${domain}`;
  }

  resendCode(): void {
    if (this.resendSubmitting() || this.state() === 'submitting') {
      return;
    }
    const s = this.onboarding.state();
    const role = this.getRole();
    const userId = role === 'principal' ? s?.principalUserId : s?.adminUserId;
    if (!userId) {
      this.state.set('expired');
      this.errorMessage.set('Proceso expirado, reinicia el registro empresa.');
      this.resendInfo.set(null);
      return;
    }

    // Validar formato UUID antes de enviar al backend (evita 422 de Pydantic)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(userId)) {
      console.error('[VerifyEnterpriseEmailVm] Invalid UUID format for userId:', userId);
      this.state.set('expired');
      this.errorMessage.set('Proceso expirado, reinicia el registro empresa.');
      this.resendInfo.set(null);
      return;
    }

    this.resendSubmitting.set(true);
    this.resendInfo.set(null);
    this.errorMessage.set(null);

    this.api.resendEnterpriseEmailOtp({ user_id: userId }).subscribe({
      next: () => {
        this.resendSubmitting.set(false);
        this.state.set('idle');
        this.errorMessage.set(null);
        this.resendInfo.set('Te enviamos un nuevo código a tu correo.');
      },
      error: (err: unknown) => {
        this.resendSubmitting.set(false);
        const mapped = mapHttpError(err);
        if (mapped.status === 404) {
          this.state.set('expired');
          this.errorMessage.set('Proceso expirado, reinicia el registro empresa.');
          return;
        }
        this.errorMessage.set(resendEnterpriseOtpUserMessage(mapped.status, mapped.errors[0]?.message ?? ''));
      },
    });
  }

  submit(code: string): void {
    if (this.state() === 'submitting') {
      return;
    }
    const s = this.onboarding.state();
    const role = this.getRole();
    const userId = role === 'principal' ? s?.principalUserId : s?.adminUserId;
    if (!userId) {
      this.state.set('expired');
      this.errorMessage.set('Proceso expirado, reinicia el registro empresa.');
      return;
    }

    // Validar formato UUID antes de enviar al backend (evita 422 de Pydantic)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(userId)) {
      console.error('[VerifyEnterpriseEmailVm] Invalid UUID format for userId:', userId);
      this.state.set('expired');
      this.errorMessage.set('Proceso expirado, reinicia el registro empresa.');
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set(null);
    this.resendInfo.set(null);

    this.api.verifyEnterpriseEmail({ user_id: userId, code }).subscribe({
      next: (env) => {
        this.state.set('idle');
        const data = env.data;

        // Auto-login if tokens are provided
        if (data?.access_token) {
          this.sessionStore.setUserToken(data.access_token);

          // Decode and set claims from token for guard compatibility
          const claims = decodeJwtPayload(data.access_token);
          if (claims) {
            this.sessionStore.setClaims({
              user_id: typeof claims['sub'] === 'string' ? claims['sub'] : undefined,
              role: typeof claims['role'] === 'string' ? claims['role'] : undefined,
              enterprise_id: typeof claims['enterprise_id'] === 'string' ? claims['enterprise_id'] : undefined,
            });
          }

          // Clear onboarding state as registration is complete
          this.onboarding.clear();

          if (data?.is_active) {
            // User is fully active - navigate to main KYB dashboard
            void this.router.navigate(['/app/enterprise/kyb']);
          } else {
            // User verified email but pending KYB completion
            // Redirect directly to KYB flow with limited token
            void this.router.navigate(['/app/enterprise/kyb']);
          }
          return;
        }

        // Fallback: redirect to login for manual authentication
        // (when no token was provided - should not happen in normal flow)
        if (role === 'principal') {
          void this.router.navigate(['/onboarding/party/access/login'], {
            queryParams: { returnUrl: '/app/enterprise/kyb' },
          });
          return;
        }
        // Este código ya no se ejecuta para admin (eliminado del flujo)
        void this.router.navigate(['/onboarding/party/access/login'], {
          queryParams: { returnUrl: '/app/enterprise/kyb' },
        });
      },
      error: (err: unknown) => {
        const mapped = mapHttpError(err);
        this.state.set(mapped.status === 404 ? 'expired' : 'error');
        this.errorMessage.set(
          verifyEnterpriseEmailUserMessage(mapped.status, mapped.errors[0]?.message ?? ''),
        );
      },
    });
  }
}
