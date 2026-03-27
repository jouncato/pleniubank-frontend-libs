import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignTokens } from './design-tokens';

describe('DesignTokens', () => {
  let component: DesignTokens;
  let fixture: ComponentFixture<DesignTokens>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignTokens]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesignTokens);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
