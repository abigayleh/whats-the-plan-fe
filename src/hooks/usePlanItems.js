import useAppData from './useAppData';
import * as eventsApi from '../api/events';
import { toBeItem } from '../api/adapters';
import { isTaskTimed } from '../utils/tasks';
import { startOfDay } from '../utils/date';

// Single write surface for PlanItems (events + to-dos): the origin === 'event' ? eventsApi
// : listsApi(-via-AppProvider) branch is only allowed to live here — pages call these methods
// and never see the split. `item` is null on create; on edit it's an object carrying
// `origin`/`sourceId` (see api/adapters.js for what those mean).
export default function usePlanItems() {
  const {
    tasks, addTask, updateTask, deleteTask, toggleTaskStatus,
  } = useAppData();

  async function saveItem(item, payload) {
    const origin = item?.origin ?? payload.origin;
    if (origin === 'event') {
      const body = toBeItem(payload, 'event');
      if (item) await eventsApi.update(item.sourceId, body);
      else await eventsApi.create(body);
      return {};
    }
    const taskPayload = { ...payload };
    delete taskPayload.origin;
    if (item) {
      await updateTask(item.sourceId, taskPayload);
      return {};
    }
    return addTask(taskPayload);
  }

  async function deleteItem(item) {
    if (item.origin === 'event') {
      await eventsApi.remove(item.sourceId);
      return;
    }
    await deleteTask(item.sourceId);
  }

  // Events have no completion concept — a no-op keeps callers origin-agnostic.
  async function toggleStatus(item) {
    if (item.origin === 'event') return;
    await toggleTaskStatus(item.sourceId);
  }

  // Dragging preserves an item's kind: an event always stays timed (dropping it on the
  // all-day row is a no-op, handled by the `!timed` early return below); a timed to-do keeps
  // its duration; a due-date-only (or fully unscheduled) to-do moves day, unless it's dropped
  // on a timed slot — that promotes it to a timed to-do instead (e.g. dragging an unscheduled
  // to-do onto the calendar).
  async function moveItem(item, {
    day, hour, minute = 0, timed,
  }) {
    if (item.origin === 'event') {
      if (!timed) return;
      const duration = item.scheduledEnd - item.scheduledStart;
      const start = new Date(day);
      start.setHours(hour, minute, 0, 0);
      await eventsApi.update(item.sourceId, toBeItem({
        scheduledStart: start,
        scheduledEnd: new Date(start.getTime() + duration),
      }, 'event'));
      return;
    }

    const task = tasks.find((t) => t.id === item.sourceId);
    if (!task) return;
    if (!isTaskTimed(task)) {
      if (timed) {
        const start = new Date(day);
        start.setHours(hour, minute, 0, 0);
        await updateTask(task.id, {
          scheduledStart: start,
          scheduledEnd: new Date(start.getTime() + 60 * 60000),
          dueDate: null,
        });
        return;
      }
      await updateTask(task.id, { dueDate: startOfDay(day) });
      return;
    }
    const duration = task.scheduledEnd - task.scheduledStart;
    const start = new Date(day);
    if (timed) start.setHours(hour, minute, 0, 0);
    else start.setHours(task.scheduledStart.getHours(), task.scheduledStart.getMinutes(), 0, 0);
    await updateTask(task.id, { scheduledStart: start, scheduledEnd: new Date(start.getTime() + duration) });
  }

  return {
    saveItem, deleteItem, toggleStatus, moveItem,
  };
}
