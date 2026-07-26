import { describe, it, expect } from 'vitest';
import { adaptItinerary } from './adapters';

// Smoke test for the framework + a regression guard for the itinerary date-only bug:
// date-only fields are stored at UTC midnight and must render on the same calendar day.
describe('adaptItinerary', () => {
  it('parses date-only start/end as the same local calendar day (no UTC drift)', () => {
    const out = adaptItinerary({
      id: 'i1',
      startDate: '2026-07-25T00:00:00.000Z',
      endDate: '2026-07-30T00:00:00.000Z',
    });
    expect([out.startDate.getFullYear(), out.startDate.getMonth(), out.startDate.getDate()])
      .toEqual([2026, 6, 25]);
    expect(out.endDate.getDate()).toBe(30);
  });

  it('maps null dates to null', () => {
    const out = adaptItinerary({ id: 'i2', startDate: null, endDate: null });
    expect(out.startDate).toBeNull();
    expect(out.endDate).toBeNull();
  });
});