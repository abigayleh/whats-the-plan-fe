// A trip is either dated, or "to be planned" with only an expected number of days.
export const SCHEDULE_OPTIONS = [
  { value: 'dates', label: 'Dates' },
  { value: 'unplanned', label: 'Not scheduled yet' },
];

export const isScheduled = (itinerary) => Boolean(itinerary.startDate || itinerary.endDate);

export const clampDayCount = (value) => Math.max(1, Math.floor(Number(value)) || 1);
