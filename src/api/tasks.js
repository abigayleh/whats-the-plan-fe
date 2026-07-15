import { apiFetch } from './client';

const qs = (obj) => new URLSearchParams(obj).toString();

// Calendar tasks arrive as expanded occurrences; task mutations go through api/lists.
export const calendar = ({ start, end }) => apiFetch(`/api/tasks/calendar?${qs({ start, end })}`);
