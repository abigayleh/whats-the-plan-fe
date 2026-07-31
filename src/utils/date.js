export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DAY_HOURS = Array.from({ length: 18 }, (_, i) => i + 6);
export const DAY_START_HOUR = DAY_HOURS[0];
export const DAY_END_HOUR = DAY_HOURS[DAY_HOURS.length - 1] + 1;

// Fraction (0-1) of the visible DAY_HOURS range a given time falls at, for positioning timeline blocks.
export function getTimelinePosition(date) {
  const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
  const minutes = (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes();
  return Math.min(Math.max(minutes / totalMinutes, 0), 1);
}

// Inverse of getTimelinePosition — turns a click/drop's vertical position (0-1
// fraction of the timeline) back into an hour/minute, snapped to 15-minute steps.
export function getTimeFromTimelinePosition(fraction) {
  const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
  const snapped = Math.round((fraction * totalMinutes) / 15) * 15;
  const clamped = Math.min(Math.max(snapped, 0), totalMinutes - 15);
  return {
    hour: DAY_START_HOUR + Math.floor(clamped / 60),
    minute: clamped % 60,
  };
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Midday, so a date that only means "this day" stays on it through any timezone shift.
export function noonOf(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d;
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date) {
  return isSameDay(date, new Date());
}

export function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export function addMonths(date, amount) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + amount);
  return d;
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfWeek(date) {
  const d = startOfDay(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function getMonthGrid(date) {
  const gridStart = startOfWeek(startOfMonth(date));
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function getWeekDays(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatMonthYear(date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function formatWeekRange(weekDays) {
  const startLabel = weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endLabel = weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}

export function formatFullDate(date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatDateShort(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatHourLabel(hour) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric' });
}

export function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
