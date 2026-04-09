import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityAuthApiService } from '@pleniu/identity-data-access';
import { SessionStore } from '@pleniu/shared-auth';

@Injectable({
  providedIn: 'root',
})
export class SessionVm {
  constructor(
    private readonly identityApi: IdentityAuthApiService,
    private readonly sessionStore: SessionStore,
    private readonly router: Router,
  ) {}

  logout(): void {
    this.identityApi.logout().subscribe({
      next: () => this.clearAndRedirect(),
      error: () => this.clearAndRedirect(),
    });
  }

  private clearAndRedirect(): void {
    this.sessionStore.clear();
    void this.router.navigate(['/onboarding/party/access/login']);
  }
}

