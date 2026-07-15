import { useState, useEffect, useCallback } from 'react';
import * as eventsApi from '../api/events';
import * as tasksApi from '../api/tasks';
import { socket } from '../socket/socketClient';
import { adaptEvent, adaptCalendarTask } from '../api/adapters';

const EVENTS = ['event:created', 'event:updated', 'event:deleted', 'task:created', 'task:updated', 'task:deleted'];

// Fetches events + due-tasks for a visible range and keeps them fresh over sockets.
export default function useCalendarItems(startISO, endISO) {
  const [items, setItems] = useState([]);

  const refetch = useCallback(async () => {
    if (!startISO || !endISO) return;
    try {
      const [events, tasks] = await Promise.all([
        eventsApi.list({ start: startISO, end: endISO }),
        tasksApi.calendar({ start: startISO, end: endISO }),
      ]);
      setItems([...events.map(adaptEvent), ...tasks.map(adaptCalendarTask)]);
    } catch {
      // ignore — keep the last known items
    }
  }, [startISO, endISO]);

  useEffect(() => { refetch(); }, [refetch]);

  useEffect(() => {
    const on = () => refetch();
    EVENTS.forEach((e) => socket.on(e, on));
    return () => EVENTS.forEach((e) => socket.off(e, on));
  }, [refetch]);

  return { items, refetch };
}
