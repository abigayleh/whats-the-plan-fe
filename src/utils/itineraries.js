import { arrayMove } from '@dnd-kit/sortable';
import { isScheduled } from '../constants/itinerary';

// Sidebar grouping: a trip without dates is still being planned (it only knows how many
// days it should run), a dated one is planned, and completedAt wins over both.
export function groupItineraries(itineraries) {
  const active = itineraries.filter((it) => !it.completedAt);
  return {
    unplanned: active.filter((it) => !isScheduled(it)),
    planned: active.filter(isScheduled),
    completed: itineraries.filter((it) => it.completedAt),
  };
}

// Moves one itinerary within its section, then splices that section's new order back into
// the full list — the API takes a single ordering, and other sections must not shift.
export function reorderWithinSection(itineraries, sectionIds, activeId, overId) {
  const from = sectionIds.indexOf(activeId);
  const to = sectionIds.indexOf(overId);
  if (from === -1 || to === -1 || from === to) return null;
  const moved = arrayMove(sectionIds, from, to);
  const inSection = new Set(sectionIds);
  let next = 0;
  return itineraries.map((it) => (inSection.has(it.id) ? moved[next++] : it.id));
}

// The trailing hint on a row: an unplanned trip shows its expected length, a completed
// one the year it ended. Anything else (no dates, no day count) shows nothing.
export function itineraryMeta(itinerary, completed) {
  if (completed) {
    const ended = itinerary.endDate ?? itinerary.startDate;
    return ended ? String(ended.getFullYear()) : null;
  }
  if (itinerary.startDate || !itinerary.dayCount) return null;
  return `${itinerary.dayCount} day${itinerary.dayCount === 1 ? '' : 's'}`;
}