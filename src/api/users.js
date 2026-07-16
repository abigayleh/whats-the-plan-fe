import { apiFetch } from './client';

export const updateName = (name) => apiFetch('/api/users/me', { method: 'PATCH', body: { name } });
export const changePassword = (currentPassword, newPassword) =>
  apiFetch('/api/users/me/password', { method: 'POST', body: { currentPassword, newPassword } });
export const deleteAccount = () => apiFetch('/api/users/me', { method: 'DELETE' });
