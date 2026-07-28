import {
  useState, useEffect, useCallback, useRef,
} from 'react';
import * as itinerariesApi from '../api/itineraries';
import { adaptItinerary } from '../api/adapters';
import { socket } from '../socket/socketClient';

const EVENTS = ['itinerary:created', 'itinerary:updated', 'itinerary:deleted'];

// Itineraries live only on their own route, so they get a self-contained store (like usePages).
export default function useItineraries() {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const latest = useRef(0);
  // Mirrors the current itineraries so an optimistic write can snapshot them immediately,
  // without waiting for React to run a state updater.
  const current = useRef(itineraries);
  current.current = itineraries;

  const refresh = useCallback(async () => {
    // Ticketed so a slower earlier fetch never overwrites a newer one.
    const ticket = latest.current + 1;
    latest.current = ticket;
    try {
      const rows = await itinerariesApi.list();
      if (ticket !== latest.current) return;
      setItineraries(rows.map(adaptItinerary));
      setError(null);
    } catch (err) {
      // A failed refresh keeps the last known itineraries, but it must still be visible:
      // an empty sidebar with no message reads as "your trips were deleted".
      if (ticket === latest.current) setError(err?.message || 'Could not load itineraries');
    } finally {
      if (ticket === latest.current) setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const on = () => refresh();
    EVENTS.forEach((e) => socket.on(e, on));
    return () => EVENTS.forEach((e) => socket.off(e, on));
  }, [refresh]);

  const addItinerary = useCallback(async (body) => {
    const created = await itinerariesApi.create(body);
    await refresh();
    return adaptItinerary(created);
  }, [refresh]);

  const updateItinerary = useCallback(async (id, patch) => {
    await itinerariesApi.update(id, patch);
    await refresh();
  }, [refresh]);

  // completedAt drives the sidebar's Active/Completed split; null restores an itinerary.
  const setCompleted = useCallback(
    (id, done) => updateItinerary(id, { completedAt: done ? new Date().toISOString() : null }),
    [updateItinerary],
  );

  // Optimistic: reorder locally at once, then let the write (and socket refresh) confirm it;
  // roll back to the pre-drop snapshot if the write fails. `ids` is the full new order.
  const reorderItineraries = useCallback(async (ids) => {
    const snapshot = current.current;
    const index = new Map(ids.map((id, i) => [id, i]));
    setItineraries(
      (prev) => [...prev].sort((a, b) => (index.get(a.id) ?? Infinity) - (index.get(b.id) ?? Infinity)),
    );
    try {
      await itinerariesApi.reorder(ids);
    } catch {
      setItineraries(snapshot);
    }
  }, []);

  const deleteItinerary = useCallback(async (id) => {
    await itinerariesApi.remove(id);
    await refresh();
  }, [refresh]);

  return {
    itineraries,
    loading,
    error,
    refresh,
    addItinerary,
    updateItinerary,
    setCompleted,
    reorderItineraries,
    deleteItinerary,
  };
}
