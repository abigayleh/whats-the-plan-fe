import { API_URL } from '../config.js';

let seq = 0;
export const uniqueEmail = (tag = 'u') => `e2e-${tag}-${process.pid}-${(seq += 1)}@example.test`;

export const PASSWORD = 'e2e-Password-1';

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status} ${data?.error || text}`);
  }
  return data;
}

/** Registers a user, leaving them unverified. Returns the email and the real verify token. */
export async function registerUser({ name = 'E2E User', tag } = {}) {
  const email = uniqueEmail(tag);
  const { verifyToken } = await call('/api/auth/register', {
    method: 'POST',
    body: { email, password: PASSWORD, name },
  });
  return { email, name, verifyToken };
}

/** Registers, verifies through the real endpoint, and logs in. Returns tokens + helpers. */
export async function createUser({ name = 'E2E User', tag } = {}) {
  const { email, verifyToken } = await registerUser({ name, tag });
  await call('/api/auth/verify', { method: 'POST', body: { token: verifyToken } });
  const { user, accessToken, refreshToken } = await call('/api/auth/login', {
    method: 'POST',
    body: { email, password: PASSWORD },
  });

  const as = (path, opts) => call(path, { ...opts, token: accessToken });

  return {
    ...user,
    email,
    password: PASSWORD,
    accessToken,
    refreshToken,
    call: as,
    createGroup: (groupName, colorKey = 'primary') =>
      as('/api/groups', { method: 'POST', body: { name: groupName, colorKey } }),
    inviteCode: (groupId) =>
      as(`/api/groups/${groupId}/invite`, { method: 'POST' }),
    joinGroup: (code) =>
      as(`/api/groups/join/${code}`, { method: 'POST' }),
    createList: (listName, groupId = null) =>
      as('/api/lists', { method: 'POST', body: { name: listName, groupId } }),
    createTask: (listId, task) =>
      as(`/api/lists/${listId}/tasks`, { method: 'POST', body: task }),
    createPoll: (groupId, poll) =>
      as(`/api/groups/${groupId}/polls`, { method: 'POST', body: poll }),
    createItinerary: (itinerary) =>
      as('/api/itineraries', { method: 'POST', body: itinerary }),
  };
}

export { call };
