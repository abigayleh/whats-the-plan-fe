import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useCalendarItems from './useCalendarItems';
import * as eventsApi from '../api/events';
import * as tasksApi from '../api/tasks';
import { socket } from '../socket/socketClient';

vi.mock('../api/events');
vi.mock('../api/tasks');
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

const START = '2026-01-01T00:00:00Z';
const END = '2026-01-31T00:00:00Z';

describe('useCalendarItems', () => {
  beforeEach(() => {
    eventsApi.list.mockResolvedValue([{ id: 'e1', instanceId: 'e1', title: 'Event', startAt: START, endAt: END }]);
    tasksApi.calendar.mockResolvedValue([{ id: 't1', instanceId: 't1', title: 'Task', status: 'TODO', dueDate: START }]);
  });

  it('fetches events and tasks for the range on mount', async () => {
    const { result } = renderHook(() => useCalendarItems(START, END));
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(eventsApi.list).toHaveBeenCalledWith({ start: START, end: END });
    expect(tasksApi.calendar).toHaveBeenCalledWith({ start: START, end: END });
    expect(result.current.items.map((i) => i.origin)).toEqual(['event', 'task']);
  });

  it('does not fetch when the range is incomplete', () => {
    renderHook(() => useCalendarItems(null, END));
    expect(eventsApi.list).not.toHaveBeenCalled();
  });

  it('refetches when a socket event fires', async () => {
    const { result } = renderHook(() => useCalendarItems(START, END));
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    eventsApi.list.mockClear();
    await act(async () => { socket.__emit('event:updated'); });
    expect(eventsApi.list).toHaveBeenCalledTimes(1);
  });

  it('refetches on reconnect, since anything broadcast while it was down is lost', async () => {
    const { result } = renderHook(() => useCalendarItems(START, END));
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    eventsApi.list.mockClear();
    await act(async () => { socket.__emit('connect'); });
    expect(eventsApi.list).toHaveBeenCalledTimes(1);
  });

  it('keeps the last items when a refetch fails', async () => {
    const { result } = renderHook(() => useCalendarItems(START, END));
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    eventsApi.list.mockRejectedValueOnce(new Error('network'));
    await act(async () => { socket.__emit('task:deleted'); });
    expect(result.current.items).toHaveLength(2);
  });

  it('unsubscribes socket handlers on unmount', async () => {
    const offSpy = vi.spyOn(socket, 'off');
    const { unmount } = renderHook(() => useCalendarItems(START, END));
    unmount();
    expect(offSpy).toHaveBeenCalled();
  });
});