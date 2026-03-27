import { Injectable, OnDestroy, signal } from '@angular/core';

/** Alineado a épica X: `sm` &lt; 640px, `md+` desde 640px. */
const QUERY_MIN_MD = '(min-width: 640px)';

/**
 * Wrapper ligero sobre `matchMedia` (sin Angular CDK).
 * Piloto para layouts responsive (épica X-04).
 */
@Injectable({ providedIn: 'root' })
export class PleniuBreakpointObserver implements OnDestroy {
  private readonly _matchesMd = signal(false);
  readonly matchesMd = this._matchesMd.asReadonly();

  private mq?: MediaQueryList;
  private readonly boundListener = (): void => {
    if (this.mq) {
      this._matchesMd.set(this.mq.matches);
    }
  };

  constructor() {
    if (typeof globalThis !== 'undefined' && globalThis.matchMedia) {
      this.mq = globalThis.matchMedia(QUERY_MIN_MD);
      this._matchesMd.set(this.mq.matches);
      this.mq.addEventListener('change', this.boundListener);
    }
  }

  ngOnDestroy(): void {
    this.mq?.removeEventListener('change', this.boundListener);
  }
}
