import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IdentityAuthApiService } from 'identity-data-access';
import { SessionStore } from 'shared-auth';
import { of, throwError } from 'rxjs';

import { SessionVm } from './session';

describe('SessionVm', () => {
  let service: SessionVm;
  let identityApi: IdentityAuthApiService;
  let sessionStore: SessionStore;
  let cleared = false;
  let failLogout = false;

  beforeEach(() => {
    cleared = false;
    failLogout = false;
    identityApi = {
      logout: () => (failLogout ? throwError(() => new Error('network')) : of({})),
    } as unknown as IdentityAuthApiService;
    sessionStore = {
      clear: () => {
        cleared = true;
      },
    } as unknown as SessionStore;

    TestBed.configureTestingModule({
      providers: [
        SessionVm,
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        { provide: IdentityAuthApiService, useValue: identityApi },
        { provide: SessionStore, useValue: sessionStore },
      ],
    });
    service = TestBed.inject(SessionVm);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('clears local session even when logout request fails', () => {
    failLogout = true;
    service.logout();
    expect(cleared).toBe(true);
  });

  it('clears local session on successful logout', () => {
    service.logout();
    expect(cleared).toBe(true);
  });
});
