import { apiFetch, clearTokens, getRefreshToken } from './client';

export const register = (email, password, name) =>
  apiFetch('/api/auth/register', { method: 'POST', auth: false, body: { email, password, name } });

export const login = (email, password) =>
  apiFetch('/api/auth/login', { method: 'POST', auth: false, body: { email, password } });

export const me = () => apiFetch('/api/auth/me');

export async function logout() {
  const refreshToken = getRefreshToken();
  try {
    await apiFetch('/api/auth/logout', { method: 'POST', auth: false, body: { refreshToken } });
  } catch {
    // best-effort; clear locally regardless
  }
  clearTokens();
}
