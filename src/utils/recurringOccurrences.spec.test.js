import { describe, it, expect } from 'vitest';
import {
  isTaskOnDay, isTaskDoneOnDay, isTaskSkippedOnDay, getOverdueDay,
} from './tasks';

// Spec for refined recurring to-dos: one series row whose occurrences behave independently.
// Completing or removing one day must never touch another day, or the series itself.
const day = (d) => new Date(2026, 7, d);
const iso = (d) => day(d).toISOString();

const series = {
  id: 't1',
  title: 'Water plants',
  status: 'todo',
  dueDate: day(3),
  recurrenceRule: { frequency: 'daily', interval: 1 },
  completedDates: [],
  skippedDates: [],
};

describe('an occurrence completed on one day', () => {
  const withMonday = { ...series, completedDates: [iso(3)] };

  it('is done on that day only', () => {
    expect(isTaskDoneOnDay(withMonday, day(3))).toBe(true);
    expect(isTaskDoneOnDay(withMonday, day(4))).toBe(false);
  });

  it('leaves the series itself incomplete', () => {
    expect(withMonday.status).toBe('todo');
  });

  it('still recurs on the completed day', () => {
    expect(isTaskOnDay(withMonday, day(3))).toBe(true);
  });
});

describe('an occurrence removed from the calendar', () => {
  const withoutTuesday = { ...series, skippedDates: [iso(4)] };

  it('stops recurring on that day', () => {
    expect(isTaskSkippedOnDay(withoutTuesday, day(4))).toBe(true);
    expect(isTaskOnDay(withoutTuesday, day(4))).toBe(false);
  });

  it('keeps every other day, before and after', () => {
    expect(isTaskOnDay(withoutTuesday, day(3))).toBe(true);
    expect(isTaskOnDay(withoutTuesday, day(5))).toBe(true);
  });

  it('does not disturb a day already completed', () => {
    const mixed = { ...series, completedDates: [iso(3)], skippedDates: [iso(4)] };
    expect(isTaskDoneOnDay(mixed, day(3))).toBe(true);
    expect(isTaskOnDay(mixed, day(4))).toBe(false);
    expect(isTaskOnDay(mixed, day(5))).toBe(true);
  });
});

describe('a series with no per-day state', () => {
  it('recurs on every day of its rule', () => {
    expect(isTaskOnDay(series, day(3))).toBe(true);
    expect(isTaskOnDay(series, day(4))).toBe(true);
  });

  it('treats a missing skippedDates as nothing skipped', () => {
    const legacy = { ...series };
    delete legacy.skippedDates;
    expect(isTaskSkippedOnDay(legacy, day(4))).toBe(false);
    expect(isTaskOnDay(legacy, day(4))).toBe(true);
  });
});
describe('overdue, once a day has been removed', () => {
  const today = day(6);

  it('falls back to the most recent day still in the series', () => {
    // 5 Aug removed, so the last missed occurrence is 4 Aug.
    const task = { ...series, skippedDates: [iso(5)] };
    expect(getOverdueDay(task, today)).toEqual(day(4));
  });

  it('is not overdue for a day that was removed', () => {
    const task = { ...series, dueDate: day(5), skippedDates: [iso(5)] };
    expect(getOverdueDay(task, today)).not.toEqual(day(5));
  });
});
