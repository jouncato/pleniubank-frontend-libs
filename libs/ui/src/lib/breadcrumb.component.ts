import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Event,
  NavigationEnd,
  NavigationSkipped,
  PRIMARY_OUTLET,
  Router,
  RouterLink,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PleniuBreakpointObserver } from './breakpoint-observer.service';

export type BreadcrumbResolver = (route: ActivatedRouteSnapshot) => string | null;
export type BreadcrumbValue = string | BreadcrumbResolver | false | null | undefined;

interface BreadcrumbViewModel {
  label: string;
  url: string;
  isCurrent: boolean;
}

/** Entradas de miga sin `isCurrent` (útil p. ej. para «volver al padre» en shells de portal). */
export type BreadcrumbTrailItem = Omit<BreadcrumbViewModel, 'isCurrent'>;

function resolveBreadcrumbLabel(route: ActivatedRouteSnapshot): string | null {
  const value = route.data['breadcrumb'] as BreadcrumbValue;
  if (value === false || value === undefined || value === null) {
    return null;
  }

  const resolved = typeof value === 'function' ? value(route) : value;
  const normalized = resolved?.trim();
  return normalized ? normalized : null;
}

/**
 * Recorre el árbol de rutas activas y devuelve la cadena de migas (misma lógica que {@link BreadcrumbComponent}).
 */
export function collectBreadcrumbTrail(
  route: ActivatedRouteSnapshot,
  parentUrl = '',
  items: BreadcrumbTrailItem[] = [],
): BreadcrumbTrailItem[] {
  for (const child of route.children) {
    if (child.outlet !== PRIMARY_OUTLET) {
      continue;
    }

    const routeUrl = child.url.map((segment) => segment.path).join('/');
    const nextUrl = routeUrl ? `${parentUrl}/${routeUrl}` : parentUrl;
    const label = resolveBreadcrumbLabel(child);
    if (label) {
      items.push({ label, url: nextUrl || '/' });
    }

    collectBreadcrumbTrail(child, nextUrl, items);
  }

  return items;
}

/**
 * Helper para labels dinamicos como `Prestamo #abc123`.
 */
export function breadcrumbFromParam(
  label: string,
  paramName: string,
  maxLength = 6,
): BreadcrumbResolver {
  return (route) => {
    const rawValue = route.paramMap.get(paramName)?.trim();
    if (!rawValue) {
      return label;
    }

    return `${label} #${truncateBreadcrumbValue(rawValue, maxLength)}`;
  };
}

export function truncateBreadcrumbValue(value: string, maxLength = 6): string {
  if (maxLength <= 0 || value.length <= maxLength) {
    return value;
  }

  return value.slice(0, maxLength);
}

@Component({
  selector: 'pb-breadcrumbs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (items().length) {
      <nav class="pb-breadcrumbs" aria-label="breadcrumb">
        <ol class="pb-breadcrumbs__list">
          @if (hiddenCount() > 0) {
            <li class="pb-breadcrumbs__item pb-breadcrumbs__item--toggle">
              <button
                type="button"
                class="pb-breadcrumbs__toggle"
                [attr.aria-expanded]="mobileExpanded()"
                [attr.aria-label]="
                  mobileExpanded() ? 'Ocultar breadcrumbs completos' : 'Mostrar breadcrumbs completos'
                "
                (click)="toggleMobileExpanded()"
              >
                {{ mobileExpanded() ? 'Ocultar' : '...' }}
              </button>
            </li>
          }

          @for (item of visibleItems(); track item.url + item.label) {
            <li class="pb-breadcrumbs__item">
              @if (item.isCurrent) {
                <span class="pb-breadcrumbs__current" aria-current="page">{{ item.label }}</span>
              } @else {
                <a class="pb-breadcrumbs__link" [routerLink]="item.url">{{ item.label }}</a>
              }
            </li>
          }
        </ol>
      </nav>
    }
  `,
  styles: `
    .pb-breadcrumbs {
      padding: 0.75rem 1rem 0;
    }

    .pb-breadcrumbs__list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.45rem;
      margin: 0;
      padding: 0;
      list-style: none;
      color: var(--pb-breadcrumbs-list-color, #667085);
      font-size: 0.95rem;
    }

    .pb-breadcrumbs__item {
      display: inline-flex;
      align-items: center;
      min-width: 0;
      gap: 0.45rem;
    }

    .pb-breadcrumbs__item::before {
      content: '/';
      color: var(--pb-breadcrumb-sep, #98a2b3);
    }

    .pb-breadcrumbs__item:first-child::before,
    .pb-breadcrumbs__item--toggle::before {
      content: none;
    }

    .pb-breadcrumbs__link,
    .pb-breadcrumbs__current,
    .pb-breadcrumbs__toggle {
      display: inline-flex;
      align-items: center;
      min-width: 0;
      border-radius: 999px;
      line-height: 1.4;
    }

    .pb-breadcrumbs__link,
    .pb-breadcrumbs__current {
      max-width: min(100%, 24rem);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pb-breadcrumbs__link {
      color: var(--pb-breadcrumb-link, #0b63b6);
      text-decoration: none;
      font-weight: 600;
    }

    .pb-breadcrumbs__current {
      color: var(--pb-breadcrumb-current, #101828);
      font-weight: 700;
    }

    .pb-breadcrumbs__toggle {
      border: 0;
      padding: 0.35rem 0.7rem;
      background: var(--pb-breadcrumb-toggle-bg, #f2f4f7);
      color: var(--pb-breadcrumb-toggle-fg, #344054);
      font-weight: 700;
      cursor: pointer;
    }

    @media (min-width: 640px) {
      .pb-breadcrumbs {
        padding: 0.9rem 1rem 0;
      }
    }
  `,
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);
  private readonly bp = inject(PleniuBreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly items = signal<BreadcrumbViewModel[]>([]);
  protected readonly mobileExpanded = signal(false);
  protected readonly hiddenCount = computed(() => {
    if (this.bp.matchesMd() || this.mobileExpanded()) {
      return 0;
    }

    return Math.max(this.items().length - 2, 0);
  });
  protected readonly visibleItems = computed(() => {
    const items = this.items();
    if (this.bp.matchesMd() || this.mobileExpanded() || items.length <= 2) {
      return items;
    }

    return items.slice(-2);
  });

  constructor() {
    this.refresh();
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (this.isNavigationBoundary(event)) {
        this.mobileExpanded.set(false);
        this.refresh();
      }
    });
  }

  protected toggleMobileExpanded(): void {
    this.mobileExpanded.update((current) => !current);
  }

  private refresh(): void {
    const items = collectBreadcrumbTrail(this.router.routerState.snapshot.root);
    this.items.set(items.map((item, index) => ({ ...item, isCurrent: index === items.length - 1 })));
  }

  private isNavigationBoundary(event: Event): event is NavigationEnd | NavigationSkipped {
    return event instanceof NavigationEnd || event instanceof NavigationSkipped;
  }
}
