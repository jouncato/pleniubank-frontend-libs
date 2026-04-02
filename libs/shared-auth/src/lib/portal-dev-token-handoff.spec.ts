import {
  DEV_PORTAL_TOKEN_HANDOFF_KEY,
  consumeDevPortalTokenHandoff,
  stashDevPortalTokenHandoff,
} from './portal-dev-token-handoff';

describe('portal-dev-token-handoff', () => {
  beforeEach(() => {
    localStorage.removeItem(DEV_PORTAL_TOKEN_HANDOFF_KEY);
  });

  it('stash + consume devuelve tokens y vacía la clave', () => {
    stashDevPortalTokenHandoff('at', 'rt');
    const got = consumeDevPortalTokenHandoff(60_000);
    expect(got).toEqual({ access_token: 'at', refresh_token: 'rt' });
    expect(localStorage.getItem(DEV_PORTAL_TOKEN_HANDOFF_KEY)).toBeNull();
  });

  it('rechaza payload expirado', () => {
    localStorage.setItem(
      DEV_PORTAL_TOKEN_HANDOFF_KEY,
      JSON.stringify({
        access_token: 'x',
        refresh_token: null,
        ts: Date.now() - 200_000,
      }),
    );
    expect(consumeDevPortalTokenHandoff(60_000)).toBeNull();
  });
});
