import useAppData from './useAppData';
import * as eventsApi from '../api/events';
import { toBeItem, adaptItem } from '../api/adapters';
import { isTaskTimed } from '../utils/tasks';
import { startOfDay } from '../utils/date';

// Single write surface for PlanItems (events + to-dos): the origin === 'event' ? eventsApi
// : listsApi(-via-AppProvider) branch is only allowed to live here — pages call these methods
// and never see the split. `item` is null on create; on edit it's an object carrying
// `origin`/`sourceId` (see api/adapters.js for what those mean).
export default function usePlanItems() {
  const {
    tasks, addTask, updateTask, deleteTask, toggleTask, skipTaskDay,
  } = useAppData();

  // Creates a fresh event or to-do from a payload; returns `{ item, attachmentError? }` — the
  // adapted, newly-persisted item — so callers can start routing subsequent saves as updates.
  async function createByOrigin(target, payload) {
    if (target === 'event') {
      const created = await eventsApi.create(toBeItem(payload, 'event'));
      return { item: adaptItem(created, 'event') };
    }
    const taskPayload = { ...payload };
    delete taskPayload.origin;
    const { task, attachmentError } = await addTask(taskPayload);
    return { item: task, attachmentError };
  }

  // Saves the PlanItem: in-place update when the kind is unchanged; create-then-delete when
  // converting between an event and a to-do (they're separate DB entities). On create/convert
  // returns `{ item }` so the modal re-routes later saves; a plain update returns `{}`.
  async function saveItem(item, payload) {
    // Partial updates (e.g. push-to-tomorrow) send no origin — fall back to the item's own kind,
    // so they route to an in-place update rather than being mistaken for a conversion.
    const target = payload.origin ?? item?.origin;
    if (item && item.origin === target) {
      if (target === 'event') {
        await eventsApi.update(item.sourceId, toBeItem(payload, 'event'));
        return {};
      }
      const taskPayload = { ...payload };
      delete taskPayload.origin;
      await updateTask(item.sourceId, taskPayload);
      return {};
    }
    // New item, or converting kind (event ↔ to-do): create the new entity, then drop the old.
    const created = await createByOrigin(target, payload);
    if (item) {
      try {
        await deleteItem(item);
      } catch {
        // The new entity is already saved; re-point to it (returning `created` so the modal
        // re-routes) rather than losing the reference, but warn that the original is orphaned.
        return { ...created, warning: "Converted, but couldn't remove the original — delete it manually." };
      }
    }
    return created;
  }

  // A recurring occurrence is never deleted from the calendar — its day is skipped instead.
  async function skipOccurrence(item, day) {
    if (item.origin === 'event') return;
    await skipTaskDay(item.sourceId, day ?? item.scheduledStart ?? item.dueDate);
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
    // A calendar occurrence names the day it stands for; a raw to-do row doesn't, and letting
    // it pass its own date would tick the day the series started rather than the one on screen.
    await toggleTask(item.sourceId, item.isRecurring ? (item.scheduledStart ?? item.dueDate) : undefined);
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
    saveItem, deleteItem, skipOccurrence, toggleStatus, moveItem,
  };
}
