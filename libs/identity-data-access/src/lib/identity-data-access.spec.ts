import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { API_CONFIG } from 'shared-http';
import { IdentityAuthApiService } from './identity-data-access';

describe('IdentityAuthApiService', () => {
  it('should be created', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        IdentityAuthApiService,
        {
          provide: API_CONFIG,
          useValue: { identityBaseUrl: 'http://localhost:8082', coreBaseUrl: 'http://localhost:8000' },
        },
      ],
    });
    expect(TestBed.inject(IdentityAuthApiService)).toBeTruthy();
  });
});
