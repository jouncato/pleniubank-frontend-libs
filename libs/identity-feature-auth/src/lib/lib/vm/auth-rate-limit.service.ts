import { Injectable, computed, signal } from '@angular/core';

const AUTH_RATE_LIMIT_STORAGE_KEY = 'pleniu_auth_rate_limit';
const BASE_COOLDOWN_SECONDS = 60;
const MAX_COOLDOWN_SECONDS = 300;
const TICK_INTERVAL_MS = 1000;

interface PersistedAuthRateLimitState {
  strikeCount: number;
  blockedUntil: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthRateLimitService {
  private readonly _strikeCount = signal(0);
  private readonly _blockedUntil = signal<number | null>(null);
  private readonly _now = signal(Date.now());
  private tickHandle: ReturnType<typeof setInterval> | null = null;

  readonly strikeCount = computed(() => this._strikeCount());
  readonly remainingSeconds = computed(() => {
    const blockedUntil = this._blockedUntil();
    const now = this._now();
    if (!blockedUntil) {
      return 0;
    }
    return Math.max(0, Math.ceil((blockedUntil - now) / 1000));
  });
  readonly isBlocked = computed(() => this.remainingSeconds() > 0);
  readonly message = computed(() => {
    const remainingSeconds = this.remainingSeconds();
    if (remainingSeconds === 0) {
      return null;
    }
    const unit = remainingSeconds === 1 ? 'segundo' : 'segundos';
    return `Demasiados intentos. Espera ${remainingSeconds} ${unit}.`;
  });

  constructor() {
    this.hydrate();
  }

  register429(): number {
    const strikeCount = this._strikeCount() + 1;
    const cooldownSeconds = Math.min(
      BASE_COOLDOWN_SECONDS * 2 ** (strikeCount - 1),
      MAX_COOLDOWN_SECONDS,
    );

    this._now.set(Date.now());
    this._strikeCount.set(strikeCount);
    this._blockedUntil.set(this._now() + cooldownSeconds * 1000);
    this.persist();
    this.startTimer();

    return cooldownSeconds;
  }

  reset(): void {
    this.stopTimer();
    this._now.set(Date.now());
    this._strikeCount.set(0);
    this._blockedUntil.set(null);
    sessionStorage.removeItem(AUTH_RATE_LIMIT_STORAGE_KEY);
  }

  sync(): void {
    this._now.set(Date.now());

    const blockedUntil = this._blockedUntil();
    if (!blockedUntil) {
      this.stopTimer();
      return;
    }

    if (blockedUntil <= this._now()) {
      this._blockedUntil.set(null);
      this.persist();
      this.stopTimer();
      return;
    }

    this.startTimer();
  }

  private hydrate(): void {
    const persistedState = this.readPersistedState();
    if (!persistedState) {
      return;
    }

    this._strikeCount.set(persistedState.strikeCount);
    this._blockedUntil.set(persistedState.blockedUntil);
    this.sync();
  }

  private readPersistedState(): PersistedAuthRateLimitState | null {
    const rawState = sessionStorage.getItem(AUTH_RATE_LIMIT_STORAGE_KEY);
    if (!rawState) {
      return null;
    }

    try {
      const parsedState = JSON.parse(rawState) as Partial<PersistedAuthRateLimitState>;
      const strikeCount = parsedState.strikeCount;
      const blockedUntil = parsedState.blockedUntil;

      if (!Number.isInteger(strikeCount) || (strikeCount ?? 0) < 0) {
        throw new Error('Invalid strikeCount');
      }
      if (blockedUntil !== null && blockedUntil !== undefined && !Number.isFinite(blockedUntil)) {
        throw new Error('Invalid blockedUntil');
      }
      const normalizedStrikeCount = strikeCount ?? 0;

      return {
        strikeCount: normalizedStrikeCount,
        blockedUntil: blockedUntil ?? null,
      };
    } catch {
      sessionStorage.removeItem(AUTH_RATE_LIMIT_STORAGE_KEY);
      return null;
    }
  }

  private persist(): void {
    const strikeCount = this._strikeCount();
    const blockedUntil = this._blockedUntil();

    if (strikeCount === 0 && blockedUntil === null) {
      sessionStorage.removeItem(AUTH_RATE_LIMIT_STORAGE_KEY);
      return;
    }

    const state: PersistedAuthRateLimitState = {
      strikeCount,
      blockedUntil,
    };
    sessionStorage.setItem(AUTH_RATE_LIMIT_STORAGE_KEY, JSON.stringify(state));
  }

  private startTimer(): void {
    if (this.tickHandle !== null || !this._blockedUntil()) {
      return;
    }

    this.tickHandle = setInterval(() => {
      this._now.set(Date.now());

      if (this.remainingSeconds() === 0) {
        this._blockedUntil.set(null);
        this.persist();
        this.stopTimer();
      }
    }, TICK_INTERVAL_MS);
  }

  private stopTimer(): void {
    if (this.tickHandle === null) {
      return;
    }

    clearInterval(this.tickHandle);
    this.tickHandle = null;
  }
}
