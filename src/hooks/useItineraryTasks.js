import {
  useState, useEffect, useCallback, useRef,
} from 'react';
import * as listsApi from '../api/lists';
import * as attachmentsApi from '../api/attachments';
import { adaptTask, toBeTask } from '../api/adapters';
import { isTaskTimed } from '../utils/tasks';
import { startOfDay, noonOf } from '../utils/date';
import useSocketEvents from './useSocketEvents';

const EVENTS = ['task:created', 'task:updated', 'task:deleted'];

// Self-contained store + write surface for one itinerary's list of to-dos. Itinerary tasks are
// siloed out of AppProvider, so this mirrors usePlanItems + AppProvider's task methods, scoped
// to a single known listId. Every itinerary to-do is a task — there are no bare events here.
export default function useItineraryTasks(listId) {
  const [listTasks, setListTasks] = useState([]);
  const latest = useRef(0);

  const refresh = useCallback(async () => {
    if (!listId) { setListTasks([]); return; }
    const ticket = latest.current + 1;
    latest.current = ticket;
    try {
      const rows = await listsApi.tasks(listId);
      if (ticket === latest.current) setListTasks(rows.map(adaptTask));
    } catch { /* keep the last known tasks */ }
  }, [listId]);

  useEffect(() => { refresh(); }, [refresh]);
  useSocketEvents(EVENTS, refresh);

  // Create returns { item, attachmentError? } so PlanItemModal can re-route later saves.
  const create = useCallback(async (payload) => {
    const { attachments = [], ...fields } = payload;
    const created = await listsApi.createTask(listId, toBeTask(fields));
    let attachmentError = null;
    if (attachments.length) {
      try { await attachmentsApi.sync(created.id, attachments, []); } catch (err) {
        attachmentError = err.message || 'Attachments failed to upload';
      }
    }
    await refresh();
    return { item: adaptTask(created), attachmentError };
  }, [listId, refresh]);

  const saveItem = useCallback(async (item, payload) => {
    if (!item) return create(payload);
    const { attachments, ...patch } = payload;
    delete patch.origin;
    try {
      if (Object.keys(patch).length) await listsApi.updateTask(listId, item.sourceId, toBeTask(patch));
      if (attachments) {
        const current = listTasks.find((t) => t.id === item.sourceId)?.attachments || [];
        await attachmentsApi.sync(item.sourceId, attachments, current);
      }
    } finally {
      await refresh(); // a partial write must not leave stale attachments behind for a retry
    }
    return {};
  }, [listId, create, refresh, listTasks]);

  const deleteItem = useCallback(async (item) => {
    await listsApi.removeTask(listId, item.sourceId);
    await refresh();
  }, [listId, refresh]);

  // One day of a repeating to-do, removed without touching the series.
  const skipOccurrence = useCallback(async (item, day) => {
    const when = day ?? item.scheduledStart ?? item.dueDate;
    if (!when) return;
    await listsApi.updateTask(listId, item.sourceId, { skipDate: noonOf(when).toISOString() });
    await refresh();
  }, [listId, refresh]);

  const toggleStatus = useCallback(async (item) => {
    // A recurring occurrence toggles only its own day; a plain to-do flips its whole status.
    if (item.isRecurring) {
      const date = item.scheduledStart ?? item.dueDate;
      if (!date) return;
      await listsApi.updateTask(listId, item.sourceId, { occurrenceDate: new Date(date).toISOString() });
    } else {
      const task = listTasks.find((t) => t.id === item.sourceId);
      const next = (task?.status ?? item.status) === 'done' ? 'TODO' : 'DONE';
      await listsApi.updateTask(listId, item.sourceId, { status: next });
    }
    await refresh();
  }, [listId, listTasks, refresh]);

  // Dragging: an untimed to-do moves day (or promotes to timed if dropped on a slot); a timed
  // to-do keeps its duration. Mirrors usePlanItems.moveItem for the to-do case.
  const moveItem = useCallback(async (item, {
    day, hour, minute = 0, timed,
  }) => {
    const task = listTasks.find((t) => t.id === item.sourceId);
    if (!task) return;
    let patch;
    if (!isTaskTimed(task)) {
      if (timed) {
        const start = new Date(day);
        start.setHours(hour, minute, 0, 0);
        patch = { scheduledStart: start, scheduledEnd: new Date(start.getTime() + 3600000), dueDate: null };
      } else {
        patch = { dueDate: startOfDay(day) };
      }
    } else {
      const duration = task.scheduledEnd - task.scheduledStart;
      const start = new Date(day);
      if (timed) start.setHours(hour, minute, 0, 0);
      else start.setHours(task.scheduledStart.getHours(), task.scheduledStart.getMinutes(), 0, 0);
      patch = { scheduledStart: start, scheduledEnd: new Date(start.getTime() + duration) };
    }
    await listsApi.updateTask(listId, task.id, toBeTask(patch));
    await refresh();
  }, [listId, listTasks, refresh]);

  return {
    listTasks, refresh, saveItem, deleteItem, skipOccurrence, toggleStatus, moveItem,
  };
}