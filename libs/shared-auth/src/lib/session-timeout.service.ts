import { Injectable, DestroyRef, inject, signal, effect } from '@angular/core';
import { SessionStore } from './session-store.service';
import { SessionTerminationService } from './session-termination.service';

/**
 * Idle/inactivity session timeout.
 *
 * Tracks user activity (mousemove, mousedown, keydown, scroll, touchstart, click)
 * and terminates the session after `SESSION_IDLE_TIMEOUT_MS` milliseconds of
 * inactivity. Any user interaction resets the idle timer.
 *
 * Also exposes a `warning` signal that becomes `true` 1 minute before the idle
 * timeout fires, so the UI can show a "session expiring soon" banner/toast.
 *
 * The timers only run while the user is authenticated (SessionStore.claims() is non-null).
 * On logout, all timers are cleared.
 */

/** Default idle timeout: 5 minutes. */
const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

/** Milliseconds before idle timeout to trigger the warning signal. */
const WARNING_LEAD_MS = 60_000;

/** Minimum interval between activity resets (avoids thrashing on mousemove). */
const RESET_THROTTLE_MS = 10_000;

const ACTIVITY_EVENTS: readonly string[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

@Injectable({ providedIn: 'root' })
export class SessionTimeoutService {
  private readonly session = inject(SessionStore);
  private readonly termination = inject(SessionTerminationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly warning = signal(false);
  private started = false;

  private idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS;
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private warningTimer: ReturnType<typeof setTimeout> | undefined;
  private lastResetAt = 0;
  private activityBound = false;

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    // React to authentication state changes.
    effect(() => {
      const claims = this.session.claims();
      if (claims) {
        this.bindActivityListeners();
        this.resetIdleTimer();
      } else {
        this.unbindActivityListeners();
        this.clearTimers();
      }
    });
  }

  /** Allow overriding the idle timeout (e.g., from environment config). */
  setIdleTimeout(ms: number): void {
    this.idleTimeoutMs = ms > 0 ? ms : DEFAULT_IDLE_TIMEOUT_MS;
    if (this.session.claims()) {
      this.resetIdleTimer();
    }
  }

  private onActivity = (): void => {
    const now = Date.now();
    // Throttle: only reset if at least RESET_THROTTLE_MS since last reset.
    // This prevents excessive timer resets on continuous mousemove.
    if (now - this.lastResetAt < RESET_THROTTLE_MS) {
      return;
    }
    this.resetIdleTimer();
  };

  private resetIdleTimer(): void {
    this.clearTimers();
    this.lastResetAt = Date.now();

    const warningDelay = this.idleTimeoutMs - WARNING_LEAD_MS;

    if (warningDelay > 0) {
      this.warningTimer = setTimeout(() => {
        this.warning.set(true);
      }, warningDelay);
    } else {
      // Idle timeout is shorter than the warning lead — warn immediately.
      this.warning.set(true);
    }

    this.idleTimer = setTimeout(() => {
      this.terminate();
    }, this.idleTimeoutMs);
  }

  private terminate(): void {
    this.clearTimers();
    this.termination.terminate('SESSION_EXPIRED');
  }

  private clearTimers(): void {
    if (this.warningTimer !== undefined) {
      clearTimeout(this.warningTimer);
      this.warningTimer = undefined;
    }
    if (this.idleTimer !== undefined) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
    this.warning.set(false);
  }

  private bindActivityListeners(): void {
    if (this.activityBound) {
      return;
    }
    this.activityBound = true;
    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, this.onActivity, { passive: true });
    }
  }

  private unbindActivityListeners(): void {
    if (!this.activityBound) {
      return;
    }
    this.activityBound = false;
    for (const evt of ACTIVITY_EVENTS) {
      window.removeEventListener(evt, this.onActivity);
    }
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.unbindActivityListeners();
      this.clearTimers();
    });
  }
}
