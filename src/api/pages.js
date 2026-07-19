import { apiFetch } from './client';

export const list = () => apiFetch('/api/pages');
export const get = (id) => apiFetch(`/api/pages/${id}`);
export const create = (body) => apiFetch('/api/pages', { method: 'POST', body });
export const update = (id, body) => apiFetch(`/api/pages/${id}`, { method: 'PATCH', body });
export const remove = (id) => apiFetch(`/api/pages/${id}`, { method: 'DELETE' });
