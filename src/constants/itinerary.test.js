import { describe, it, expect } from 'vitest';
import { clampDayCount } from './itinerary';

describe('clampDayCount', () => {
  it('keeps a whole number of days', () => {
    expect(clampDayCount('5')).toBe(5);
    expect(clampDayCount(5)).toBe(5);
  });

  it('floors to 1 for zero, negatives, and unparseable input', () => {
    expect(clampDayCount('0')).toBe(1);
    expect(clampDayCount('-3')).toBe(1);
    expect(clampDayCount('')).toBe(1);
    expect(clampDayCount('abc')).toBe(1);
  });

  it('drops a fractional part', () => {
    expect(clampDayCount('2.7')).toBe(2);
  });
});
