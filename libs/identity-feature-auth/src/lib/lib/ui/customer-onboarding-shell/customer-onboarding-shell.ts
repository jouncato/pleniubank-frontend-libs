import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { CUSTOMER_PORTAL_SIGN_IN_URL, EMBEDDED_PORTAL_IDENTITY_CHROME } from '@pleniu/shared-auth';
import { PbLogoComponent } from '@pleniu/ui';

const CUSTOMER_BASE = '/onboarding/party/customer';

type OnbSegment = 'register' | 'verify-contact' | 'verify-email' | 'verify-phone' | 'complete' | 'other';

@Component({
  selector: 'lib-customer-onboarding-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, RouterOutlet, PbLogoComponent],
  templateUrl: './customer-onboarding-shell.html',
  styleUrl: './customer-onboarding-shell.scss',
})
export class CustomerOnboardingShell {
  private readonly router = inject(Router);
  readonly customerSignInUrl = inject(CUSTOMER_PORTAL_SIGN_IN_URL);
  readonly embeddedHostShell = inject(EMBEDDED_PORTAL_IDENTITY_CHROME, { optional: true }) === true;

  readonly steps = [
    { n: 1, label: 'Tus datos' },
    { n: 2, label: 'Verifica tu contacto' },
    { n: 3, label: '¡Bienvenido!' },
  ] as const;

  private readonly urlPath = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.normalizedPath(this.router.url)),
      startWith(this.normalizedPath(this.router.url)),
    ),
    { initialValue: this.normalizedPath(this.router.url) },
  );

  readonly segment = computed(() => this.parseSegment(this.urlPath()));

  /** Paso visual 1–3 (HU-2). */
  readonly activeStep = computed(() => {
    const s = this.segment();
    if (s === 'register') return 1;
    if (s === 'verify-contact' || s === 'verify-email' || s === 'verify-phone') return 2;
    if (s === 'complete') return 3;
    return 1;
  });

  readonly hero = computed(() => {
    const s = this.segment();
    switch (s) {
      case 'register':
        return {
          badge: 'Persona natural',
          title: 'Crea tu cuenta',
          sub: 'Completa tus datos para iniciar el registro seguro. Sin filas, 100% digital.',
        };
      case 'verify-contact':
        return {
          badge: 'Verificación',
          title: 'Verifica tu cuenta',
          sub: 'Te enviamos un código por correo y otro por SMS. Puedes usar cualquiera de los dos.',
        };
      case 'verify-email':
        return {
          badge: 'Verificación',
          title: 'Verifica tu correo',
          sub: 'Ingresa el código de 6 dígitos que enviamos a tu email.',
        };
      case 'verify-phone':
        return {
          badge: 'Verificación',
          title: 'Verifica tu teléfono',
          sub: 'Ingresa el código de 6 dígitos que enviamos por SMS.',
        };
      case 'complete':
        return {
          badge: 'Listo',
          title: '¡Bienvenido!',
          sub: 'Tu cuenta está activa. Inicia sesión en el portal de cliente para continuar.',
        };
      default:
        return {
          badge: 'Persona natural',
          title: 'Crea tu cuenta',
          sub: 'Completa tus datos para iniciar el registro seguro. Sin filas, 100% digital.',
        };
    }
  });

  isStepCurrent(stepN: number): boolean {
    return this.activeStep() === stepN;
  }

  isStepDone(stepN: number): boolean {
    return this.activeStep() > stepN;
  }

  private normalizedPath(raw: string): string {
    return raw.split('?')[0]?.replace(/\/+$/, '') ?? '';
  }

  private parseSegment(path: string): OnbSegment {
    if (!path.includes(`${CUSTOMER_BASE}/`)) {
      return 'other';
    }
    if (path.endsWith(`${CUSTOMER_BASE}/register`)) return 'register';
    if (path.endsWith(`${CUSTOMER_BASE}/verify-contact`)) return 'verify-contact';
    if (path.endsWith(`${CUSTOMER_BASE}/verify-email`)) return 'verify-email';
    if (path.endsWith(`${CUSTOMER_BASE}/verify-phone`)) return 'verify-phone';
    if (path.endsWith(`${CUSTOMER_BASE}/complete`)) return 'complete';
    return 'other';
  }
}
