export const RECURRENCE_OPTIONS = [
  { value: '', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function formatRecurrence(recurrenceRule) {
  const match = RECURRENCE_OPTIONS.find((option) => option.value === recurrenceRule?.frequency);
  return match ? match.label : null;
}
