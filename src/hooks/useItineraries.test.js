import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useItineraries from './useItineraries';
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

const rows = [{ id: 'i1', title: 'Trip', createdById: 'u1' }];

describe('useItineraries', () => {
  beforeEach(() => {
    itinerariesApi.list.mockResolvedValue(rows);
    itinerariesApi.create.mockResolvedValue({ id: 'i2', title: 'New', createdById: 'u1' });
    itinerariesApi.update.mockResolvedValue({});
    itinerariesApi.remove.mockResolvedValue({});
  });

  it('loads itineraries and clears the loading flag', async () => {
    const { result } = renderHook(() => useItineraries());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.itineraries).toHaveLength(1);
    expect(result.current.itineraries[0].title).toBe('Trip');
  });

  it('adds an itinerary, refreshes, and returns the adapted row', async () => {
    const { result } = renderHook(() => useItineraries());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let created;
    await act(async () => { created = await result.current.addItinerary({ title: 'New' }); });
    expect(itinerariesApi.create).toHaveBeenCalledWith({ title: 'New' });
    expect(itinerariesApi.list).toHaveBeenCalledTimes(2);
    expect(created.id).toBe('i2');
  });

  it('updates an itinerary and refreshes', async () => {
    const { result } = renderHook(() => useItineraries());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.updateItinerary('i1', { title: 'X' }); });
    expect(itinerariesApi.update).toHaveBeenCalledWith('i1', { title: 'X' });
  });

  it('setCompleted(true) stamps completedAt and (false) clears it', async () => {
    const { result } = renderHook(() => useItineraries());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.setCompleted('i1', true); });
    expect(itinerariesApi.update).toHaveBeenCalledWith('i1', { completedAt: expect.any(String) });
    await act(async () => { await result.current.setCompleted('i1', false); });
    expect(itinerariesApi.update).toHaveBeenLastCalledWith('i1', { completedAt: null });
  });

  it('deletes an itinerary and refreshes', async () => {
    const { result } = renderHook(() => useItineraries());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.deleteItinerary('i1'); });
    expect(itinerariesApi.remove).toHaveBeenCalledWith('i1');
  });

  it('refreshes on a socket event', async () => {
    const { result } = renderHook(() => useItineraries());
    await waitFor(() => expect(result.current.loading).toBe(false));
    itinerariesApi.list.mockClear();
    await act(async () => { socket.__emit('itinerary:updated'); });
    expect(itinerariesApi.list).toHaveBeenCalledTimes(1);
  });

  it('keeps the last itineraries when a refresh fails', async () => {
    const { result } = renderHook(() => useItineraries());
    await waitFor(() => expect(result.current.itineraries).toHaveLength(1));
    itinerariesApi.list.mockRejectedValueOnce(new Error('down'));
    await act(async () => { socket.__emit('itinerary:deleted'); });
    expect(result.current.itineraries).toHaveLength(1);
  });
});