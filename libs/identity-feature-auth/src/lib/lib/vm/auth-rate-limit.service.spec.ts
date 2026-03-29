import { TestBed } from '@angular/core/testing';

import { AuthRateLimitService } from './auth-rate-limit.service';

describe('AuthRateLimitService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T10:00:00.000Z'));
    TestBed.configureTestingModule({
      providers: [AuthRateLimitService],
    });
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it('hidrata estado persistido desde sessionStorage', () => {
    sessionStorage.setItem(
      'pleniu_auth_rate_limit',
      JSON.stringify({
        strikeCount: 2,
        blockedUntil: Date.now() + 120_000,
      }),
    );

    const service = TestBed.inject(AuthRateLimitService);

    expect(service.strikeCount()).toBe(2);
    expect(service.isBlocked()).toBe(true);
    expect(service.remainingSeconds()).toBe(120);
  });

  it('calcula el backoff 60, 120, 240 y 300 con cap', () => {
    const service = TestBed.inject(AuthRateLimitService);

    expect(service.register429()).toBe(60);
    expect(service.register429()).toBe(120);
    expect(service.register429()).toBe(240);
    expect(service.register429()).toBe(300);
    expect(service.register429()).toBe(300);
  });

  it('decrementa el countdown y libera el bloqueo sin perder el strike', () => {
    const service = TestBed.inject(AuthRateLimitService);

    service.register429();

    vi.advanceTimersByTime(1_000);
    expect(service.remainingSeconds()).toBe(59);

    vi.advanceTimersByTime(59_000);
    expect(service.isBlocked()).toBe(false);
    expect(service.remainingSeconds()).toBe(0);
    expect(service.strikeCount()).toBe(1);
  });

  it('resetea el streak y reinicia el cooldown base', () => {
    const service = TestBed.inject(AuthRateLimitService);

    service.register429();
    service.register429();
    service.reset();

    expect(service.strikeCount()).toBe(0);
    expect(service.isBlocked()).toBe(false);
    expect(service.register429()).toBe(60);
  });
});
