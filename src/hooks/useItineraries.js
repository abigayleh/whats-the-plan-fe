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
  const latest = useRef(0);

  const refresh = useCallback(async () => {
    // Ticketed so a slower earlier fetch never overwrites a newer one.
    const ticket = latest.current + 1;
    latest.current = ticket;
    try {
      const rows = await itinerariesApi.list();
      if (ticket !== latest.current) return;
      setItineraries(rows.map(adaptItinerary));
    } catch {
      // ignore — a failed refresh leaves the last known itineraries in place
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

  const deleteItinerary = useCallback(async (id) => {
    await itinerariesApi.remove(id);
    await refresh();
  }, [refresh]);

  return {
    itineraries, loading, refresh, addItinerary, updateItinerary, setCompleted, deleteItinerary,
  };
}
