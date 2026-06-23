import type { WritableSignal } from '@angular/core';

export interface CountdownTimer {
  /** Inicia (o reinicia) la cuenta regresiva desde `seconds`. */
  start(seconds: number): void;
  /** Detiene el timer y limpia el interval. */
  stop(): void;
}

/**
 * Crea un timer de cuenta regresiva que decrementa un `WritableSignal<number>`
 * cada segundo. Llama `onExpire` cuando llega a 0 (si se provee).
 *
 * Uso:
 * ```ts
 * private readonly resendTimer = createCountdownTimer(this.resendSecondsLeft);
 * // ...
 * this.resendTimer.start(60);   // inicia 60s
 * this.resendTimer.stop();      // limpia (en onDestroy)
 * ```
 */
export function createCountdownTimer(
  countSignal: WritableSignal<number>,
  onExpire?: () => void,
): CountdownTimer {
  let handle: ReturnType<typeof setInterval> | null = null;

  function stop(): void {
    if (handle !== null) {
      clearInterval(handle);
      handle = null;
    }
  }

  function start(seconds: number): void {
    stop();
    const capped = Math.max(0, Math.floor(seconds));
    countSignal.set(capped);
    if (capped === 0) {
      onExpire?.();
      return;
    }
    handle = setInterval(() => {
      const left = countSignal() - 1;
      if (left <= 0) {
        countSignal.set(0);
        stop();
        onExpire?.();
      } else {
        countSignal.set(left);
      }
    }, 1000);
  }

  return { start, stop };
}
