import { apiFetch } from './client';

export const listForGroup = (groupId) => apiFetch(`/api/groups/${groupId}/polls`);
export const create = (groupId, body) => apiFetch(`/api/groups/${groupId}/polls`, { method: 'POST', body });
export const remove = (id) => apiFetch(`/api/polls/${id}`, { method: 'DELETE' });
export const vote = (id, optionId) => apiFetch(`/api/polls/${id}/vote`, { method: 'POST', body: { optionId } });
