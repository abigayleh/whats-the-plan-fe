import { apiFetch } from './client';

const qs = (obj) => new URLSearchParams(obj).toString();

export const list = ({ start, end, groups }) =>
  apiFetch(`/api/events?${qs({ start, end, ...(groups ? { groups } : {}) })}`);
export const create = (body) => apiFetch('/api/events', { method: 'POST', body });
export const update = (id, body) => apiFetch(`/api/events/${id}`, { method: 'PATCH', body });
export const remove = (id) => apiFetch(`/api/events/${id}`, { method: 'DELETE' });
