import { TestBed } from '@angular/core/testing';
import { SessionStore } from './session-store.service';

describe('SessionStore', () => {
  let service: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SessionStore] });
    service = TestBed.inject(SessionStore);
  });

  it('stores and clears token values', () => {
    service.setUserToken('user-token');
    expect(service.userToken()).toBe('user-token');
    service.clear();
    expect(service.userToken()).toBeNull();
  });

  it('registra claimsValidatedAt al hidratar claims', () => {
    service.setClaims({ role: 'customer' });
    const at = service.claimsValidatedAt();
    expect(at).toBeGreaterThan(0);
    service.setClaims(null);
    expect(service.claimsValidatedAt()).toBeNull();
  });
});

