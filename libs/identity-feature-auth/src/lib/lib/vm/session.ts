import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityAuthApiService } from '@pleniu/identity-data-access';
import { PORTAL_APP, SessionStore, signInPathForPortal } from '@pleniu/shared-auth';

@Injectable({
  providedIn: 'root',
})
export class SessionVm {
  private readonly identityApi = inject(IdentityAuthApiService);
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly portal = inject(PORTAL_APP);

  logout(): void {
    this.identityApi.logout().subscribe({
      next: () => this.clearAndRedirect(),
      error: () => this.clearAndRedirect(),
    });
  }

  private clearAndRedirect(): void {
    this.sessionStore.clear();
    void this.router.navigate([signInPathForPortal(this.portal)]);
  }
}
