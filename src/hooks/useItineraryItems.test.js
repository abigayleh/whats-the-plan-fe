import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useItineraryItems from './useItineraryItems';
import * as itinerariesApi from '../api/itineraries';
import { socket } from '../socket/socketClient';

vi.mock('../api/itineraries');
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

describe('useItineraryItems', () => {
  beforeEach(() => {
    itinerariesApi.tasks.mockResolvedValue([{ id: 't1', instanceId: 't1', title: 'Task', status: 'TODO', dueDate: START }]);
  });

  it('fetches the itinerary tasks for the range', async () => {
    const { result } = renderHook(() => useItineraryItems('it1', START, END));
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(itinerariesApi.tasks).toHaveBeenCalledWith('it1', { start: START, end: END });
    expect(result.current.items[0].origin).toBe('task');
  });

  it('does not fetch when the itinerary id or range is missing', () => {
    renderHook(() => useItineraryItems(null, START, END));
    expect(itinerariesApi.tasks).not.toHaveBeenCalled();
  });

  it('refetches on a task socket event', async () => {
    const { result } = renderHook(() => useItineraryItems('it1', START, END));
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    itinerariesApi.tasks.mockClear();
    await act(async () => { socket.__emit('task:created'); });
    expect(itinerariesApi.tasks).toHaveBeenCalledTimes(1);
  });

  it('keeps the last items when a refetch fails', async () => {
    const { result } = renderHook(() => useItineraryItems('it1', START, END));
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    itinerariesApi.tasks.mockRejectedValueOnce(new Error('boom'));
    await act(async () => { socket.__emit('task:updated'); });
    expect(result.current.items).toHaveLength(1);
  });
});