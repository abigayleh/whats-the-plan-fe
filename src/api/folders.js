import { apiFetch } from './client';

export const list = () => apiFetch('/api/folders');
export const create = (body) => apiFetch('/api/folders', { method: 'POST', body });
export const update = (id, body) => apiFetch(`/api/folders/${id}`, { method: 'PATCH', body });
export const remove = (id) => apiFetch(`/api/folders/${id}`, { method: 'DELETE' });
