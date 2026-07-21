import {
  createContext, useState, useEffect, useCallback,
} from 'react';
import * as authApi from '../api/auth';
import {
  setTokens, clearTokens, getRefreshToken, setOnAuthFailure, ensureFreshToken,
} from '../api/client';
import { socket, connectSocket, disconnectSocket } from '../socket/socketClient';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authed | anon

  const applyAuth = useCallback((data) => {
    setTokens(data);
    setUser(data.user);
    setStatus('authed');
    connectSocket();
  }, []);

  const signOut = useCallback(async () => {
    await authApi.logout();
    disconnectSocket();
    setUser(null);
    setStatus('anon');
  }, []);

  // Account is already gone server-side, so skip the best-effort /logout call.
  const deleteAccount = useCallback(() => {
    clearTokens();
    disconnectSocket();
    setUser(null);
    setStatus('anon');
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  // Restore the session on load: a stored refresh token mints a fresh access token via /me.
  useEffect(() => {
    let active = true;
    setOnAuthFailure(() => {
      if (!active) return;
      disconnectSocket();
      setUser(null);
      setStatus('anon');
    });
    (async () => {
      if (!getRefreshToken()) { setStatus('anon'); return; }
      try {
        const { user: me } = await authApi.me();
        if (!active) return;
        setUser(me);
        setStatus('authed');
        connectSocket();
      } catch {
        if (active) setStatus('anon');
      }
    })();
    return () => { active = false; };
  }, []);

  // Recover the realtime socket after idle. Browsers drop the connection when the tab sleeps,
  // and socket.io's own reconnect sends the now-expired token, which the server rejects for good
  // (connect_error with socket.active === false, no further retries). So live updates silently
  // die until a refresh. Here we mint a fresh token first, then reconnect — on tab focus and on a
  // rejected reconnect — so rooms re-subscribe without a manual page reload.
  useEffect(() => {
    if (status !== 'authed') return undefined;
    const revive = async () => {
      if (socket.connected) return;
      if (await ensureFreshToken()) connectSocket();
    };
    const onVisible = () => { if (document.visibilityState === 'visible') revive(); };
    const onConnectError = () => { if (!socket.active) revive(); };
    document.addEventListener('visibilitychange', onVisible);
    socket.on('connect_error', onConnectError);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      socket.off('connect_error', onConnectError);
    };
  }, [status]);

  const login = useCallback(async (email, password) => {
    applyAuth(await authApi.login(email, password));
  }, [applyAuth]);

  // Registration no longer logs in — the account is unverified until the emailed link is used.
  const register = useCallback(
    (email, password, name) => authApi.register(email, password, name),
    [],
  );

  return (
    <AuthContext.Provider value={{
      user, status, login, register, signOut, updateUser, deleteAccount,
    }}
    >
      {children}
    </AuthContext.Provider>
  );
}
