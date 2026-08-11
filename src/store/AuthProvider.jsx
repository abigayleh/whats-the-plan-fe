import {
  createContext, useState, useEffect, useCallback,
} from 'react';
import * as authApi from '../api/auth';
import {
  setTokens, clearTokens, getRefreshToken, setOnAuthFailure, ensureFreshToken, REFRESH_KEY,
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

  const dropSession = useCallback(() => {
    disconnectSocket();
    setUser(null);
    setStatus('anon');
  }, []);

  const signOut = useCallback(async () => {
    await authApi.logout();
    dropSession();
  }, [dropSession]);

  // Account is already gone server-side, so skip the best-effort /logout call.
  const deleteAccount = useCallback(() => {
    clearTokens();
    dropSession();
  }, [dropSession]);

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  // Restore the session on load: a stored refresh token mints a fresh access token via /me.
  useEffect(() => {
    let active = true;
    setOnAuthFailure(() => { if (active) dropSession(); });
    (async () => {
      if (!getRefreshToken()) { setStatus('anon'); return; }
      // A backend that's cold after a long idle can make the first request(s) time out. Only a
      // rejected refresh token (which clears it) really means logged-out — retry through the
      // transient failures so a slow wake-up doesn't drop an otherwise-valid session.
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          const { user: me } = await authApi.me();
          if (!active) return;
          setUser(me);
          setStatus('authed');
          connectSocket();
          return;
        } catch {
          if (!active) return;
          if (!getRefreshToken()) { setStatus('anon'); return; } // token rejected — truly logged out
          await new Promise((resolve) => { setTimeout(resolve, 2000); });
        }
      }
      // Gave up for now, but the refresh token is preserved so the next load can recover.
      if (active) setStatus('anon');
    })();
    return () => { active = false; };
  }, [dropSession]);

  // Tabs share one refresh token, so keep them in step: signing out in one tab signs the rest
  // out, and signing in revives a tab that had dropped to anon rather than stranding it.
  useEffect(() => {
    const onStorage = async (e) => {
      if (e.key !== REFRESH_KEY) return;
      if (!e.newValue) { dropSession(); return; }
      if (status !== 'anon') return; // already signed in, or the initial restore has it covered
      try {
        const { user: me } = await authApi.me();
        setUser(me);
        setStatus('authed');
        connectSocket();
      } catch { /* leave this tab anon; a reload can still recover it */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [status, dropSession]);

  // Recover the realtime socket after idle. Browsers drop the connection when the tab sleeps,
  // and socket.io's own reconnect sends the now-expired token, which the server rejects. It
  // keeps retrying with that same dead token — so minting a fresh one is the only thing that
  // breaks the loop, and it has to happen whether or not socket.io has given up (socket.active).
  // Waiting for it to give up left live updates silently dead until a manual page reload.
  useEffect(() => {
    if (status !== 'authed') return undefined;
    let lastAttempt = 0;
    const revive = async () => {
      // Retries arrive in bursts; one refresh every few seconds is enough to unstick them.
      if (socket.connected || Date.now() - lastAttempt < 5000) return;
      lastAttempt = Date.now();
      if (await ensureFreshToken()) connectSocket();
    };
    const onVisible = () => { if (document.visibilityState === 'visible') revive(); };
    document.addEventListener('visibilitychange', onVisible);
    socket.on('connect_error', revive);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      socket.off('connect_error', revive);
    };
  }, [status]);

  const login = useCallback(async (email, password) => {
    applyAuth(await authApi.login(email, password));
  }, [applyAuth]);

  const demoLogin = useCallback(async () => {
    applyAuth(await authApi.demoLogin());
  }, [applyAuth]);

  // Registration no longer logs in — the account is unverified until the emailed link is used.
  const register = useCallback(
    (email, password, name) => authApi.register(email, password, name),
    [],
  );

  return (
    <AuthContext.Provider value={{
      user, status, login, demoLogin, register, signOut, updateUser, deleteAccount,
    }}
    >
      {children}
    </AuthContext.Provider>
  );
}
