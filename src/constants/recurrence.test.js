import { describe, it, expect } from 'vitest';
import { formatRecurrence } from './recurrence';

// Tuesday 4 August 2026 — the day the series starts.
const start = new Date(2026, 7, 4);

describe('formatRecurrence', () => {
  it('says nothing for an item that does not repeat', () => {
    expect(formatRecurrence(null, start)).toBeNull();
  });

  it('describes a daily series', () => {
    expect(formatRecurrence({ frequency: 'daily', interval: 1 }, start)).toBe('Daily');
  });

  it('names the weekdays a weekly series falls on', () => {
    const rule = { frequency: 'weekly', interval: 1, daysOfWeek: [1, 3] };
    expect(formatRecurrence(rule, start)).toBe('Weekly on Mon, Wed');
  });

  it('falls back to the start weekday when a weekly rule names no days', () => {
    expect(formatRecurrence({ frequency: 'weekly', interval: 1 }, start)).toBe('Weekly on Tue');
  });

  it('describes a bi-weekly series as every 2 weeks', () => {
    const rule = { frequency: 'weekly', interval: 2, daysOfWeek: [1] };
    expect(formatRecurrence(rule, start)).toBe('Every 2 weeks on Mon');
  });

  it('names the day of the month a monthly series falls on', () => {
    const rule = { frequency: 'monthly', interval: 1 };
    expect(formatRecurrence(rule, start)).toBe('Monthly on the 4th');
    expect(formatRecurrence(rule, new Date(2026, 7, 1))).toBe('Monthly on the 1st');
    expect(formatRecurrence(rule, new Date(2026, 7, 22))).toBe('Monthly on the 22nd');
    expect(formatRecurrence(rule, new Date(2026, 7, 23))).toBe('Monthly on the 23rd');
    expect(formatRecurrence(rule, new Date(2026, 7, 11))).toBe('Monthly on the 11th');
  });

  it('names the date a yearly series falls on', () => {
    expect(formatRecurrence({ frequency: 'yearly', interval: 1 }, start)).toBe('Yearly on Aug 4');
  });
});
