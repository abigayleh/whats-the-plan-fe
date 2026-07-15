// Maps BE payloads to the shapes the UI works in (Dates, lowercase status, display names).

const STATUS_TO_FE = { TODO: 'todo', IN_PROGRESS: 'in-progress', DONE: 'done' };
const STATUS_TO_BE = { todo: 'TODO', 'in-progress': 'IN_PROGRESS', done: 'DONE' };

export const toBeStatus = (status) => STATUS_TO_BE[status] || 'TODO';

const toDate = (value) => (value ? new Date(value) : null);

export const adaptGroup = (g) => ({
  id: g.id,
  name: g.name,
  colorKey: g.color || 'primary',
  memberCount: g.memberCount,
  role: g.role,
});

export const adaptList = (l) => ({
  id: l.id,
  name: l.name,
  groupId: l.groupId,
  ownerId: l.ownerId,
  icon: l.icon,
  isSystem: l.isSystem,
  taskCount: l.taskCount,
});

// Already-uploaded attachments carry an id; previews load lazily (files need auth).
export const adaptAttachment = (a) => ({
  id: a.id,
  name: a.filename,
  mimeType: a.mimeType,
  sizeBytes: a.sizeBytes,
  existing: true,
  previewUrl: null,
});

export const adaptTask = (t) => ({
  id: t.id,
  listId: t.listId,
  title: t.title,
  description: t.description || '',
  status: STATUS_TO_FE[t.status] || 'todo',
  dueDate: toDate(t.dueDate),
  scheduledStart: toDate(t.scheduledStart),
  scheduledEnd: toDate(t.scheduledEnd),
  recurrenceRule: t.recurrenceRule || null,
  subtasks: t.subtasks || [],
  assignedToId: t.assignedToId,
  assignedTo: t.assignee?.name || null,
  attachments: (t.attachments || []).map(adaptAttachment),
  createdById: t.createdById,
});

// A calendar task is one expanded occurrence, so it keys off instanceId, not task id.
// recurrenceRule is dropped for the same reason as events: the server already expanded
// the series, and isTaskOnDay would re-expand every occurrence across the whole window.
export const adaptCalendarTask = (t) => ({
  ...adaptTask(t),
  id: `task-${t.instanceId}`,
  taskId: t.id,
  isEvent: false,
  groupId: t.groupId,
  isRecurring: t.isRecurring,
  recurrenceRule: null,
  rule: t.recurrenceRule,
});

// FE task patch → BE body. Only maps keys that are present, so PATCH stays partial.
// Attachments are excluded — they're synced through the attachments API, not the task body.
export function toBeTask(patch) {
  const body = {};
  const copy = ['title', 'description', 'recurrenceRule', 'subtasks', 'assignedToId', 'listId'];
  copy.forEach((key) => {
    if (patch[key] !== undefined) body[key] = patch[key];
  });
  ['dueDate', 'scheduledStart', 'scheduledEnd'].forEach((key) => {
    if (patch[key] !== undefined) body[key] = patch[key] ? new Date(patch[key]).toISOString() : null;
  });
  if (patch.status !== undefined) body.status = toBeStatus(patch.status);
  return body;
}

export const adaptEvent = (ev) => ({
  id: ev.instanceId,
  eventId: ev.id,
  isEvent: true,
  title: ev.title,
  description: ev.description || '',
  groupId: ev.groupId,
  scheduledStart: toDate(ev.startAt),
  scheduledEnd: toDate(ev.endAt),
  dueDate: null,
  status: 'todo',
  isRecurring: ev.isRecurring,
  rule: ev.recurrenceRule,
  recurrenceRule: null, // occurrences are pre-expanded server-side; don't re-expand on the client
  itineraryId: ev.itineraryId,
  createdById: ev.createdById,
});
