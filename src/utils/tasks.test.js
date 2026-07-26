import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isTaskTimed,
  getTaskDay,
  isTaskOnDay,
  getGroupColorKey,
  getListColorKey,
  getTaskColorKey,
  getTaskIconKey,
  isItemRecurring,
  isTaskOverdue,
  combineDateAndTime,
  toDateInputValue,
  toTimeInputValue,
} from './tasks';

describe('isTaskTimed', () => {
  it('is true when both start and end are set', () => {
    expect(isTaskTimed({ scheduledStart: new Date(), scheduledEnd: new Date() })).toBe(true);
  });

  it('is false when either is missing', () => {
    expect(isTaskTimed({ scheduledStart: new Date() })).toBe(false);
    expect(isTaskTimed({})).toBe(false);
  });
});

describe('getTaskDay', () => {
  it('prefers scheduledStart over dueDate', () => {
    const start = new Date(2026, 6, 1);
    expect(getTaskDay({ scheduledStart: start, dueDate: new Date(2026, 6, 9) })).toBe(start);
  });

  it('falls back to dueDate', () => {
    const due = new Date(2026, 6, 9);
    expect(getTaskDay({ dueDate: due })).toBe(due);
  });

  it('returns null when neither is set', () => {
    expect(getTaskDay({})).toBeNull();
  });
});

describe('isTaskOnDay', () => {
  const wed = new Date(2026, 6, 1); // 2026-07-01 is a Wednesday

  it('is false for a task with no day', () => {
    expect(isTaskOnDay({}, wed)).toBe(false);
  });

  it('matches the task’s own day', () => {
    expect(isTaskOnDay({ dueDate: wed }, new Date(2026, 6, 1))).toBe(true);
  });

  it('does not match other days without a recurrence rule', () => {
    expect(isTaskOnDay({ dueDate: wed }, new Date(2026, 6, 2))).toBe(false);
  });

  it('never matches days before the task day even when recurring', () => {
    const task = { dueDate: wed, recurrenceRule: { frequency: 'daily' } };
    expect(isTaskOnDay(task, new Date(2026, 5, 30))).toBe(false);
  });

  it('daily recurrence matches every later day', () => {
    const task = { dueDate: wed, recurrenceRule: { frequency: 'daily' } };
    expect(isTaskOnDay(task, new Date(2026, 6, 5))).toBe(true);
  });

  it('weekly (no daysOfWeek) matches only the same weekday', () => {
    const task = { dueDate: wed, recurrenceRule: { frequency: 'weekly' } };
    expect(isTaskOnDay(task, new Date(2026, 6, 8))).toBe(true); // next Wed
    expect(isTaskOnDay(task, new Date(2026, 6, 9))).toBe(false); // Thu
  });

  it('weekly with daysOfWeek matches any listed weekday', () => {
    const task = { dueDate: wed, recurrenceRule: { frequency: 'weekly', daysOfWeek: [1, 3] } };
    expect(isTaskOnDay(task, new Date(2026, 6, 6))).toBe(true); // Mon
    expect(isTaskOnDay(task, new Date(2026, 6, 7))).toBe(false); // Tue
  });

  it('weekly interval 2 skips the intervening week', () => {
    const task = { dueDate: wed, recurrenceRule: { frequency: 'weekly', interval: 2 } };
    expect(isTaskOnDay(task, new Date(2026, 6, 8))).toBe(false); // +1 week
    expect(isTaskOnDay(task, new Date(2026, 6, 15))).toBe(true); // +2 weeks
  });

  it('monthly recurrence matches the same day-of-month', () => {
    const task = { dueDate: new Date(2026, 6, 15), recurrenceRule: { frequency: 'monthly' } };
    expect(isTaskOnDay(task, new Date(2026, 7, 15))).toBe(true);
    expect(isTaskOnDay(task, new Date(2026, 7, 16))).toBe(false);
  });

  it('yearly recurrence matches the same month and day', () => {
    const task = { dueDate: new Date(2026, 6, 15), recurrenceRule: { frequency: 'yearly' } };
    expect(isTaskOnDay(task, new Date(2027, 6, 15))).toBe(true);
    expect(isTaskOnDay(task, new Date(2027, 7, 15))).toBe(false);
  });

  it('an unknown frequency never matches other days', () => {
    const task = { dueDate: wed, recurrenceRule: { frequency: 'hourly' } };
    expect(isTaskOnDay(task, new Date(2026, 6, 8))).toBe(false);
  });
});

