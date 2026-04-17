import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';

import { BreadcrumbComponent, breadcrumbFromParam, collectBreadcrumbTrail } from './breadcrumb.component';

@Component({
  imports: [BreadcrumbComponent, RouterOutlet],
  template: `
    <pb-breadcrumbs />
    <router-outlet />
  `,
})
class BreadcrumbHostComponent {}

@Component({
  template: '<p>Dummy</p>',
})
class DummyPageComponent {}

function installMatchMedia(matches: boolean): void {
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: '(min-width: 640px)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('BreadcrumbComponent', () => {
  let fixture: ComponentFixture<BreadcrumbHostComponent>;
  let router: Router;

  async function createHost(matchesMd: boolean): Promise<void> {
    installMatchMedia(matchesMd);

    await TestBed.configureTestingModule({
      imports: [BreadcrumbHostComponent],
      providers: [
        provideRouter([
          {
            path: 'app',
            data: { breadcrumb: 'Dashboard' },
            children: [
              { path: 'dashboard', component: DummyPageComponent, data: { breadcrumb: false } },
              {
                path: 'loans',
                data: { breadcrumb: 'Prestamos' },
                children: [
                  {
                    path: ':loanId',
                    data: { breadcrumb: breadcrumbFromParam('Prestamo', 'loanId') },
                    children: [
                      {
                        path: 'payments',
                        component: DummyPageComponent,
                        data: { breadcrumb: 'Pagos' },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(BreadcrumbHostComponent);
    await router.navigateByUrl('/app/loans/abc123xyz/payments');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('collectBreadcrumbTrail devuelve la misma cadena que pinta el componente', async () => {
    await createHost(true);
    const trail = collectBreadcrumbTrail(router.routerState.snapshot.root);
    expect(trail.map((t) => t.label)).toEqual(['Dashboard', 'Prestamos', 'Prestamo #abc123', 'Pagos']);
  });

  it('renders the full breadcrumb trail on desktop', async () => {
    await createHost(true);

    const host = fixture.nativeElement as HTMLElement;
    const links = Array.from(host.querySelectorAll('.pb-breadcrumbs__link')).map((node) =>
      node.textContent?.trim(),
    );
    const current = host.querySelector('.pb-breadcrumbs__current')?.textContent?.trim();

    expect(host.textContent).toContain('Dashboard');
    expect(host.textContent).toContain('Prestamos');
    expect(host.textContent).toContain('Prestamo #abc123');
    expect(current).toBe('Pagos');
    expect(links).toEqual(['Dashboard', 'Prestamos', 'Prestamo #abc123']);
  });

  it('collapses the trail on mobile and expands it on demand', async () => {
    await createHost(false);

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).not.toContain('Dashboard');
    expect(host.textContent).not.toContain('Prestamos');
    expect(host.textContent).toContain('Prestamo #abc123');
    expect(host.textContent).toContain('Pagos');

    const toggle = host.querySelector('.pb-breadcrumbs__toggle') as HTMLButtonElement | null;
    expect(toggle?.textContent?.trim()).toBe('...');
    toggle?.click();
    fixture.detectChanges();

    expect(host.textContent).toContain('Dashboard');
    expect(host.textContent).toContain('Prestamos');
  });
});
