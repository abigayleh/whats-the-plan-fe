import { useState, useEffect, useCallback } from 'react';
import * as itinerariesApi from '../api/itineraries';
import useSocketEvents from './useSocketEvents';
import { adaptCalendarTask } from '../api/adapters';

const EVENTS = ['task:created', 'task:updated', 'task:deleted'];

// Expanded to-do occurrences for one itinerary's visible range — the calendar-grid feed for
// its week/day views. Mirrors useCalendarItems, scoped to the itinerary's own tasks endpoint.
export default function useItineraryItems(itineraryId, startISO, endISO) {
  const [items, setItems] = useState([]);

  const refetch = useCallback(async () => {
    if (!itineraryId || !startISO || !endISO) return;
    try {
      const rows = await itinerariesApi.tasks(itineraryId, { start: startISO, end: endISO });
      setItems(rows.map(adaptCalendarTask));
    } catch {
      // ignore — keep the last known items
    }
  }, [itineraryId, startISO, endISO]);

  useEffect(() => { refetch(); }, [refetch]);
  useSocketEvents(EVENTS, refetch);

  return { items, refetch };
}