import { useState, useEffect, useCallback } from 'react';
import * as eventsApi from '../api/events';
import * as tasksApi from '../api/tasks';
import { socket } from '../socket/socketClient';

// BE event instance → unified calendar item (a "timed" item).
// recurrenceRule is nulled for placement (BE already expanded); `rule` is kept for editing.
function adaptEvent(ev) {
  return {
    id: ev.instanceId,
    eventId: ev.id,
    isEvent: true,
    title: ev.title,
    description: ev.description || '',
    groupId: ev.groupId ?? null,
    scheduledStart: new Date(ev.startAt),
    scheduledEnd: new Date(ev.endAt),
    dueDate: null,
    status: null,
    recurrenceRule: null,
    isRecurring: ev.isRecurring,
    rule: ev.recurrenceRule,
  };
}

// BE due-task → unified calendar item (a "to-do" item).
function adaptTask(t) {
  return {
    id: `task-${t.id}`,
    taskId: t.id,
    listId: t.listId,
    isEvent: false,
    title: t.title,
    description: t.description || '',
    groupId: t.groupId ?? null,
    scheduledStart: null,
    scheduledEnd: null,
    dueDate: t.dueDate ? new Date(t.dueDate) : null,
    status: t.status === 'DONE' ? 'done' : 'todo',
    recurrenceRule: null,
    isRecurring: false,
    assignedToId: t.assignedToId,
  };
}

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
      setItems([...events.map(adaptEvent), ...tasks.map(adaptTask)]);
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
