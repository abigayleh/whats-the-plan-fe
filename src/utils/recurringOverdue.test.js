process.env.TZ = 'Europe/London';

import { describe, it, expect } from 'vitest';
import {
  getOverdueDay, isTaskOverdue, isTaskOnDay, isTaskDoneOnDay,
  lastOccurrenceBefore, tickDayFor,
} from './tasks';

// The reported case: a to-do repeating weekly on set days, judged from the Overdue list.
// Anchored Tuesday 6 October 2026 at 09:00, repeating Mondays and Tuesdays.
const MON = 1;
const TUE = 2;
const anchor = new Date(2026, 9, 6, 9, 0);

const series = (over = {}) => ({
  id: 't1',
  dueDate: anchor,
  status: 'todo',
  recurrenceRule: { frequency: 'weekly', interval: 1, daysOfWeek: [MON, TUE] },
  completedDates: [],
  skippedDates: [],
  ...over,
});
const at = (...args) => new Date(...args);
const iso = (...args) => at(...args).toISOString();

describe('which days a weekly set-days series falls on', () => {
  it('matches every selected weekday from the anchor onwards', () => {
    expect(isTaskOnDay(series(), at(2026, 9, 6))).toBe(true);   // Tue, the anchor
    expect(isTaskOnDay(series(), at(2026, 9, 12))).toBe(true);  // Mon
    expect(isTaskOnDay(series(), at(2026, 9, 13))).toBe(true);  // Tue
  });

  it('ignores unselected weekdays', () => {
    for (const day of [7, 8, 9, 10, 11]) {          // Wed–Sun
      expect(isTaskOnDay(series(), at(2026, 9, day))).toBe(false);
    }
  });

  it('never matches before the anchor', () => {
    expect(isTaskOnDay(series(), at(2026, 9, 5))).toBe(false);  // Mon before the Tue anchor
  });

  // The server used to drift a day here; both sides must agree or ticking can't clear.
  it('still matches the selected weekdays after the clocks change', () => {
    expect(isTaskOnDay(series(), at(2026, 10, 9))).toBe(true);   // Mon 9 Nov
    expect(isTaskOnDay(series(), at(2026, 10, 10))).toBe(true);  // Tue 10 Nov
    expect(isTaskOnDay(series(), at(2026, 10, 11))).toBe(false); // Wed 11 Nov
  });

  it('honours a skipped day', () => {
    const task = series({ skippedDates: [iso(2026, 9, 12, 9, 0)] });
    expect(isTaskOnDay(task, at(2026, 9, 12))).toBe(false);
    expect(isTaskOnDay(task, at(2026, 9, 13))).toBe(true);
  });
});

describe('overdue for a weekly set-days series', () => {
  const today = at(2026, 9, 15); // Thursday

  it('reports the most recent missed occurrence, not the first', () => {
    expect(getOverdueDay(series(), today).toDateString()).toBe('Tue Oct 13 2026');
  });

  it('is not overdue once that occurrence is ticked', () => {
    const done = series({ completedDates: [iso(2026, 9, 13, 9, 0)] });
    expect(getOverdueDay(done, today)).toBeNull();
    expect(isTaskOverdue(done, today)).toBe(false);
  });

  // Ticking Tuesday leaves Monday still missed, but Overdue only ever shows the latest.
  it('falls back to the previous occurrence when the latest is ticked', () => {
    const done = series({ completedDates: [iso(2026, 9, 13, 9, 0)] });
    expect(lastOccurrenceBefore(done, today).toDateString()).toBe('Tue Oct 13 2026');
  });

  it('is not overdue before the series has started', () => {
    expect(getOverdueDay(series(), at(2026, 9, 1))).toBeNull();
  });

  it('ignores a skipped day when finding the missed one', () => {
    const task = series({ skippedDates: [iso(2026, 9, 13, 9, 0)] });
    expect(getOverdueDay(task, today).toDateString()).toBe('Mon Oct 12 2026');
  });

  it('finds the missed day across the clock change', () => {
    const today2 = at(2026, 10, 12); // Thursday 12 Nov, after the change
    expect(getOverdueDay(series(), today2).toDateString()).toBe('Tue Nov 10 2026');
  });
});

describe('what a tick applies to', () => {
  it('uses today when the series recurs today', () => {
    expect(tickDayFor(series(), at(2026, 9, 13)).toDateString()).toBe('Tue Oct 13 2026');
  });

  it('uses the missed day when it does not recur today', () => {
    expect(tickDayFor(series(), at(2026, 9, 15)).toDateString()).toBe('Tue Oct 13 2026');
  });

  it('uses the first occurrence when the series has not started', () => {
    expect(tickDayFor(series(), at(2026, 9, 1)).toDateString()).toBe('Tue Oct 06 2026');
  });

  it('is null for a to-do that does not recur', () => {
    expect(tickDayFor(series({ recurrenceRule: null }))).toBeNull();
  });
});

describe('completion is judged by calendar day', () => {
  it('counts a stored instant on the same day, whatever its time', () => {
    const done = series({ completedDates: [iso(2026, 9, 13, 8, 0)] });
    expect(isTaskDoneOnDay(done, at(2026, 9, 13))).toBe(true);
  });

  it('does not leak across days', () => {
    const done = series({ completedDates: [iso(2026, 9, 13, 9, 0)] });
    expect(isTaskDoneOnDay(done, at(2026, 9, 12))).toBe(false);
  });
});

