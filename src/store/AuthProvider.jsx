import {
  createContext, useState, useEffect, useCallback,
} from 'react';
import * as authApi from '../api/auth';
import { setTokens, getRefreshToken, setOnAuthFailure } from '../api/client';
import { connectSocket, disconnectSocket } from '../socket/socketClient';

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

  const login = useCallback(async (email, password) => {
    applyAuth(await authApi.login(email, password));
  }, [applyAuth]);

  const register = useCallback(async (email, password, name) => {
    applyAuth(await authApi.register(email, password, name));
  }, [applyAuth]);

  return (
    <AuthContext.Provider value={{
      user, status, login, register, signOut,
    }}
    >
      {children}
    </AuthContext.Provider>
  );
}
