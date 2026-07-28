import { apiFetch } from './client';

const qs = (obj) => new URLSearchParams(obj).toString();

export const list = () => apiFetch('/api/itineraries');
export const get = (id) => apiFetch(`/api/itineraries/${id}`);
export const create = (body) => apiFetch('/api/itineraries', { method: 'POST', body });
// Body also takes `groupId` (group id, or null for personal) to move scope, and either
// startDate/endDate or dayCount — sending one clears the other server-side.
export const update = (id, body) => apiFetch(`/api/itineraries/${id}`, { method: 'PATCH', body });
export const remove = (id) => apiFetch(`/api/itineraries/${id}`, { method: 'DELETE' });

// Persist the sidebar's manual order — `ids` is every itinerary, in its new order.
export const reorder = (ids) => apiFetch('/api/itineraries/order', { method: 'PATCH', body: { ids } });

// Expanded to-do occurrences within a date range, for the itinerary's own week/day views.
export const tasks = (id, { start, end }) => apiFetch(`/api/itineraries/${id}/tasks?${qs({ start, end })}`);

// Polls scoped to this itinerary (group itineraries only).
export const polls = (id) => apiFetch(`/api/itineraries/${id}/polls`);
export const createPoll = (id, body) => apiFetch(`/api/itineraries/${id}/polls`, { method: 'POST', body });
