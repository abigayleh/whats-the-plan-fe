import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  WEEKDAY_LABELS,
  DAY_HOURS,
  DAY_START_HOUR,
  DAY_END_HOUR,
  getTimelinePosition,
  getTimeFromTimelinePosition,
  startOfDay,
  isSameDay,
  isToday,
  addDays,
  addMonths,
  startOfMonth,
  startOfWeek,
  getMonthGrid,
  getWeekDays,
  formatMonthYear,
  formatWeekRange,
  formatFullDate,
  formatDateShort,
  formatTime,
  formatHourLabel,
  getGreeting,
} from './date';

describe('date constants', () => {
  it('DAY_HOURS covers 6:00 through 23:00 (18 hours)', () => {
    expect(DAY_HOURS).toHaveLength(18);
    expect(DAY_HOURS[0]).toBe(6);
    expect(DAY_HOURS[17]).toBe(23);
  });

  it('exposes the derived start/end hour bounds', () => {
    expect(DAY_START_HOUR).toBe(6);
    expect(DAY_END_HOUR).toBe(24);
  });

  it('WEEKDAY_LABELS is Sunday-first', () => {
    expect(WEEKDAY_LABELS[0]).toBe('Sun');
    expect(WEEKDAY_LABELS).toHaveLength(7);
  });
});

describe('getTimelinePosition', () => {
  it('returns 0 at the start hour', () => {
    expect(getTimelinePosition(new Date(2026, 0, 1, 6, 0))).toBe(0);
  });

  it('returns 0.5 at the midpoint of the visible range', () => {
    expect(getTimelinePosition(new Date(2026, 0, 1, 15, 0))).toBeCloseTo(0.5, 5);
  });

  it('clamps times before the start hour to 0', () => {
    expect(getTimelinePosition(new Date(2026, 0, 1, 3, 0))).toBe(0);
  });

  it('clamps times after the end hour to 1', () => {
    expect(getTimelinePosition(new Date(2026, 0, 1, 23, 59))).toBeLessThanOrEqual(1);
    expect(getTimelinePosition(new Date(2026, 0, 1, 23, 59))).toBeGreaterThan(0.94);
  });

  it('accounts for minutes within the hour', () => {
    expect(getTimelinePosition(new Date(2026, 0, 1, 6, 30))).toBeCloseTo(30 / 1080, 5);
  });
});

describe('getTimeFromTimelinePosition', () => {
  it('maps fraction 0 to the start hour', () => {
    expect(getTimeFromTimelinePosition(0)).toEqual({ hour: 6, minute: 0 });
  });

  it('maps fraction 0.5 to the midpoint hour', () => {
    expect(getTimeFromTimelinePosition(0.5)).toEqual({ hour: 15, minute: 0 });
  });

  it('snaps to the nearest 15-minute step', () => {
    // 10 minutes into the 1080-min range rounds to a 15-min boundary (0 min).
    expect(getTimeFromTimelinePosition(10 / 1080)).toEqual({ hour: 6, minute: 15 });
  });

  it('clamps fraction 1 to the last usable slot (23:45)', () => {
    expect(getTimeFromTimelinePosition(1)).toEqual({ hour: 23, minute: 45 });
  });

  it('clamps negative fractions to the start', () => {
    expect(getTimeFromTimelinePosition(-1)).toEqual({ hour: 6, minute: 0 });
  });
});

describe('startOfDay', () => {
  it('zeroes the time component', () => {
    const out = startOfDay(new Date(2026, 5, 15, 13, 45, 30, 500));
    expect([out.getHours(), out.getMinutes(), out.getSeconds(), out.getMilliseconds()])
      .toEqual([0, 0, 0, 0]);
    expect(out.getDate()).toBe(15);
  });

  it('does not mutate the input', () => {
    const input = new Date(2026, 5, 15, 13, 45);
    startOfDay(input);
    expect(input.getHours()).toBe(13);
  });
});

describe('isSameDay', () => {
  it('is true for two times on the same calendar day', () => {
    expect(isSameDay(new Date(2026, 2, 3, 1), new Date(2026, 2, 3, 23))).toBe(true);
  });

  it('is false across a day boundary', () => {
    expect(isSameDay(new Date(2026, 2, 3, 23), new Date(2026, 2, 4, 0))).toBe(false);
  });

  it('is false for same day-of-month in different months', () => {
    expect(isSameDay(new Date(2026, 2, 3), new Date(2026, 3, 3))).toBe(false);
  });
});

describe('isToday', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is true for the current date', () => {
    vi.setSystemTime(new Date(2026, 6, 26, 9, 0));
    expect(isToday(new Date(2026, 6, 26, 20, 0))).toBe(true);
  });

  it('is false for a different date', () => {
    vi.setSystemTime(new Date(2026, 6, 26, 9, 0));
    expect(isToday(new Date(2026, 6, 25))).toBe(false);
  });
});

