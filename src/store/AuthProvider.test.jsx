import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { useContext } from 'react';
import { render, waitFor, act } from '../test/utils';
import AuthProvider, { AuthContext } from './AuthProvider';
import * as authApi from '../api/auth';
import { setTokens, clearTokens, REFRESH_KEY } from '../api/client';

vi.mock('../api/auth', () => ({
  me: vi.fn(),
  login: vi.fn(),
  demoLogin: vi.fn(),
  register: vi.fn(),
  logout: vi.fn().mockResolvedValue(),
}));
vi.mock('../socket/socketClient', () => ({
  socket: { connected: false, on: () => {}, off: () => {} },
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

const user = { id: 'u1', name: 'Ada' };

beforeEach(() => {
  clearTokens();
  localStorage.clear();
  vi.mocked(authApi.me).mockReset();
});

async function mountAuth() {
  const seen = {};
  function Probe() {
    seen.ctx = useContext(AuthContext);
    return null;
  }
  render(<AuthProvider><Probe /></AuthProvider>);
  await waitFor(() => expect(seen.ctx.status).not.toBe('loading'));
  return seen;
}

// A `storage` event only fires in the *other* tabs, so firing it by hand is how a second tab's
// write reaches this one.
const fireStorage = (newValue) => act(() => {
  window.dispatchEvent(new StorageEvent('storage', { key: REFRESH_KEY, newValue }));
});

describe('AuthProvider cross-tab sync', () => {
  it('signs this tab out when another tab clears the refresh token', async () => {
    setTokens({ accessToken: 'a1', refreshToken: 'r1' });
    vi.mocked(authApi.me).mockResolvedValue({ user });
    const seen = await mountAuth();
    expect(seen.ctx.status).toBe('authed');

    fireStorage(null);
    await waitFor(() => expect(seen.ctx.status).toBe('anon'));
    expect(seen.ctx.user).toBeNull();
  });

  it('revives an anon tab when another tab signs in', async () => {
    const seen = await mountAuth();
    expect(seen.ctx.status).toBe('anon');

    vi.mocked(authApi.me).mockResolvedValue({ user });
    fireStorage('r1');
    await waitFor(() => expect(seen.ctx.status).toBe('authed'));
    expect(seen.ctx.user).toEqual(user);
  });

  it('leaves an authed tab alone when another tab refreshes its token', async () => {
    setTokens({ accessToken: 'a1', refreshToken: 'r1' });
    vi.mocked(authApi.me).mockResolvedValue({ user });
    const seen = await mountAuth();
    expect(authApi.me).toHaveBeenCalledTimes(1);

    fireStorage('r2');
    expect(seen.ctx.status).toBe('authed');
    expect(authApi.me).toHaveBeenCalledTimes(1);
  });
});
