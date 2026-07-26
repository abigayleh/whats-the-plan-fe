import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import usePages from './usePages';
import * as pagesApi from '../api/pages';
import { socket } from '../socket/socketClient';

vi.mock('../api/pages');
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

const rows = [
  { id: 'a', title: 'A', parentId: null, position: 0 },
  { id: 'b', title: 'B', parentId: null, position: 1 },
];

describe('usePages', () => {
  beforeEach(() => {
    pagesApi.list.mockResolvedValue(rows);
    pagesApi.create.mockResolvedValue({ id: 'c', title: 'C' });
    pagesApi.update.mockResolvedValue({});
    pagesApi.reorder.mockResolvedValue({});
    pagesApi.remove.mockResolvedValue({});
  });

  it('loads pages and clears loading', async () => {
    const { result } = renderHook(() => usePages());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pages).toHaveLength(2);
  });

  it('adds a page and returns the adapted row', async () => {
    const { result } = renderHook(() => usePages());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let created;
    await act(async () => { created = await result.current.addPage({ title: 'C' }); });
    expect(pagesApi.create).toHaveBeenCalledWith({ title: 'C' });
    expect(created.id).toBe('c');
  });

  it('movePage patches only the parentId', async () => {
    const { result } = renderHook(() => usePages());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.movePage('a', 'b'); });
    expect(pagesApi.update).toHaveBeenCalledWith('a', { parentId: 'b' });
  });

  it('saveContent patches content without a refresh', async () => {
    const { result } = renderHook(() => usePages());
    await waitFor(() => expect(result.current.loading).toBe(false));
    pagesApi.list.mockClear();
    await act(async () => { await result.current.saveContent('a', '<p>hi</p>'); });
    expect(pagesApi.update).toHaveBeenCalledWith('a', { content: '<p>hi</p>' });
    expect(pagesApi.list).not.toHaveBeenCalled();
  });

  it('reorderPages optimistically reflows the tree', async () => {
    const { result } = renderHook(() => usePages());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.reorderPages(null, ['b', 'a']); });
    expect(pagesApi.reorder).toHaveBeenCalledWith(null, ['b', 'a']);
    const b = result.current.pages.find((p) => p.id === 'b');
    expect(b.position).toBe(0);
  });

  it('reorderPages rolls back when the write fails', async () => {
    const { result } = renderHook(() => usePages());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const before = result.current.pages;
    // Defer the rejection so the optimistic render commits first — this mirrors a real
    // network failure. The rollback snapshot is captured inside the optimistic setPages
    // updater, so it is only valid once that updater has run.
    let rejectReorder;
    pagesApi.reorder.mockReturnValueOnce(new Promise((_, rej) => { rejectReorder = rej; }));
    let pending;
    await act(async () => { pending = result.current.reorderPages(null, ['b', 'a']); });
    await act(async () => {
      rejectReorder(new Error('nope'));
      await pending;
    });
    expect(result.current.pages).toEqual(before);
  });

  it('deletes a page and refreshes', async () => {
    const { result } = renderHook(() => usePages());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.deletePage('a'); });
    expect(pagesApi.remove).toHaveBeenCalledWith('a');
  });

  it('refreshes on a socket event', async () => {
    const { result } = renderHook(() => usePages());
    await waitFor(() => expect(result.current.loading).toBe(false));
    pagesApi.list.mockClear();
    await act(async () => { socket.__emit('page:created'); });
    expect(pagesApi.list).toHaveBeenCalledTimes(1);
  });
});