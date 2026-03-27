import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { AuthLoginForm } from './auth-login-form';
import { LoginVm } from '../../vm/login';

describe('AuthLoginForm', () => {
  let component: AuthLoginForm;
  let fixture: ComponentFixture<AuthLoginForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLoginForm],
      providers: [
        { provide: LoginVm, useValue: { state: 'idle', errorMessage: null, login: () => {} } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthLoginForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
