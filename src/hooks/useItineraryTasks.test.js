import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useItineraryTasks from './useItineraryTasks';
import * as listsApi from '../api/lists';
import * as attachmentsApi from '../api/attachments';
import { socket } from '../socket/socketClient';

vi.mock('../api/lists');
vi.mock('../api/attachments');
vi.mock('../socket/socketClient', () => {
  const handlers = {};
  return {
    socket: {
      on: (e, fn) => { (handlers[e] ||= new Set()).add(fn); },
      off: (e, fn) => { handlers[e]?.delete(fn); },
      emit: vi.fn(),
      __emit: (e) => handlers[e]?.forEach((fn) => fn()),
    },
  };
});

const timedTask = {
  id: 't-timed', title: 'Timed', status: 'TODO',
  scheduledStart: '2026-01-10T09:00:00Z', scheduledEnd: '2026-01-10T10:00:00Z',
};
const untimedTask = { id: 't-due', title: 'Due', status: 'TODO', dueDate: '2026-01-10T00:00:00Z' };

describe('useItineraryTasks', () => {
  beforeEach(() => {
    listsApi.tasks.mockResolvedValue([timedTask, untimedTask]);
    listsApi.createTask.mockResolvedValue({ id: 'new', title: 'New', status: 'TODO' });
    listsApi.updateTask.mockResolvedValue({});
    listsApi.removeTask.mockResolvedValue({});
    attachmentsApi.sync.mockResolvedValue();
  });

  it('empties the list and skips fetching without a listId', async () => {
    const { result } = renderHook(() => useItineraryTasks(null));
    await waitFor(() => expect(result.current.listTasks).toEqual([]));
    expect(listsApi.tasks).not.toHaveBeenCalled();
  });

  it('loads and adapts the list tasks', async () => {
    const { result } = renderHook(() => useItineraryTasks('L1'));
    await waitFor(() => expect(result.current.listTasks).toHaveLength(2));
    expect(result.current.listTasks[0].origin).toBe('task');
  });

  it('creates a task and returns the adapted item', async () => {
    const { result } = renderHook(() => useItineraryTasks('L1'));
    await waitFor(() => expect(result.current.listTasks).toHaveLength(2));
    let out;
    await act(async () => { out = await result.current.saveItem(null, { title: 'New' }); });
    expect(listsApi.createTask).toHaveBeenCalledWith('L1', expect.objectContaining({ title: 'New' }));
    expect(out.item.id).toBe('new');
    expect(out.attachmentError).toBeNull();
  });

  it('reports an attachment error without failing the create', async () => {
    attachmentsApi.sync.mockRejectedValueOnce(new Error('upload failed'));
    const { result } = renderHook(() => useItineraryTasks('L1'));
    await waitFor(() => expect(result.current.listTasks).toHaveLength(2));
    let out;
    await act(async () => {
      out = await result.current.saveItem(null, { title: 'New', attachments: [{ file: {} }] });
    });
    expect(out.attachmentError).toBe('upload failed');
  });

  it('updates an existing task in place', async () => {
    const { result } = renderHook(() => useItineraryTasks('L1'));
    await waitFor(() => expect(result.current.listTasks).toHaveLength(2));
    await act(async () => {
      await result.current.saveItem({ sourceId: 't-timed' }, { title: 'Renamed', origin: 'task' });
    });
    expect(listsApi.updateTask).toHaveBeenCalledWith('L1', 't-timed', expect.objectContaining({ title: 'Renamed' }));
  });

  it('deletes a task and refreshes', async () => {
    const { result } = renderHook(() => useItineraryTasks('L1'));
    await waitFor(() => expect(result.current.listTasks).toHaveLength(2));
    await act(async () => { await result.current.deleteItem({ sourceId: 't-timed' }); });
    expect(listsApi.removeTask).toHaveBeenCalledWith('L1', 't-timed');
  });

  it('toggleStatus flips a plain to-do between DONE and TODO', async () => {
    const { result } = renderHook(() => useItineraryTasks('L1'));
    await waitFor(() => expect(result.current.listTasks).toHaveLength(2));
    await act(async () => {
      await result.current.toggleStatus({ sourceId: 't-timed', status: 'todo', isRecurring: false });
    });
    expect(listsApi.updateTask).toHaveBeenCalledWith('L1', 't-timed', { status: 'DONE' });
  });

  it('toggleStatus on a recurring occurrence sends the occurrence date', async () => {
    const { result } = renderHook(() => useItineraryTasks('L1'));
    await waitFor(() => expect(result.current.listTasks).toHaveLength(2));
    const date = new Date('2026-01-10T09:00:00Z');
    await act(async () => {
      await result.current.toggleStatus({ sourceId: 't-timed', isRecurring: true, scheduledStart: date });
    });
    expect(listsApi.updateTask).toHaveBeenCalledWith('L1', 't-timed', { occurrenceDate: date.toISOString() });
  });

  it('moveItem promotes an untimed to-do to a timed slot', async () => {
    const { result } = renderHook(() => useItineraryTasks('L1'));
    await waitFor(() => expect(result.current.listTasks).toHaveLength(2));
    await act(async () => {
      await result.current.moveItem({ sourceId: 't-due' }, {
        day: new Date('2026-02-01T00:00:00'), hour: 14, timed: true,
      });
    });
    const [, , body] = listsApi.updateTask.mock.calls.at(-1);
    expect(body.dueDate).toBeNull();
    expect(body.scheduledStart).toBeTruthy();
  });

  it('moveItem on an unknown task is a no-op', async () => {
    const { result } = renderHook(() => useItineraryTasks('L1'));
    await waitFor(() => expect(result.current.listTasks).toHaveLength(2));
    listsApi.updateTask.mockClear();
    await act(async () => {
      await result.current.moveItem({ sourceId: 'missing' }, { day: new Date(), timed: false });
    });
    expect(listsApi.updateTask).not.toHaveBeenCalled();
  });

  it('refreshes on a socket event', async () => {
    const { result } = renderHook(() => useItineraryTasks('L1'));
    await waitFor(() => expect(result.current.listTasks).toHaveLength(2));
    listsApi.tasks.mockClear();
    await act(async () => { socket.__emit('task:updated'); });
    expect(listsApi.tasks).toHaveBeenCalledTimes(1);
  });
});