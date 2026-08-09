import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AUTH_VALIDATE_HANDLER } from './auth-validate.token';
import { PORTAL_APP } from './portal-app.token';
import { SessionStore } from './session-store.service';
import { SessionTerminationService } from './session-termination.service';

const router = { navigate: vi.fn(() => Promise.resolve(true)) };

describe('SessionTerminationService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    router.navigate.mockClear();
    TestBed.configureTestingModule({
      providers: [
        SessionStore,
        SessionTerminationService,
        { provide: AUTH_VALIDATE_HANDLER, useValue: () => of({}) },
        { provide: PORTAL_APP, useValue: 'customer' },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('clears credentials, persists the reason and redirects to login', () => {
    const store = TestBed.inject(SessionStore);
    const service = TestBed.inject(SessionTerminationService);
    store.setUserToken('old-token');

    service.terminate('SESSION_REPLACED', '/app/dashboard');

    expect(store.userToken()).toBeNull();
    expect(store.terminationReason()).toBe('SESSION_REPLACED');
    expect(router.navigate).toHaveBeenCalledWith(
      ['/onboarding/party/access/login'],
      expect.objectContaining({
        queryParams: expect.objectContaining({
          sessionTermination: 'SESSION_REPLACED',
          returnUrl: '/app/dashboard',
        }),
      }),
    );
  });
});
