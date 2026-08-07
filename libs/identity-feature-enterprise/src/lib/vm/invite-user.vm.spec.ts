import { Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InviteUserVm } from './invite-user';

const flushOk = (inviteId = 'inv-1', expiresAt = '2026-09-01T00:00:00Z') =>
  of({ data: { invite_id: inviteId, expires_at: expiresAt }, meta: {}, errors: [] });

/** Shape que mapHttpError reconoce (isHttpErrorLike: status + error + url). */
const httpError = (status: number) => ({ status, error: {}, url: '/api/v1/enterprise/invite-user' });

describe('InviteUserVm', () => {
  let api: { inviteUser: ReturnType<typeof vi.fn> };
  let sessionStore: { claims: ReturnType<typeof vi.fn> };
  let vm: InviteUserVm;

  beforeEach(() => {
    api = { inviteUser: vi.fn().mockReturnValue(flushOk()) };
    sessionStore = { claims: vi.fn().mockReturnValue({ email: 'admin@acme.test' }) };
    vm = new InviteUserVm(api as never, sessionStore as never);
  });

  it('éxito: registra la invitación enviada con referencia y vencimiento', () => {
    vm.submit({ email: 'nuevo@acme.test', role_hint: 'operator' });

    expect(vm.state()).toBe('success');
    const last = vm.lastInvite();
    expect(last?.invite_id).toBe('inv-1');
    expect(last?.email).toBe('nuevo@acme.test');
    expect(last?.role_hint).toBe('operator');
    expect(last?.expires_at).toBe('2026-09-01T00:00:00Z');
    expect(vm.sentLog().map((r) => r.invite_id)).toEqual(['inv-1']);
  });

  it('el registro acumula en orden reciente-primero', () => {
    api.inviteUser
      .mockReturnValueOnce(flushOk('inv-1'))
      .mockReturnValueOnce(flushOk('inv-2'));
    vm.submit({ email: 'uno@acme.test', role_hint: 'operator' });
    vm.reset();
    vm.submit({ email: 'dos@acme.test', role_hint: 'viewer' });

    expect(vm.sentLog().map((r) => r.invite_id)).toEqual(['inv-2', 'inv-1']);
  });

  it('guarda anti auto-invitación: no llama a la API con el propio correo', () => {
    vm.submit({ email: '  ADMIN@acme.test ', role_hint: 'admin' });

    expect(vm.state()).toBe('error');
    expect(vm.errorMessage()).toContain('propio correo');
    expect(api.inviteUser).not.toHaveBeenCalled();
  });

  it('409 → mensaje de email ya registrado', () => {
    api.inviteUser.mockReturnValue(throwError(() => httpError(409)));
    vm.submit({ email: 'dup@acme.test', role_hint: 'viewer' });

    expect(vm.state()).toBe('error');
    expect(vm.errorMessage()).toContain('ya está registrado');
  });

  it('403 → mensaje de permisos', () => {
    api.inviteUser.mockReturnValue(throwError(() => httpError(403)));
    vm.submit({ email: 'x@acme.test', role_hint: 'viewer' });

    expect(vm.errorMessage()).toContain('permiso');
  });

  it('reset() vuelve a idle conservando el registro de enviadas', () => {
    vm.submit({ email: 'nuevo@acme.test', role_hint: 'operator' });
    vm.reset();

    expect(vm.state()).toBe('idle');
    expect(vm.errorMessage()).toBeNull();
    expect(vm.sentLog()).toHaveLength(1);
  });

  it('doble submit mientras submitting es no-op', () => {
    // Observable que nunca emite: el estado queda 'submitting' durante el test.
    api.inviteUser.mockReturnValue(new Observable(() => {}));
    vm.submit({ email: 'a@acme.test', role_hint: 'operator' });
    vm.submit({ email: 'b@acme.test', role_hint: 'operator' });

    expect(api.inviteUser).toHaveBeenCalledTimes(1);
  });
});
