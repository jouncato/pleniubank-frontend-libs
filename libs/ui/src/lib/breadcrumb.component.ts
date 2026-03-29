import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Event,
  NavigationEnd,
  NavigationSkipped,
  PRIMARY_OUTLET,
  Router,
  RouterLink,
} from '@angular/router';
import { Subscription } from 'rxjs';

import { PleniuBreakpointObserver } from './breakpoint-observer.service';

export type BreadcrumbResolver = (route: ActivatedRouteSnapshot) => string | null;
export type BreadcrumbValue = string | BreadcrumbResolver | false | null | undefined;

interface BreadcrumbViewModel {
  label: string;
  url: string;
  isCurrent: boolean;
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
      color: #667085;
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
      color: #98a2b3;
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
      color: #0b63b6;
      text-decoration: none;
      font-weight: 600;
    }

    .pb-breadcrumbs__current {
      color: #101828;
      font-weight: 700;
    }

    .pb-breadcrumbs__toggle {
      border: 0;
      padding: 0.35rem 0.7rem;
      background: #f2f4f7;
      color: #344054;
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
export class BreadcrumbComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly bp = inject(PleniuBreakpointObserver);
  private readonly eventsSubscription: Subscription;

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
    this.eventsSubscription = this.router.events.subscribe((event) => {
      if (this.isNavigationBoundary(event)) {
        this.mobileExpanded.set(false);
        this.refresh();
      }
    });
  }

  ngOnDestroy(): void {
    this.eventsSubscription.unsubscribe();
  }

  protected toggleMobileExpanded(): void {
    this.mobileExpanded.update((current) => !current);
  }

  private refresh(): void {
    const items = this.buildBreadcrumbs(this.router.routerState.snapshot.root);
    this.items.set(items.map((item, index) => ({ ...item, isCurrent: index === items.length - 1 })));
  }

  private buildBreadcrumbs(
    route: ActivatedRouteSnapshot,
    parentUrl = '',
    items: Omit<BreadcrumbViewModel, 'isCurrent'>[] = [],
  ): Omit<BreadcrumbViewModel, 'isCurrent'>[] {
    for (const child of route.children) {
      if (child.outlet !== PRIMARY_OUTLET) {
        continue;
      }

      const routeUrl = child.url.map((segment) => segment.path).join('/');
      const nextUrl = routeUrl ? `${parentUrl}/${routeUrl}` : parentUrl;
      const label = this.resolveLabel(child);
      if (label) {
        items.push({ label, url: nextUrl || '/' });
      }

      this.buildBreadcrumbs(child, nextUrl, items);
    }

    return items;
  }

  private resolveLabel(route: ActivatedRouteSnapshot): string | null {
    const value = route.data['breadcrumb'] as BreadcrumbValue;
    if (value === false || value === undefined || value === null) {
      return null;
    }

    const resolved = typeof value === 'function' ? value(route) : value;
    const normalized = resolved?.trim();
    return normalized ? normalized : null;
  }

  private isNavigationBoundary(event: Event): event is NavigationEnd | NavigationSkipped {
    return event instanceof NavigationEnd || event instanceof NavigationSkipped;
  }
}
