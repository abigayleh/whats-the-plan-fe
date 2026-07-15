import { apiFetch } from './client';

export const list = () => apiFetch('/api/groups');
export const get = (id) => apiFetch(`/api/groups/${id}`);
export const create = (name, color) => apiFetch('/api/groups', { method: 'POST', body: { name, color } });
export const join = (code) => apiFetch(`/api/groups/join/${encodeURIComponent(code)}`, { method: 'POST' });
export const update = (id, patch) => apiFetch(`/api/groups/${id}`, { method: 'PATCH', body: patch });
export const setColor = (id, color) => apiFetch(`/api/groups/${id}/color`, { method: 'PATCH', body: { color } });
export const createInvite = (id) => apiFetch(`/api/groups/${id}/invite`, { method: 'POST' });
export const revokeInvite = (id, code) =>
  apiFetch(`/api/groups/${id}/invite/${encodeURIComponent(code)}`, { method: 'DELETE' });
export const setRole = (id, userId, role) =>
  apiFetch(`/api/groups/${id}/members/${userId}`, { method: 'PATCH', body: { role } });
export const removeMember = (id, userId) =>
  apiFetch(`/api/groups/${id}/members/${userId}`, { method: 'DELETE' });
export const leave = (id) => apiFetch(`/api/groups/${id}/leave`, { method: 'POST' });
export const remove = (id) => apiFetch(`/api/groups/${id}`, { method: 'DELETE' });
