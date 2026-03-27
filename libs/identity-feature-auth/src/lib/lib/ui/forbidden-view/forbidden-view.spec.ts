import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForbiddenView } from './forbidden-view';

describe('ForbiddenView', () => {
  let component: ForbiddenView;
  let fixture: ComponentFixture<ForbiddenView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForbiddenView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForbiddenView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
