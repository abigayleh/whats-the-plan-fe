import { apiFetch } from './client';

export const list = () => apiFetch('/api/itineraries');
export const get = (id) => apiFetch(`/api/itineraries/${id}`);
export const create = (body) => apiFetch('/api/itineraries', { method: 'POST', body });
export const update = (id, body) => apiFetch(`/api/itineraries/${id}`, { method: 'PATCH', body });
export const remove = (id) => apiFetch(`/api/itineraries/${id}`, { method: 'DELETE' });
