// Maps BE payloads to the shapes the UI works in (Dates, lowercase status, display names).

const STATUS_TO_FE = { TODO: 'todo', IN_PROGRESS: 'in-progress', DONE: 'done' };
const STATUS_TO_BE = { todo: 'TODO', 'in-progress': 'IN_PROGRESS', done: 'DONE' };

export const toBeStatus = (status) => STATUS_TO_BE[status] || 'TODO';

const toDate = (value) => (value ? new Date(value) : null);

// Date-only fields (itinerary start/end) are stored at UTC midnight. Parsing them as a plain
// Date shifts the calendar day for anyone behind UTC, so a picked date renders a day earlier
// and edits look like they revert. Rebuild the same calendar day at LOCAL midnight instead.
const toDateOnly = (value) => {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

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
  color: l.color ?? null,
  showUnscheduledOnCalendar: l.showUnscheduledOnCalendar ?? true,
  isSystem: l.isSystem,
  isDefault: l.isDefault ?? false,
  taskCount: l.taskCount,
  // Per-user arrangement order; null until the user has dragged this list.
  position: l.position ?? null,
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

// A PlanItem is the one shape the frontend works in for both events and to-dos.
// `origin` ('event' | 'task') is persistence routing ONLY — see hooks/usePlanItems — never
// a UI identity check. `sourceId` is always the real DB row id (for writes); `id` is the
// React-key/occurrence identity, which differs from sourceId for expanded calendar occurrences.
// An event has no completion concept, so status/assignee/attachments are fixed empty — but
// subtasks ARE supported on events (same shape as task subtasks), so it reads through raw.
export function adaptItem(raw, origin) {
  const isEvent = origin === 'event';
  return {
    origin,
    id: raw.id,
    sourceId: raw.id,
    title: raw.title,
    description: raw.description || '',
    createdById: raw.createdById,
    groupId: raw.groupId ?? null,
    listId: isEvent ? null : (raw.listId ?? null),
    status: isEvent ? 'todo' : (STATUS_TO_FE[raw.status] || 'todo'),
    dueDate: isEvent ? null : toDate(raw.dueDate),
    scheduledStart: toDate(raw.scheduledStart ?? raw.startAt),
    scheduledEnd: toDate(raw.scheduledEnd ?? raw.endAt),
    recurrenceRule: raw.recurrenceRule || null,
    subtasks: raw.subtasks || [],
    assignedToId: isEvent ? null : (raw.assignedToId ?? null),
    assignedTo: isEvent ? null : (raw.assignee?.name || null),
    attachments: isEvent ? [] : (raw.attachments || []).map(adaptAttachment),
    location: isEvent ? null : (raw.location ?? null),
    itineraryId: raw.itineraryId ?? null,
  };
}

// Row-level to-do (list detail): real DB id, live recurrenceRule — expanded on read by the client.
export const adaptTask = (t) => adaptItem(t, 'task');

// A calendar occurrence keys off instanceId, not the row id, so id/sourceId diverge on purpose:
// id is unique per occurrence (for React keys + drag identity), sourceId is the real row a
// write applies to. recurrenceRule is nulled for the same reason on both kinds of occurrence:
// the server already expanded the series, and isTaskOnDay would re-expand every occurrence
// across the whole visible window, duplicating chips. `rule` keeps the series definition
// around for display (e.g. the repeat icon) without re-triggering expansion.
function adaptOccurrence(raw, origin) {
  return {
    ...adaptItem(raw, origin),
    id: `${origin}-${raw.instanceId}`,
    sourceId: raw.id,
    isRecurring: raw.isRecurring,
    recurrenceRule: null,
    rule: raw.recurrenceRule,
  };
}

export const adaptCalendarTask = (t) => adaptOccurrence(t, 'task');
export const adaptEvent = (ev) => adaptOccurrence(ev, 'event');

// Results come pre-tallied: options carry voteCount, and myVote is computed per request.
// The server's `closed` is dropped on purpose — it's a snapshot taken at fetch time, so a
// page left open would never notice the expiry pass. PollCard derives it at render instead.
export const adaptPoll = (p) => ({
  id: p.id,
  groupId: p.groupId,
  question: p.question,
  options: p.options,
  totalVotes: p.totalVotes,
  myVote: p.myVote,
  expiresAt: toDate(p.expiresAt),
  createdById: p.createdById,
  createdAt: toDate(p.createdAt),
});

// An itinerary owns one auto-created list (listId); completedAt null = active.
export const adaptItinerary = (it) => ({
  id: it.id,
  title: it.title,
  destination: it.destination ?? null,
  description: it.description ?? null,
  groupId: it.groupId ?? null,
  listId: it.listId ?? null,
  colorLabel: it.colorLabel ?? null,
  icon: it.icon ?? null,
  completedAt: toDate(it.completedAt),
  createdById: it.createdById,
  startDate: toDateOnly(it.startDate),
  endDate: toDateOnly(it.endDate),
  // Expected length of a trip with no dates yet; sortOrder is the sidebar's manual order.
  dayCount: it.dayCount ?? null,
  sortOrder: it.sortOrder ?? 0,
  createdAt: toDate(it.createdAt),
});

// Page tree metadata (list responses omit `content`; the editor fetches it per-page).
export const adaptPage = (p) => ({
  id: p.id,
  title: p.title,
  icon: p.icon ?? null,
  groupId: p.groupId ?? null,
  ownerId: p.ownerId,
  createdById: p.createdById,
  parentId: p.parentId ?? null,
  position: p.position ?? 0,
  hasContent: p.hasContent ?? false,
  createdAt: toDate(p.createdAt),
  updatedAt: toDate(p.updatedAt),
});

// FE PlanItem patch → BE body. Only maps keys that are present, so PATCH stays partial.
// Attachments are excluded — they're synced through the attachments API, not the item body.
// An event has no status/assignee/list, and maps its schedule to startAt/endAt rather than
// scheduledStart/scheduledEnd/dueDate — but subtasks map the same way as for tasks.
export function toBeItem(patch, origin) {
  const body = {};
  if (origin === 'event') {
    ['title', 'description', 'recurrenceRule', 'groupId', 'subtasks'].forEach((key) => {
      if (patch[key] !== undefined) body[key] = patch[key];
    });
    if (patch.scheduledStart !== undefined) {
      body.startAt = patch.scheduledStart ? new Date(patch.scheduledStart).toISOString() : null;
    }
    if (patch.scheduledEnd !== undefined) {
      body.endAt = patch.scheduledEnd ? new Date(patch.scheduledEnd).toISOString() : null;
    }
    return body;
  }
  const copy = ['title', 'description', 'recurrenceRule', 'subtasks', 'assignedToId', 'listId', 'location'];
  copy.forEach((key) => {
    if (patch[key] !== undefined) body[key] = patch[key];
  });
  ['dueDate', 'scheduledStart', 'scheduledEnd'].forEach((key) => {
    if (patch[key] !== undefined) body[key] = patch[key] ? new Date(patch[key]).toISOString() : null;
  });
  if (patch.status !== undefined) body.status = toBeStatus(patch.status);
  return body;
}

export const toBeTask = (patch) => toBeItem(patch, 'task');
