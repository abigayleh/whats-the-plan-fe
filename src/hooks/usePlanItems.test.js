import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { renderHook } from '@testing-library/react';
import usePlanItems from './usePlanItems';
import useAppData from './useAppData';
import * as eventsApi from '../api/events';

vi.mock('./useAppData', () => ({ default: vi.fn() }));
vi.mock('../api/events');

let store;

beforeEach(() => {
  store = {
    tasks: [],
    addTask: vi.fn().mockResolvedValue({ task: { id: 'task-new', origin: 'task', sourceId: 'task-new' } }),
    updateTask: vi.fn().mockResolvedValue({}),
    deleteTask: vi.fn().mockResolvedValue({}),
    toggleTask: vi.fn().mockResolvedValue({}),
  };
  useAppData.mockReturnValue(store);
  eventsApi.create.mockResolvedValue({ id: 'ev-new', title: 'E' });
  eventsApi.update.mockResolvedValue({});
  eventsApi.remove.mockResolvedValue({});
});

const setup = () => renderHook(() => usePlanItems()).result;

describe('usePlanItems.saveItem', () => {
  it('creates a new event via the events API', async () => {
    const out = await setup().current.saveItem(null, { origin: 'event', title: 'E' });
    expect(eventsApi.create).toHaveBeenCalled();
    expect(out.item.origin).toBe('event');
  });

  it('creates a new to-do via addTask, stripping origin', async () => {
    const out = await setup().current.saveItem(null, { origin: 'task', title: 'T' });
    expect(store.addTask).toHaveBeenCalledWith({ title: 'T' });
    expect(out.item.id).toBe('task-new');
  });

  it('updates an event in place', async () => {
    const item = { origin: 'event', sourceId: 'e1' };
    const out = await setup().current.saveItem(item, { origin: 'event', title: 'X' });
    expect(eventsApi.update).toHaveBeenCalledWith('e1', expect.objectContaining({ title: 'X' }));
    expect(out).toEqual({});
  });

  it('updates a to-do in place', async () => {
    const item = { origin: 'task', sourceId: 't1' };
    const out = await setup().current.saveItem(item, { origin: 'task', title: 'Y' });
    expect(store.updateTask).toHaveBeenCalledWith('t1', { title: 'Y' });
    expect(out).toEqual({});
  });

  it('converts an event to a to-do: create new then delete the old event', async () => {
    const item = { origin: 'event', sourceId: 'e1' };
    await setup().current.saveItem(item, { origin: 'task', title: 'Now a todo' });
    expect(store.addTask).toHaveBeenCalled();
    expect(eventsApi.remove).toHaveBeenCalledWith('e1');
  });

  it('warns when the original cannot be removed during a conversion', async () => {
    eventsApi.remove.mockRejectedValueOnce(new Error('gone'));
    const item = { origin: 'event', sourceId: 'e1' };
    const out = await setup().current.saveItem(item, { origin: 'task', title: 'Convert' });
    expect(out.warning).toMatch(/couldn't remove the original/);
  });
});

describe('usePlanItems.deleteItem', () => {
  it('removes an event via the events API', async () => {
    await setup().current.deleteItem({ origin: 'event', sourceId: 'e1' });
    expect(eventsApi.remove).toHaveBeenCalledWith('e1');
  });

  it('removes a to-do via deleteTask', async () => {
    await setup().current.deleteItem({ origin: 'task', sourceId: 't1' });
    expect(store.deleteTask).toHaveBeenCalledWith('t1');
  });
});

describe('usePlanItems.toggleStatus', () => {
  it('is a no-op for events', async () => {
    await setup().current.toggleStatus({ origin: 'event', sourceId: 'e1' });
    expect(store.toggleTask).not.toHaveBeenCalled();
  });

  it('toggles a plain to-do without naming a day', async () => {
    await setup().current.toggleStatus({ origin: 'task', sourceId: 't1', isRecurring: false });
    expect(store.toggleTask).toHaveBeenCalledWith('t1', undefined);
  });

  it('toggles a recurring to-do on the occurrence\u2019s own day', async () => {
    const due = new Date('2026-01-10T00:00:00Z');
    const item = {
      origin: 'task', sourceId: 't1', isRecurring: true, dueDate: due, status: 'todo',
    };
    await setup().current.toggleStatus(item);
    expect(store.toggleTask).toHaveBeenCalledWith('t1', due);
  });
});

describe('usePlanItems.moveItem', () => {
  it('reschedules a timed event, preserving its duration', async () => {
    const item = {
      origin: 'event',
      sourceId: 'e1',
      scheduledStart: new Date('2026-01-01T09:00:00'),
      scheduledEnd: new Date('2026-01-01T10:00:00'),
    };
    await setup().current.moveItem(item, {
      day: new Date('2026-02-01T00:00:00'), hour: 13, timed: true,
    });
    const [, body] = eventsApi.update.mock.calls.at(-1);
    expect(new Date(body.endAt) - new Date(body.startAt)).toBe(3600000);
  });

  it('ignores dropping an event onto the all-day row', async () => {
    const item = { origin: 'event', sourceId: 'e1', scheduledStart: new Date(), scheduledEnd: new Date() };
    await setup().current.moveItem(item, { day: new Date(), timed: false });
    expect(eventsApi.update).not.toHaveBeenCalled();
  });

  it('moves an untimed to-do to a new day', async () => {
    store.tasks = [{ id: 't1', dueDate: new Date('2026-01-01T00:00:00') }];
    await setup().current.moveItem({ origin: 'task', sourceId: 't1' }, {
      day: new Date('2026-03-05T00:00:00'), timed: false,
    });
    const [, patch] = store.updateTask.mock.calls.at(-1);
    expect(patch.dueDate).toBeInstanceOf(Date);
  });

  it('promotes an untimed to-do to a timed slot', async () => {
    store.tasks = [{ id: 't1', dueDate: new Date('2026-01-01T00:00:00') }];
    await setup().current.moveItem({ origin: 'task', sourceId: 't1' }, {
      day: new Date('2026-03-05T00:00:00'), hour: 8, timed: true,
    });
    const [, patch] = store.updateTask.mock.calls.at(-1);
    expect(patch.dueDate).toBeNull();
    expect(patch.scheduledStart).toBeInstanceOf(Date);
  });

  it('reschedules a timed to-do, preserving its duration', async () => {
    store.tasks = [{
      id: 't1',
      scheduledStart: new Date('2026-01-01T09:00:00'),
      scheduledEnd: new Date('2026-01-01T10:30:00'),
    }];
    await setup().current.moveItem({ origin: 'task', sourceId: 't1' }, {
      day: new Date('2026-03-05T00:00:00'), hour: 15, timed: true,
    });
    const [, patch] = store.updateTask.mock.calls.at(-1);
    expect(patch.scheduledEnd - patch.scheduledStart).toBe(90 * 60000);
  });

  it('is a no-op when the to-do is not in the store', async () => {
    store.tasks = [];
    await setup().current.moveItem({ origin: 'task', sourceId: 'missing' }, { day: new Date(), timed: false });
    expect(store.updateTask).not.toHaveBeenCalled();
  });
});