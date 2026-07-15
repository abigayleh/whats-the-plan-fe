import { apiFetch } from './client';

const qs = (obj) => new URLSearchParams(obj).toString();

export const calendar = ({ start, end }) => apiFetch(`/api/tasks/calendar?${qs({ start, end })}`);
export const assignedToMe = () => apiFetch('/api/tasks/assigned-to-me');

// Task mutations go through the list-scoped task route.
export const patchTask = (listId, taskId, body) =>
  apiFetch(`/api/lists/${listId}/tasks/${taskId}`, { method: 'PATCH', body });
