import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { IdentityAuthApiService } from 'identity-data-access';
import { PORTAL_APP, SessionStore } from 'shared-auth';

import { LoginVm } from './login';

describe('LoginVm', () => {
  let service: LoginVm;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoginVm,
        { provide: Router, useValue: { navigateByUrl: () => Promise.resolve(true) } },
        {
          provide: IdentityAuthApiService,
          useValue: {
            login: () => of({ data: { access_token: 'a', refresh_token: 'r', admin_access_token: null } }),
            validate: () => of({ data: { claims: { role: 'customer' } } }),
          },
        },
        {
          provide: SessionStore,
          useValue: {
            setUserToken: () => {},
            setRefreshToken: () => {},
            setAdminToken: () => {},
            setClaims: () => {},
            clear: () => {},
          },
        },
        { provide: PORTAL_APP, useValue: 'customer' },
      ],
    });
    service = TestBed.inject(LoginVm);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