describe('addDays', () => {
  it('adds days and rolls over month boundaries', () => {
    expect(addDays(new Date(2026, 0, 30), 3).getTime())
      .toBe(new Date(2026, 1, 2).getTime());
  });

  it('subtracts with a negative amount', () => {
    expect(addDays(new Date(2026, 1, 2), -3).getTime())
      .toBe(new Date(2026, 0, 30).getTime());
  });

  it('does not mutate the input', () => {
    const input = new Date(2026, 0, 1);
    addDays(input, 5);
    expect(input.getDate()).toBe(1);
  });
});

describe('addMonths', () => {
  it('adds months, rolling over the year', () => {
    expect(addMonths(new Date(2026, 10, 1), 3).getTime())
      .toBe(new Date(2027, 1, 1).getTime());
  });

  it('overflows when the target month is shorter (Jan 31 + 1 month)', () => {
    // JS Date normalizes Feb 31 to early March.
    const out = addMonths(new Date(2026, 0, 31), 1);
    expect(out.getMonth()).toBe(2);
  });
});

describe('startOfMonth', () => {
  it('returns the first day at local midnight', () => {
    const out = startOfMonth(new Date(2026, 6, 26, 15));
    expect([out.getDate(), out.getHours()]).toEqual([1, 0]);
  });
});

describe('startOfWeek', () => {
  it('returns the Sunday of the week at midnight', () => {
    // 2026-07-26 is a Sunday; its week start is itself.
    const sunday = startOfWeek(new Date(2026, 6, 26, 12));
    expect(sunday.getDay()).toBe(0);
    expect(sunday.getDate()).toBe(26);
    expect(sunday.getHours()).toBe(0);
  });

  it('walks back to the prior Sunday mid-week', () => {
    // 2026-07-29 is a Wednesday.
    const start = startOfWeek(new Date(2026, 6, 29));
    expect(start.getDay()).toBe(0);
    expect(start.getDate()).toBe(26);
  });
});

describe('getMonthGrid', () => {
  it('always returns 42 cells', () => {
    expect(getMonthGrid(new Date(2026, 6, 15))).toHaveLength(42);
  });

  it('starts on a Sunday', () => {
    expect(getMonthGrid(new Date(2026, 6, 15))[0].getDay()).toBe(0);
  });

  it('includes the first of the month', () => {
    const grid = getMonthGrid(new Date(2026, 6, 15));
    expect(grid.some((d) => d.getMonth() === 6 && d.getDate() === 1)).toBe(true);
  });
});

describe('getWeekDays', () => {
  it('returns 7 consecutive days starting Sunday', () => {
    const days = getWeekDays(new Date(2026, 6, 29));
    expect(days).toHaveLength(7);
    expect(days[0].getDay()).toBe(0);
    expect(days[6].getDay()).toBe(6);
  });
});

describe('format helpers', () => {
  it('formatMonthYear includes the year', () => {
    expect(formatMonthYear(new Date(2026, 6, 1))).toContain('2026');
  });

  it('formatWeekRange joins start and end with a dash', () => {
    const days = getWeekDays(new Date(2026, 6, 29));
    expect(formatWeekRange(days)).toContain('–');
  });

  it('formatFullDate returns a non-empty string', () => {
    expect(typeof formatFullDate(new Date(2026, 6, 26))).toBe('string');
    expect(formatFullDate(new Date(2026, 6, 26)).length).toBeGreaterThan(0);
  });

  it('formatDateShort returns a non-empty string', () => {
    expect(formatDateShort(new Date(2026, 6, 26)).length).toBeGreaterThan(0);
  });

  it('formatTime returns a non-empty string', () => {
    expect(formatTime(new Date(2026, 6, 26, 14, 30)).length).toBeGreaterThan(0);
  });

  it('formatHourLabel returns a non-empty string for an hour number', () => {
    expect(formatHourLabel(9).length).toBeGreaterThan(0);
  });
});

describe('getGreeting', () => {
  it('says good morning before noon', () => {
    expect(getGreeting(new Date(2026, 0, 1, 8))).toBe('Good morning');
  });

  it('says good afternoon at noon', () => {
    expect(getGreeting(new Date(2026, 0, 1, 12))).toBe('Good afternoon');
  });

  it('says good afternoon before 5pm', () => {
    expect(getGreeting(new Date(2026, 0, 1, 16, 59))).toBe('Good afternoon');
  });

  it('says good evening from 5pm', () => {
    expect(getGreeting(new Date(2026, 0, 1, 17))).toBe('Good evening');
  });

  it('defaults to the current time when called with no argument', () => {
    expect(typeof getGreeting()).toBe('string');
  });
});