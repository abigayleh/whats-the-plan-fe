import { apiFetch, apiFetchBlob } from './client';

export function upload(file, taskId) {
  const form = new FormData();
  form.append('file', file);
  form.append('taskId', taskId);
  return apiFetch('/api/attachments', { method: 'POST', body: form });
}

export const remove = (id) => apiFetch(`/api/attachments/${id}`, { method: 'DELETE' });

// Reconciles a task's attachments: uploads newly picked files, deletes the ones dropped.
// Deletes must land first — until they do, the removed files still count against the
// API's per-type cap and would reject the replacements.
export async function sync(taskId, attachments, original = []) {
  const kept = new Set(attachments.filter((a) => a.existing).map((a) => a.id));
  await Promise.all(original.filter((a) => !kept.has(a.id)).map((a) => remove(a.id)));
  await Promise.all(attachments.filter((a) => a.file).map((a) => upload(a.file, taskId)));
}

// Caller owns the returned object URL and must revoke it.
export const objectUrl = (id) => apiFetchBlob(`/api/files/${id}`).then(URL.createObjectURL);