describe('color resolution', () => {
  const groups = [{ id: 'g1', colorKey: 'blue' }];
  const personal = { colorKey: 'gray' };

  it('getGroupColorKey returns personal color when no group', () => {
    expect(getGroupColorKey(null, groups, personal)).toBe('gray');
  });

  it('getGroupColorKey returns the group color', () => {
    expect(getGroupColorKey('g1', groups, personal)).toBe('blue');
  });

  it('getGroupColorKey falls back to personal for an unknown group', () => {
    expect(getGroupColorKey('missing', groups, personal)).toBe('gray');
  });

  it('getListColorKey prefers the list’s own color', () => {
    expect(getListColorKey({ color: 'red', groupId: 'g1' }, groups, personal)).toBe('red');
  });

  it('getListColorKey inherits the group color when unset', () => {
    expect(getListColorKey({ color: null, groupId: 'g1' }, groups, personal)).toBe('blue');
  });

  it('getTaskColorKey uses the list color for a task in a list', () => {
    const lists = [{ id: 'l1', color: 'green', groupId: null }];
    expect(getTaskColorKey({ listId: 'l1' }, lists, groups, personal)).toBe('green');
  });

  it('getTaskColorKey uses the group color for a listless task', () => {
    expect(getTaskColorKey({ groupId: 'g1' }, [], groups, personal)).toBe('blue');
  });
});

describe('getTaskIconKey', () => {
  const lists = [{ id: 'l1', icon: 'cart' }];

  it('returns the list’s icon', () => {
    expect(getTaskIconKey({ listId: 'l1' }, lists)).toBe('cart');
  });

  it('returns null when the task has no list', () => {
    expect(getTaskIconKey({}, lists)).toBeNull();
  });
});

describe('isItemRecurring', () => {
  it('is true for a raw recurrenceRule', () => {
    expect(isItemRecurring({ recurrenceRule: { frequency: 'daily' } })).toBe(true);
  });

  it('is true for an occurrence carrying rule or isRecurring', () => {
    expect(isItemRecurring({ rule: {} })).toBe(true);
    expect(isItemRecurring({ isRecurring: true })).toBe(true);
  });

  it('is false for a plain item and for null', () => {
    expect(isItemRecurring({})).toBe(false);
    expect(isItemRecurring(null)).toBe(false);
  });
});

describe('isTaskOverdue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 26, 12));
  });
  afterEach(() => vi.useRealTimers());

  it('is false for a done task even if past due', () => {
    expect(isTaskOverdue({ status: 'done', dueDate: new Date(2026, 6, 1) })).toBe(false);
  });

  it('is true for an incomplete task due before today', () => {
    expect(isTaskOverdue({ status: 'todo', dueDate: new Date(2026, 6, 25) })).toBe(true);
  });

  it('is false for a task due today', () => {
    expect(isTaskOverdue({ status: 'todo', dueDate: new Date(2026, 6, 26, 23) })).toBe(false);
  });

  it('is false for a task due in the future', () => {
    expect(isTaskOverdue({ status: 'todo', dueDate: new Date(2026, 6, 27) })).toBe(false);
  });

  it('is false for a task with no day', () => {
    expect(isTaskOverdue({ status: 'todo' })).toBe(false);
  });
});

describe('combineDateAndTime', () => {
  it('builds a local Date from date and time strings', () => {
    const out = combineDateAndTime('2026-07-15', '14:30');
    expect([out.getFullYear(), out.getMonth(), out.getDate(), out.getHours(), out.getMinutes()])
      .toEqual([2026, 6, 15, 14, 30]);
  });

  it('returns null when either part is missing', () => {
    expect(combineDateAndTime('', '14:30')).toBeNull();
    expect(combineDateAndTime('2026-07-15', '')).toBeNull();
  });
});

describe('toDateInputValue', () => {
  it('formats a Date as YYYY-MM-DD with zero-padding', () => {
    expect(toDateInputValue(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('returns an empty string for a null date', () => {
    expect(toDateInputValue(null)).toBe('');
  });
});

describe('toTimeInputValue', () => {
  it('formats a Date as HH:MM with zero-padding', () => {
    expect(toTimeInputValue(new Date(2026, 0, 5, 9, 4))).toBe('09:04');
  });

  it('returns an empty string for a null date', () => {
    expect(toTimeInputValue(null)).toBe('');
  });
});