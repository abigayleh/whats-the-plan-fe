import {
  addDays, isSameDay, startOfDay, startOfWeek,
} from './date';

const DAY_MS = 86400000;

export function isTaskTimed(task) {
  return Boolean(task.scheduledStart && task.scheduledEnd);
}

export function getTaskDay(task) {
  if (task.scheduledStart) return task.scheduledStart;
  if (task.dueDate) return task.dueDate;
  return null;
}

// A day the user removed from a series. Skipping is per-occurrence: the series keeps
// recurring, that one day just stops existing.
export function isTaskSkippedOnDay(task, day) {
  return (task.skippedDates || []).some((date) => isSameDay(new Date(date), day));
}

// Recurring tasks are expanded on read: rather than storing every future occurrence,
// a day just checks itself against the original task day + the recurrence rule.
export function isTaskOnDay(task, day) {
  const taskDay = getTaskDay(task);
  if (!taskDay) return false;
  if (isTaskSkippedOnDay(task, day)) return false;
  if (isSameDay(taskDay, day)) return true;

  const frequency = task.recurrenceRule?.frequency;
  if (!frequency || startOfDay(day) < startOfDay(taskDay)) return false;

  switch (frequency) {
    case 'daily':
      return true;
    case 'weekly': {
      // No daysOfWeek (incl. every rule saved before the day picker existed) means "only the
      // task's own weekday" — the same behavior this switch had before.
      const daysOfWeek = task.recurrenceRule?.daysOfWeek?.length
        ? task.recurrenceRule.daysOfWeek
        : [taskDay.getDay()];
      if (!daysOfWeek.includes(day.getDay())) return false;
      // interval: 2 (bi-weekly) only matches every other week. Weeks are counted from a fixed
      // Sunday-anchored week start (not the task's own day) so every selected weekday in the
      // same week lands in the same week count.
      const interval = task.recurrenceRule?.interval || 1;
      const weeksBetween = Math.round((startOfWeek(day) - startOfWeek(taskDay)) / (7 * DAY_MS));
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

// A list's own color (set in ListModal) wins; otherwise it inherits its group's color.
export function getListColorKey(list, groups, personalSpace) {
  return list.color ?? getGroupColorKey(list.groupId, groups, personalSpace);
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

// A recurring item's `item` may be a raw list-task (recurrenceRule) or a calendar occurrence
// (rule/isRecurring, recurrenceRule nulled — see api/adapters.js) — check all three shapes.
export function isItemRecurring(item) {
  return Boolean(item?.recurrenceRule || item?.rule || item?.isRecurring);
}

// A recurring series never completes as a whole — each day it recurs is ticked on its own and
// stored in completedDates. Anything else (including an already-expanded calendar occurrence,
// whose rule is nulled and whose status the server resolved per day) uses its own status.
export function isTaskDoneOnDay(task, day) {
  if (!task.recurrenceRule) return task.status === 'done';
  return (task.completedDates || []).some((date) => isSameDay(new Date(date), day));
}

// Longest gap a rule can leave between occurrences, so the walk below has a bound.
// Only weekly reads `interval` — isTaskOnDay ignores it for the other frequencies.
const MAX_GAP_DAYS = {
  daily: 1, weekly: 7, monthly: 31, yearly: 366,
};

// The latest day this series recurs on, strictly before `day` — null if there isn't one.
export function lastOccurrenceBefore(task, day) {
  const frequency = task.recurrenceRule?.frequency;
  if (!MAX_GAP_DAYS[frequency]) return null;
  const gap = MAX_GAP_DAYS[frequency] * (frequency === 'weekly' ? (task.recurrenceRule.interval || 1) : 1);
  // Removed days widen the gap the rule alone would leave, so the walk has to reach past
  // them — otherwise skipping yesterday hides an older missed day entirely.
  const span = gap + (task.skippedDates?.length || 0);
  for (let back = 1; back <= span; back += 1) {
    const candidate = addDays(startOfDay(day), -back);
    if (isTaskOnDay(task, candidate)) return candidate;
  }
  return null;
}

// The day a to-do is overdue for, or null when it isn't. A series is judged on its most recent
// past occurrence only: one Overdue row for the last day missed, not one per day since it began.
export function getOverdueDay(task, today = new Date()) {
  const day = getTaskDay(task);
  if (!day) return null;
  if (task.recurrenceRule) {
    const missed = lastOccurrenceBefore(task, today);
    return missed && !isTaskDoneOnDay(task, missed) ? missed : null;
  }
  if (task.status === 'done') return null;
  return startOfDay(day) < startOfDay(today) ? day : null;
}

export function isTaskOverdue(task, today) {
  return getOverdueDay(task, today) !== null;
}

// Which day a bare "tick this off" applies to for a series: today when it recurs today, else
// the missed day Overdue is showing, else its first occurrence if it hasn't started yet.
// null when the series has no day to tick, and for a to-do that doesn't recur.
export function tickDayFor(task, today = new Date()) {
  if (!task.recurrenceRule) return null;
  if (isTaskOnDay(task, today)) return today;
  const missed = getOverdueDay(task, today);
  if (missed) return missed;
  const day = getTaskDay(task);
  return day && startOfDay(day) > startOfDay(today) ? day : null;
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
