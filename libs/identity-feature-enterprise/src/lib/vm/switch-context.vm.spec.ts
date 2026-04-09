import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { FeatureFlagService } from '@pleniu/shared-auth';

import { SwitchContextVm } from './switch-context';

describe('SwitchContextVm', () => {
  it('no llama al API cuando switchContext está desactivado', () => {
    let apiCalled = false;
    TestBed.configureTestingModule({
      providers: [
        SwitchContextVm,
        {
          provide: FeatureFlagService,
          useValue: { isEnabled: () => false },
        },
        {
          provide: IdentityEnterpriseApiService,
          useValue: {
            switchContext: () => {
              apiCalled = true;
              return of({ data: {} });
            },
          },
        },
      ],
    });
    const vm = TestBed.inject(SwitchContextVm);
    vm.trySwitch();
    expect(apiCalled).toBe(false);
    expect(vm.message()).toBe('Esta función no está disponible.');
  });
});
