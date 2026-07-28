import { describe, it, expect } from 'vitest';
import { groupItineraries, reorderWithinSection, itineraryMeta } from './itineraries';

const unplanned = { id: 'u1', startDate: null, dayCount: 5 };
const planned = { id: 'p1', startDate: new Date(2026, 6, 25), dayCount: null };
const done = { id: 'c1', startDate: new Date(2025, 3, 1), endDate: new Date(2025, 3, 8), completedAt: new Date() };

describe('groupItineraries', () => {
  it('splits by dates and completion', () => {
    const grouped = groupItineraries([unplanned, planned, done]);
    expect(grouped.unplanned.map((it) => it.id)).toEqual(['u1']);
    expect(grouped.planned.map((it) => it.id)).toEqual(['p1']);
    expect(grouped.completed.map((it) => it.id)).toEqual(['c1']);
  });

  it('treats a completed itinerary as completed even without dates', () => {
    const grouped = groupItineraries([{ id: 'c2', startDate: null, completedAt: new Date() }]);
    expect(grouped.unplanned).toHaveLength(0);
    expect(grouped.completed.map((it) => it.id)).toEqual(['c2']);
  });
});

describe('reorderWithinSection', () => {
  const all = [{ id: 'a' }, { id: 'x' }, { id: 'b' }, { id: 'c' }];

  it('returns the full order with only the section resequenced', () => {
    expect(reorderWithinSection(all, ['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'x', 'a', 'b']);
  });

  it('returns null when the move is a no-op or the ids are unknown', () => {
    expect(reorderWithinSection(all, ['a', 'b', 'c'], 'a', 'a')).toBeNull();
    expect(reorderWithinSection(all, ['a', 'b', 'c'], 'a', 'x')).toBeNull();
  });
});

describe('itineraryMeta', () => {
  it('shows the expected length of an unplanned trip', () => {
    expect(itineraryMeta(unplanned)).toBe('5 days');
    expect(itineraryMeta({ startDate: null, dayCount: 1 })).toBe('1 day');
  });

  it('shows nothing when a trip has neither dates nor a day count', () => {
    expect(itineraryMeta({ startDate: null, dayCount: null })).toBeNull();
    expect(itineraryMeta({ startDate: null, endDate: null })).toBeNull();
  });

  it('shows the year in brackets for any dated trip, planned or completed', () => {
    expect(itineraryMeta(planned)).toBe(`(${planned.startDate.getFullYear()})`);
    expect(itineraryMeta(done)).toBe('(2025)');
  });
});