import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';

import { ResetPasswordForm } from './reset-password-form';
import { ResetPasswordVm } from '../../vm/reset-password';

describe('ResetPasswordForm', () => {
  let component: ResetPasswordForm;
  let fixture: ComponentFixture<ResetPasswordForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordForm],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({}),
            },
          },
        },
        {
          provide: ResetPasswordVm,
          useValue: {
            state: 'idle',
            errorMessage: null,
            successMessage: null,
            submit: () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
