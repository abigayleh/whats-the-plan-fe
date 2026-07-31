import {
  describe, it, expect, vi,
} from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useSocketEvents from './useSocketEvents';
import { socket } from '../socket/socketClient';

vi.mock('../socket/socketClient', () => {
  const handlers = {};
  return {
    socket: {
      on: (e, fn) => { (handlers[e] ||= new Set()).add(fn); },
      off: (e, fn) => { handlers[e]?.delete(fn); },
      __emit: (e, payload) => handlers[e]?.forEach((fn) => fn(payload)),
      __count: (e) => handlers[e]?.size ?? 0,
    },
  };
});

const EVENTS = ['task:created', 'task:updated'];

describe('useSocketEvents', () => {
  it('runs the handler for each subscribed event', () => {
    const handler = vi.fn();
    renderHook(() => useSocketEvents(EVENTS, handler));
    act(() => socket.__emit('task:created', { id: 't1' }));
    act(() => socket.__emit('task:updated', { id: 't1' }));
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenLastCalledWith({ id: 't1' });
  });

  it('also runs it on reconnect, with no payload to go on', () => {
    const handler = vi.fn();
    renderHook(() => useSocketEvents(EVENTS, handler));
    act(() => socket.__emit('connect'));
    expect(handler).toHaveBeenCalledWith(undefined);
  });

  it('stays unsubscribed when the handler is null', () => {
    renderHook(() => useSocketEvents(EVENTS, null));
    expect(socket.__count('task:created')).toBe(0);
    expect(socket.__count('connect')).toBe(0);
  });

  it('unsubscribes everything on unmount', () => {
    const { unmount } = renderHook(() => useSocketEvents(EVENTS, vi.fn()));
    unmount();
    expect(socket.__count('task:created')).toBe(0);
    expect(socket.__count('connect')).toBe(0);
  });
});