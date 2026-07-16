import { isSameDay, startOfDay } from './date';

const DAY_MS = 86400000;

export function isTaskTimed(task) {
  return Boolean(task.scheduledStart && task.scheduledEnd);
}

export function getTaskDay(task) {
  if (task.scheduledStart) return task.scheduledStart;
  if (task.dueDate) return task.dueDate;
  return null;
}

// Recurring tasks are expanded on read: rather than storing every future occurrence,
// a day just checks itself against the original task day + the recurrence rule.
export function isTaskOnDay(task, day) {
  const taskDay = getTaskDay(task);
  if (!taskDay) return false;
  if (isSameDay(taskDay, day)) return true;

  const frequency = task.recurrenceRule?.frequency;
  if (!frequency || startOfDay(day) < startOfDay(taskDay)) return false;

  switch (frequency) {
    case 'daily':
      return true;
    case 'weekly': {
      if (day.getDay() !== taskDay.getDay()) return false;
      // interval: 2 (bi-weekly) only matches every other week, anchored on the task's own day.
      const interval = task.recurrenceRule?.interval || 1;
      const weeksBetween = Math.round((startOfDay(day) - startOfDay(taskDay)) / (7 * DAY_MS));
      return weeksBetween % interval === 0;
    }
    case 'monthly':
      return day.getDate() === taskDay.getDate();
    case 'yearly':
      return day.getDate() === taskDay.getDate() && day.getMonth() === taskDay.getMonth();
    default:
      return false;
  }
}

// Color is chosen once, at the top: a group has a color, and everything under it
// (its lists, and tasks in those lists) matches automatically. A list with no group
// matches the personal space's color instead — nothing in between ever picks its own.
export function getGroupColorKey(groupId, groups, personalSpace) {
  if (!groupId) return personalSpace.colorKey;
  return groups.find((g) => g.id === groupId)?.colorKey ?? personalSpace.colorKey;
}

export function getListColorKey(list, groups, personalSpace) {
  return getGroupColorKey(list.groupId, groups, personalSpace);
}

export function getTaskColorKey(task, lists, groups, personalSpace) {
  const list = task.listId ? lists.find((l) => l.id === task.listId) : null;
  if (list) return getListColorKey(list, groups, personalSpace);
  return getGroupColorKey(task.groupId, groups, personalSpace);
}

// Icon is chosen once too, but at the list level (e.g. a shopping list gets a cart
// icon) — a task just shows whatever icon its list has, or none if it has no list.
export function getTaskIconKey(task, lists) {
  const list = task.listId ? lists.find((l) => l.id === task.listId) : null;
  return list?.icon ?? null;
}

export function isTaskOverdue(task) {
  if (task.status === 'done') return false;
  const day = getTaskDay(task);
  if (!day) return false;
  return startOfDay(day) < startOfDay(new Date());
}

export function combineDateAndTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function toDateInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toTimeInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}
