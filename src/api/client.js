// Thin fetch wrapper: base URL, Bearer auth, and transparent one-shot token refresh on 401.
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const REFRESH_KEY = 'wtp_refresh';
// A request that never settles (e.g. a connection gone stale over a long idle) would leave
// autosave stuck on "Saving…" forever, so every request is bounded by this timeout.
const REQUEST_TIMEOUT_MS = 20000;

let accessToken = null;
let onAuthFailure = null;
let refreshing = null;

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
export const setOnAuthFailure = (cb) => { onAuthFailure = cb; };

export function setTokens({ accessToken: at, refreshToken: rt }) {
  accessToken = at;
  if (rt) localStorage.setItem(REFRESH_KEY, rt);
}

export function clearTokens() {
  accessToken = null;
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// fetch with a hard timeout: aborts (rejects) rather than hanging indefinitely.
function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

function rawFetch(path, { method = 'GET', body, auth = true } = {}) {
  // FormData sets its own multipart Content-Type (with boundary) — don't override it.
  const isForm = body instanceof FormData;
  const headers = isForm ? {} : { 'Content-Type': 'application/json' };
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  let payload;
  if (body !== undefined) payload = isForm ? body : JSON.stringify(body);
  return fetchWithTimeout(BASE + path, { method, headers, body: payload });
}

// Refresh the access token once; concurrent callers share a single in-flight request.
// Only a real server rejection (401, or no token to begin with) clears the session — a
// network error or timeout (e.g. a cold-starting backend after a long idle) is transient, so
// the refresh token is kept and a retry/reload can still restore the session.
function refreshTokens() {
  if (!refreshing) {
    refreshing = (async () => {
      const rt = getRefreshToken();
      if (!rt) {
        clearTokens();
        if (onAuthFailure) onAuthFailure();
        throw new Error('No refresh token');
      }
      const res = await fetchWithTimeout(BASE + '/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (res.status === 401) {
        clearTokens();
        if (onAuthFailure) onAuthFailure();
        throw new Error('Refresh token rejected');
      }
      if (!res.ok) throw new Error('Refresh failed'); // 5xx etc. — transient, keep the token
      const data = await res.json();
      setTokens(data);
      return data.accessToken;
    })().finally(() => { refreshing = null; });
  }
  return refreshing;
}

// Proactively mint a fresh access token (e.g. before reconnecting the socket after idle).
// Resolves true on success, false on failure — never throws, so callers can guard on it.
export async function ensureFreshToken() {
  try {
    await refreshTokens();
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch(path, options = {}) {
  let res = await rawFetch(path, options);
  if (res.status === 401 && options.auth !== false) {
    await refreshTokens();
    res = await rawFetch(path, options);
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error || 'Request failed', res.status, data?.code);
  return data;
}

// Files sit behind Bearer auth, so they can't be loaded via a plain <img src>.
export async function apiFetchBlob(path) {
  let res = await rawFetch(path);
  if (res.status === 401) {
    await refreshTokens();
    res = await rawFetch(path);
  }
  if (!res.ok) throw new ApiError('Request failed', res.status);
  return res.blob();
}