describe('changing the days while the series is overdue', () => {
  const today = at(2026, 9, 15); // Thursday

  it('moves the missed day when the rule narrows', () => {
    const monOnly = series({ recurrenceRule: { frequency: 'weekly', interval: 1, daysOfWeek: [MON] } });
    expect(getOverdueDay(monOnly, today).toDateString()).toBe('Mon Oct 12 2026');
  });

  it('clears overdue when the remaining day is already ticked', () => {
    const monOnly = series({
      recurrenceRule: { frequency: 'weekly', interval: 1, daysOfWeek: [MON] },
      completedDates: [iso(2026, 9, 12, 9, 0)],
    });
    expect(getOverdueDay(monOnly, today)).toBeNull();
  });

  // Ticks for days the new rule no longer includes are dropped server-side; the client must
  // not treat a leftover Tuesday tick as covering the Monday it now recurs on.
  it('does not let a stale tick from a dropped day mask a missed one', () => {
    const monOnly = series({
      recurrenceRule: { frequency: 'weekly', interval: 1, daysOfWeek: [MON] },
      completedDates: [iso(2026, 9, 13, 9, 0)],
    });
    expect(getOverdueDay(monOnly, today).toDateString()).toBe('Mon Oct 12 2026');
  });

  it('moves the missed day when the anchor moves later', () => {
    const moved = series({ dueDate: at(2026, 9, 13, 9, 0) });
    expect(getOverdueDay(moved, today).toDateString()).toBe('Tue Oct 13 2026');
  });

  it('stops being overdue when the anchor moves into the future', () => {
    const moved = series({ dueDate: at(2026, 10, 3, 9, 0) });
    expect(getOverdueDay(moved, today)).toBeNull();
  });

  it('stops recurring entirely when the rule is removed', () => {
    const plain = series({ recurrenceRule: null, dueDate: at(2026, 9, 13, 9, 0) });
    expect(getOverdueDay(plain, today).toDateString()).toBe('Tue Oct 13 2026');
    expect(getOverdueDay(series({ recurrenceRule: null, status: 'done' }), today)).toBeNull();
  });
});

// The reported failure: due date on a Saturday, repeating Mon/Wed/Fri. The client used to
// treat the anchor day as an occurrence while the server did not, so a tick on the Saturday
// snapped forward to the next Monday and the row could never clear.
describe('a series whose start date is not one of its repeat days', () => {
  const anchorSat = new Date(2026, 8, 5, 0, 0);   // Saturday 5 September 2026
  const monWedFri = (over = {}) => ({
    id: 'loki',
    dueDate: anchorSat,
    status: 'todo',
    recurrenceRule: { frequency: 'weekly', interval: 1, daysOfWeek: [1, 3, 5] },
    completedDates: [],
    skippedDates: [],
    ...over,
  });

  it('does not fall on its own start date', () => {
    expect(isTaskOnDay(monWedFri(), new Date(2026, 8, 5))).toBe(false);
  });

  it('falls on the first selected weekday after it starts', () => {
    expect(isTaskOnDay(monWedFri(), new Date(2026, 8, 7))).toBe(true);  // Mon
    expect(isTaskOnDay(monWedFri(), new Date(2026, 8, 9))).toBe(true);  // Wed
    expect(isTaskOnDay(monWedFri(), new Date(2026, 8, 11))).toBe(true); // Fri
  });

  it('never falls on a selected weekday before it starts', () => {
    expect(isTaskOnDay(monWedFri(), new Date(2026, 8, 4))).toBe(false); // the Friday before
  });

  // Sunday 6 Sep: the only prior candidate is the anchor Saturday, which is not an occurrence.
  it('is not overdue the day after it starts', () => {
    expect(getOverdueDay(monWedFri(), new Date(2026, 8, 6))).toBeNull();
    expect(isTaskOverdue(monWedFri(), new Date(2026, 8, 6))).toBe(false);
  });

  it('becomes overdue once a real occurrence is missed', () => {
    expect(getOverdueDay(monWedFri(), new Date(2026, 8, 8)).toDateString())
      .toBe('Mon Sep 07 2026');
  });

  it('clears once that occurrence is ticked', () => {
    const done = monWedFri({ completedDates: [new Date(2026, 8, 7, 0, 0).toISOString()] });
    expect(getOverdueDay(done, new Date(2026, 8, 8))).toBeNull();
  });

  it('ticks the day the row is actually showing', () => {
    expect(tickDayFor(monWedFri(), new Date(2026, 8, 8)).toDateString())
      .toBe('Mon Sep 07 2026');
  });

  // A weekly rule with no explicit days still means "the start date's own weekday".
  it('still uses the start weekday when no days are chosen', () => {
    const plain = monWedFri({ recurrenceRule: { frequency: 'weekly', interval: 1 } });
    expect(isTaskOnDay(plain, new Date(2026, 8, 5))).toBe(true);   // Sat, the anchor
    expect(isTaskOnDay(plain, new Date(2026, 8, 12))).toBe(true);  // next Sat
    expect(isTaskOnDay(plain, new Date(2026, 8, 7))).toBe(false);  // Mon
  });

  it('leaves a one-off to-do falling on its own day', () => {
    const oneOff = monWedFri({ recurrenceRule: null });
    expect(isTaskOnDay(oneOff, new Date(2026, 8, 5))).toBe(true);
    expect(isTaskOnDay(oneOff, new Date(2026, 8, 7))).toBe(false);
  });

  it('keeps the anchor day for daily, monthly and yearly rules', () => {
    for (const frequency of ['daily', 'monthly', 'yearly']) {
      const task = monWedFri({ recurrenceRule: { frequency, interval: 1 } });
      expect(isTaskOnDay(task, new Date(2026, 8, 5)), frequency).toBe(true);
    }
  });
});
