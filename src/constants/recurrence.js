// 'biweekly' is a UI-only value — it maps to the same { frequency: 'weekly' } rule the API
// knows about, just with interval: 2, rather than inventing a new frequency server-side.
export const RECURRENCE_OPTIONS = [
  { value: '', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // index = Date#getDay()

// UI recurrence value (+ optional weekly/bi-weekly day-of-week selection) -> API recurrenceRule.
// daysOfWeek is only meaningful for weekly/biweekly, and omitted entirely when empty — an
// absent daysOfWeek means "the start date's own weekday", per recurrenceDaysOfWeekFor below.
export function recurrenceRuleFor(value, daysOfWeek) {
  if (!value) return null;
  const extra = (value === 'weekly' || value === 'biweekly') && daysOfWeek?.length ? { daysOfWeek } : {};
  if (value === 'biweekly') return { frequency: 'weekly', interval: 2, ...extra };
  return { frequency: value, interval: 1, ...extra };
}

// API recurrenceRule -> UI recurrence value, for seeding the selector from a saved item.
export function recurrenceValueFor(rule) {
  if (!rule?.frequency) return '';
  if (rule.frequency === 'weekly' && rule.interval === 2) return 'biweekly';
  return rule.frequency;
}

// API recurrenceRule (+ the item's start date) -> selected weekdays, for seeding the day
// picker. A rule with no daysOfWeek (including every rule saved before this feature) defaults
// to just the start date's own weekday, matching the old "same weekday every N weeks" behavior.
export function recurrenceDaysOfWeekFor(rule, startDate) {
  if (rule?.daysOfWeek?.length) return rule.daysOfWeek;
  return startDate ? [startDate.getDay()] : [];
}

export function formatRecurrence(recurrenceRule) {
  const match = RECURRENCE_OPTIONS.find((option) => option.value === recurrenceValueFor(recurrenceRule));
  return match ? match.label : null;
}
