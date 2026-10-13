import { WEEKDAY_LABELS as WEEKDAY_NAMES, formatDateShort } from '../utils/date';

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

const ordinal = (n) => {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
  return `${n}${suffix}`;
};

// API recurrenceRule (+ the series' start date) -> "Weekly on Mon, Wed", for showing when a
// series falls rather than the one date it happens to be anchored to. null when it doesn't repeat.
export function formatRecurrence(rule, startDate) {
  switch (rule?.frequency) {
    case 'daily':
      return 'Daily';
    case 'weekly': {
      const days = recurrenceDaysOfWeekFor(rule, startDate).map((dow) => WEEKDAY_NAMES[dow]).join(', ');
      const every = rule.interval === 2 ? 'Every 2 weeks' : 'Weekly';
      return days ? `${every} on ${days}` : every;
    }
    case 'monthly':
      return startDate ? `Monthly on the ${ordinal(startDate.getDate())}` : 'Monthly';
    case 'yearly':
      return startDate ? `Yearly on ${formatDateShort(startDate)}` : 'Yearly';
    default:
      return null;
  }
}
