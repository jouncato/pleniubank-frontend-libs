import { Injectable, computed, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';

import { API_CONFIG } from '../api-config.token';
import { type CoreDomainEvent, parseCoreWsPayload } from './core-domain-event';

const BACKOFF_MS = [1000, 2000, 4000, 8000, 16000, 30000] as const;

export type CoreWsAuthMode = 'bearer' | 'cookie';

export type CoreWsConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

/**
 * Cliente WebSocket hacia Core `/ws/events` con `?token=` o cookie HttpOnly (mismo sitio).
 * Reconexión con backoff; resync tras reconectar; polling fallback en detalle tras fallos WS.
 */
@Injectable({ providedIn: 'root' })
export class CoreWebSocketEventsService {
  private readonly api = inject(API_CONFIG);

  private readonly _connectionState = signal<CoreWsConnectionState>('idle');
  readonly connectionState = this._connectionState.asReadonly();

  private readonly _pollingFallback = signal(false);
  readonly pollingFallback = this._pollingFallback.asReadonly();

  readonly bannerVisible = computed(() => {
    const s = this._connectionState();
    return s === 'reconnecting' || s === 'connecting' || (s === 'disconnected' && this._hadConnected());
  });

  private readonly _domainEvents = new Subject<CoreDomainEvent>();
  readonly domainEvents$ = this._domainEvents.asObservable();

  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private manualStop = false;
  private connectAttempt = 0;
  private failureStreak = 0;
  private authMode: CoreWsAuthMode | null = null;
  private bearerToken: string | null = null;
  private readonly _hadConnected = signal(false);
  /** Último `occurred_at` de evento de negocio (para resync al reconectar). */
  private lastDomainEventIso: string | null = null;

  /** Conexión con Bearer en query (sesión sessionStorage / token en memoria). */
  connectBearer(accessToken: string): void {
    const token = accessToken.trim();
    if (!token) {
      this.disconnect();
      return;
    }
    if (this.authMode === 'bearer' && this.bearerToken === token && this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    this.manualStop = false;
    this._clearReconnectTimer();
    if (this.ws) {
      this.ws.close(1000, 'auth_change');
      this.ws = null;
    }
    this.authMode = 'bearer';
    this.bearerToken = token;
    this._openSocket();
  }

  /** Conexión sin query; el navegador envía la cookie de acceso si es same-site con Core. */
  connectCookieAuth(): void {
    if (this.authMode === 'cookie' && this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    this.manualStop = false;
    this._clearReconnectTimer();
    if (this.ws) {
      this.ws.close(1000, 'auth_change');
      this.ws = null;
    }
    this.authMode = 'cookie';
    this.bearerToken = null;
    this._openSocket();
  }

  disconnect(): void {
    this.manualStop = true;
    this.authMode = null;
    this.bearerToken = null;
    this._clearReconnectTimer();
    this.failureStreak = 0;
    this.connectAttempt = 0;
    if (this.ws) {
      this.ws.close(1000, 'client_disconnect');
      this.ws = null;
    }
    this._connectionState.set('disconnected');
    this._pollingFallback.set(false);
    this._hadConnected.set(false);
    this.lastDomainEventIso = null;
  }

  private _clearReconnectTimer(): void {
    if (this.reconnectTimer !== undefined) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  private _wsEventsUrl(): string {
    let base = this.api.coreBaseUrl.replace(/\/$/, '');
    if (base.startsWith('https://')) {
      base = 'wss://' + base.slice('https://'.length);
    } else if (base.startsWith('http://')) {
      base = 'ws://' + base.slice('http://'.length);
    }
    return `${base}/ws/events`;
  }

  private _socketUrl(): string {
    const base = this._wsEventsUrl();
    if (this.authMode === 'cookie') {
      return base;
    }
    const token = this.bearerToken?.trim() ?? '';
    if (!token) {
      return base;
    }
    return `${base}?token=${encodeURIComponent(token)}`;
  }

  private _emitDomainEvent(parsed: CoreDomainEvent): void {
    if (parsed.type === 'batch.status_changed' || parsed.type === 'loan.status_changed') {
      const at = parsed.occurred_at?.trim() ?? '';
      if (at) {
        this.lastDomainEventIso = at;
      }
    }
    this._domainEvents.next(parsed);
  }

  private _sendResync(socket: WebSocket): void {
    if (!this.lastDomainEventIso) {
      return;
    }
    try {
      socket.send(JSON.stringify({ type: 'resync', since: this.lastDomainEventIso }));
    } catch {
      /* ignore */
    }
  }

  private _openSocket(): void {
    if (this.manualStop || this.authMode === null) {
      return;
    }
    if (this.authMode === 'bearer' && !this.bearerToken?.trim()) {
      return;
    }
    this._clearReconnectTimer();
    try {
      const url = this._socketUrl();
      const socket = new WebSocket(url);
      this.ws = socket;
      this._connectionState.set(this.connectAttempt > 0 ? 'reconnecting' : 'connecting');

      socket.onopen = () => {
        this.connectAttempt = 0;
        this.failureStreak = 0;
        this._pollingFallback.set(false);
        this._hadConnected.set(true);
        this._connectionState.set('connected');
        this._sendResync(socket);
      };

      socket.onmessage = (event: MessageEvent<string>) => {
        const parsed = parseCoreWsPayload(event.data);
        if (!parsed) {
          return;
        }
        if (parsed.type === 'heartbeat' || parsed.type === 'pong') {
          return;
        }
        this._emitDomainEvent(parsed);
      };

      socket.onerror = () => {
        /* onclose gestiona reconexión */
      };

      socket.onclose = () => {
        this.ws = null;
        if (this.manualStop) {
          this._connectionState.set('disconnected');
          return;
        }
        this.failureStreak++;
        if (this.failureStreak >= 3) {
          this._pollingFallback.set(true);
        }
        this._connectionState.set('reconnecting');
        const idx = Math.min(this.connectAttempt, BACKOFF_MS.length - 1);
        const delay = BACKOFF_MS[idx];
        this.connectAttempt++;
        this.reconnectTimer = setTimeout(() => this._openSocket(), delay);
      };
    } catch {
      this._connectionState.set('reconnecting');
      this.failureStreak++;
      if (this.failureStreak >= 3) {
        this._pollingFallback.set(true);
      }
      const idx = Math.min(this.connectAttempt, BACKOFF_MS.length - 1);
      this.connectAttempt++;
      this.reconnectTimer = setTimeout(() => this._openSocket(), BACKOFF_MS[idx]);
    }
  }
}
