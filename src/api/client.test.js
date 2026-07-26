import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setOnAuthFailure,
  ensureFreshToken,
  apiFetch,
  apiFetchBlob,
  ApiError,
} from './client';

const jsonRes = (status, body = {}) => ({
  status,
  ok: status >= 200 && status < 300,
  json: () => Promise.resolve(body),
  blob: () => Promise.resolve(new Blob([JSON.stringify(body)])),
});

beforeEach(() => {
  clearTokens();
  localStorage.clear();
  setOnAuthFailure(undefined);
  globalThis.fetch = vi.fn();
});

describe('token store', () => {
  it('setTokens keeps the access token in memory and the refresh token in localStorage', () => {
    setTokens({ accessToken: 'a1', refreshToken: 'r1' });
    expect(getAccessToken()).toBe('a1');
    expect(getRefreshToken()).toBe('r1');
    expect(localStorage.getItem('wtp_refresh')).toBe('r1');
  });

  it('setTokens without a refresh token leaves the stored one intact', () => {
    setTokens({ accessToken: 'a1', refreshToken: 'r1' });
    setTokens({ accessToken: 'a2' });
    expect(getAccessToken()).toBe('a2');
    expect(getRefreshToken()).toBe('r1');
  });

  it('clearTokens wipes both', () => {
    setTokens({ accessToken: 'a1', refreshToken: 'r1' });
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});

describe('apiFetch request shape', () => {
  it('attaches a Bearer auth header when a token is set', async () => {
    setTokens({ accessToken: 'tok', refreshToken: 'r' });
    fetch.mockResolvedValueOnce(jsonRes(200, { ok: true }));
    await apiFetch('/api/thing');
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/api/thing');
    expect(opts.headers.Authorization).toBe('Bearer tok');
  });

  it('omits the auth header when no token is set', async () => {
    fetch.mockResolvedValueOnce(jsonRes(200));
    await apiFetch('/api/thing');
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('omits the auth header when auth:false even with a token', async () => {
    setTokens({ accessToken: 'tok', refreshToken: 'r' });
    fetch.mockResolvedValueOnce(jsonRes(200));
    await apiFetch('/api/public', { auth: false });
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('JSON-encodes an object body with a JSON content type', async () => {
    fetch.mockResolvedValueOnce(jsonRes(200, { ok: true }));
    await apiFetch('/api/thing', { method: 'POST', body: { a: 1 } });
    const opts = fetch.mock.calls[0][1];
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(opts.body).toBe(JSON.stringify({ a: 1 }));
  });

  it('leaves FormData untouched and sets no content type', async () => {
    setTokens({ accessToken: 'tok', refreshToken: 'r' });
    const fd = new FormData();
    fetch.mockResolvedValueOnce(jsonRes(200));
    await apiFetch('/api/upload', { method: 'POST', body: fd });
    const opts = fetch.mock.calls[0][1];
    expect(opts.body).toBe(fd);
    expect(opts.headers['Content-Type']).toBeUndefined();
    expect(opts.headers.Authorization).toBe('Bearer tok');
  });
});

describe('apiFetch responses', () => {
  it('returns parsed JSON on success', async () => {
    fetch.mockResolvedValueOnce(jsonRes(200, { hello: 'world' }));
    expect(await apiFetch('/api/thing')).toEqual({ hello: 'world' });
  });

  it('returns null for a 204 without parsing a body', async () => {
    fetch.mockResolvedValueOnce({ status: 204, ok: true, json: () => Promise.reject(new Error('no body')) });
    expect(await apiFetch('/api/thing', { method: 'DELETE' })).toBeNull();
  });

  it('throws an ApiError carrying the server message, status and code', async () => {
    fetch.mockResolvedValueOnce(jsonRes(400, { error: 'Bad input', code: 'VALIDATION' }));
    fetch.mockResolvedValueOnce(jsonRes(400, { error: 'Bad input', code: 'VALIDATION' }));
    await expect(apiFetch('/api/thing')).rejects.toMatchObject({
      message: 'Bad input', status: 400, code: 'VALIDATION',
    });
  });

  it('falls back to a generic message when the error body is unparseable', async () => {
    fetch.mockResolvedValueOnce({ status: 500, ok: false, json: () => Promise.reject(new Error('bad')) });
    await expect(apiFetch('/api/thing')).rejects.toThrow('Request failed');
  });

  it('surfaces the error as an ApiError instance', async () => {
    fetch.mockResolvedValueOnce(jsonRes(404, { error: 'Missing' }));
    const err = await apiFetch('/api/thing').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
  });
});

describe('apiFetch 401 -> refresh -> retry', () => {
  it('refreshes on 401 then retries with the new token and returns the retry result', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'r1' });
    fetch
      .mockResolvedValueOnce(jsonRes(401)) // original request
      .mockResolvedValueOnce(jsonRes(200, { accessToken: 'new', refreshToken: 'r2' })) // refresh
      .mockResolvedValueOnce(jsonRes(200, { data: 'ok' })); // retry
    const out = await apiFetch('/api/thing');
    expect(out).toEqual({ data: 'ok' });
    expect(fetch).toHaveBeenCalledTimes(3);
    // Retry used the refreshed access token.
    expect(fetch.mock.calls[2][1].headers.Authorization).toBe('Bearer new');
    expect(getRefreshToken()).toBe('r2');
  });

  it('does not refresh on 401 when auth:false', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'r1' });
    fetch.mockResolvedValueOnce(jsonRes(401, { error: 'nope' }));
    await expect(apiFetch('/api/public', { auth: false })).rejects.toBeInstanceOf(ApiError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('clears the session and calls onAuthFailure when refresh is rejected', async () => {
    const onFail = vi.fn();
    setOnAuthFailure(onFail);
    setTokens({ accessToken: 'old', refreshToken: 'r1' });
    fetch
      .mockResolvedValueOnce(jsonRes(401)) // original
      .mockResolvedValueOnce(jsonRes(401)); // refresh rejected
    await expect(apiFetch('/api/thing')).rejects.toThrow();
    expect(onFail).toHaveBeenCalledTimes(1);
    expect(getRefreshToken()).toBeNull();
  });
});

describe('ensureFreshToken', () => {
  it('returns true when the refresh succeeds', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'r1' });
    fetch.mockResolvedValueOnce(jsonRes(200, { accessToken: 'new', refreshToken: 'r2' }));
    expect(await ensureFreshToken()).toBe(true);
    expect(getAccessToken()).toBe('new');
  });

  it('returns false and signals auth failure when there is no refresh token', async () => {
    const onFail = vi.fn();
    setOnAuthFailure(onFail);
    expect(await ensureFreshToken()).toBe(false);
    expect(onFail).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shares a single in-flight refresh between concurrent callers', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'r1' });
    fetch.mockResolvedValue(jsonRes(200, { accessToken: 'new', refreshToken: 'r2' }));
    const [a, b] = await Promise.all([ensureFreshToken(), ensureFreshToken()]);
    expect([a, b]).toEqual([true, true]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('apiFetchBlob', () => {
  it('returns the response blob on success', async () => {
    setTokens({ accessToken: 'tok', refreshToken: 'r' });
    fetch.mockResolvedValueOnce(jsonRes(200, { any: 1 }));
    const blob = await apiFetchBlob('/api/files/1');
    expect(blob).toBeInstanceOf(Blob);
  });

  it('refreshes and retries on 401', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'r1' });
    fetch
      .mockResolvedValueOnce(jsonRes(401))
      .mockResolvedValueOnce(jsonRes(200, { accessToken: 'new', refreshToken: 'r2' }))
      .mockResolvedValueOnce(jsonRes(200, { file: 1 }));
    await apiFetchBlob('/api/files/1');
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('throws an ApiError on a non-ok response', async () => {
    fetch.mockResolvedValueOnce(jsonRes(404));
    await expect(apiFetchBlob('/api/files/1')).rejects.toBeInstanceOf(ApiError);
  });
});