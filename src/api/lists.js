import { apiFetch } from './client';

export const list = () => apiFetch('/api/lists');
export const create = (body) => apiFetch('/api/lists', { method: 'POST', body });
export const update = (id, body) => apiFetch(`/api/lists/${id}`, { method: 'PATCH', body });
export const remove = (id) => apiFetch(`/api/lists/${id}`, { method: 'DELETE' });

// Persist this user's list order. `lists` is [{ listId, position }].
export const arrange = (lists) => apiFetch('/api/lists/arrangement', { method: 'PUT', body: { lists } });

export const tasks = (listId) => apiFetch(`/api/lists/${listId}/tasks`);
export const createTask = (listId, body) => apiFetch(`/api/lists/${listId}/tasks`, { method: 'POST', body });
export const updateTask = (listId, taskId, body) =>
  apiFetch(`/api/lists/${listId}/tasks/${taskId}`, { method: 'PATCH', body });
export const removeTask = (listId, taskId) =>
  apiFetch(`/api/lists/${listId}/tasks/${taskId}`, { method: 'DELETE' });
