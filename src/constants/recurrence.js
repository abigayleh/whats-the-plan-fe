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

// UI recurrence value -> API recurrenceRule.
export function recurrenceRuleFor(value) {
  if (!value) return null;
  if (value === 'biweekly') return { frequency: 'weekly', interval: 2 };
  return { frequency: value, interval: 1 };
}

// API recurrenceRule -> UI recurrence value, for seeding the selector from a saved item.
export function recurrenceValueFor(rule) {
  if (!rule?.frequency) return '';
  if (rule.frequency === 'weekly' && rule.interval === 2) return 'biweekly';
  return rule.frequency;
}

export function formatRecurrence(recurrenceRule) {
  const match = RECURRENCE_OPTIONS.find((option) => option.value === recurrenceValueFor(recurrenceRule));
  return match ? match.label : null;
}
