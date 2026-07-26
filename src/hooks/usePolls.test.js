import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import usePolls from './usePolls';
import * as pollsApi from '../api/polls';
import { socket } from '../socket/socketClient';

vi.mock('../api/polls');
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

const poll = (id, groupId, createdAt) => ({
  id, groupId, question: `Q${id}`, options: [], totalVotes: 0, myVote: null, createdAt,
});

describe('usePolls', () => {
  beforeEach(() => {
    pollsApi.listForGroup.mockImplementation((gid) => {
      if (gid === 'g1') return Promise.resolve([poll('p1', 'g1', '2026-01-01T00:00:00Z')]);
      if (gid === 'g2') return Promise.resolve([poll('p2', 'g2', '2026-02-01T00:00:00Z')]);
      return Promise.resolve([]);
    });
  });

  it('gathers polls across groups sorted newest-first', async () => {
    const groups = [{ id: 'g1' }, { id: 'g2' }];
    const { result } = renderHook(() => usePolls(groups));
    await waitFor(() => expect(result.current.polls).toHaveLength(2));
    expect(result.current.polls.map((p) => p.id)).toEqual(['p2', 'p1']);
  });

  it('returns no polls and skips fetching when there are no groups', async () => {
    const { result } = renderHook(() => usePolls([]));
    await waitFor(() => expect(result.current.polls).toEqual([]));
    expect(pollsApi.listForGroup).not.toHaveBeenCalled();
  });

  it('tolerates one group failing without dropping the others', async () => {
    pollsApi.listForGroup.mockImplementation((gid) => (gid === 'g1'
      ? Promise.reject(new Error('403'))
      : Promise.resolve([poll('p2', 'g2', '2026-02-01T00:00:00Z')])));
    const { result } = renderHook(() => usePolls([{ id: 'g1' }, { id: 'g2' }]));
    await waitFor(() => expect(result.current.polls).toHaveLength(1));
    expect(result.current.polls[0].id).toBe('p2');
  });

  it('refetches on a poll socket event', async () => {
    const { result } = renderHook(() => usePolls([{ id: 'g1' }]));
    await waitFor(() => expect(result.current.polls).toHaveLength(1));
    pollsApi.listForGroup.mockClear();
    await act(async () => { socket.__emit('poll:vote'); });
    expect(pollsApi.listForGroup).toHaveBeenCalledTimes(1);
  });
});