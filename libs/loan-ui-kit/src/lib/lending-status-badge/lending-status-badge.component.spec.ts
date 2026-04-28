import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { LendingStatus } from '@pleniu/loan-domain';
import { LendingStatusBadgeComponent } from './lending-status-badge.component';

@Component({
  standalone: true,
  imports: [LendingStatusBadgeComponent],
  template: `<pleniu-lending-status-badge [status]="status" />`,
})
class TestHostComponent {
  status: LendingStatus = LendingStatus.Active;
}

describe('LendingStatusBadgeComponent', () => {
  function setup(status: LendingStatus) {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.status = status;
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHostComponent] }));

  it('renders "Activo" with badge-success for Active', () => {
    const f = setup(LendingStatus.Active);
    const badge = f.nativeElement.querySelector('.badge') as HTMLElement;
    expect(badge.classList).toContain('badge-success');
    expect(badge.textContent?.trim()).toContain('Activo');
    expect(badge.getAttribute('aria-label')).toBe('Activo');
  });

  it('renders badge-muted for Draft', () => {
    const f = setup(LendingStatus.Draft);
    expect(f.nativeElement.querySelector('.badge-muted')).toBeTruthy();
  });

  it('renders badge-warning for Suspended', () => {
    const f = setup(LendingStatus.Suspended);
    expect(f.nativeElement.querySelector('.badge-warning')).toBeTruthy();
  });

  it('renders badge-neutral for Closed', () => {
    const f = setup(LendingStatus.Closed);
    expect(f.nativeElement.querySelector('.badge-neutral')).toBeTruthy();
  });

  it('renders badge-danger for Defaulted', () => {
    const f = setup(LendingStatus.Defaulted);
    expect(f.nativeElement.querySelector('.badge-danger')).toBeTruthy();
  });

  it('renders badge-critical for WrittenOff', () => {
    const f = setup(LendingStatus.WrittenOff);
    expect(f.nativeElement.querySelector('.badge-critical')).toBeTruthy();
  });

  it('updates class when status changes (direct component)', () => {
    const f = TestBed.createComponent(LendingStatusBadgeComponent);
    f.componentRef.setInput('status', LendingStatus.Draft);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.badge-muted')).toBeTruthy();
    f.componentRef.setInput('status', LendingStatus.WrittenOff);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.badge-critical')).toBeTruthy();
  });
});
