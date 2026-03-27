import { TestBed } from '@angular/core/testing';

import { SessionStore } from './session-store.service';

describe('SessionStore', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('persiste user y admin en keys distintas', () => {
    TestBed.configureTestingModule({});
    const store = TestBed.inject(SessionStore);
    store.setUserToken('user-jwt');
    store.setAdminToken('admin-jwt');
    expect(sessionStorage.getItem('pleniu_user_token')).toBe('user-jwt');
    expect(sessionStorage.getItem('pleniu_admin_token')).toBe('admin-jwt');
  });

  it('clear elimina tokens del sessionStorage', () => {
    TestBed.configureTestingModule({});
    const store = TestBed.inject(SessionStore);
    store.setUserToken('u');
    store.setAdminToken('a');
    store.setRefreshToken('r');
    store.clear();
    expect(sessionStorage.getItem('pleniu_user_token')).toBeNull();
    expect(sessionStorage.getItem('pleniu_admin_token')).toBeNull();
    expect(sessionStorage.getItem('pleniu_refresh_token')).toBeNull();
  });
});
