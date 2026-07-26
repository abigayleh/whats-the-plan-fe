import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useGroupMembers from './useGroupMembers';
import * as groupsApi from '../api/groups';

vi.mock('../api/groups');

describe('useGroupMembers', () => {
  beforeEach(() => {
    groupsApi.get.mockResolvedValue({ id: 'g1', members: [{ userId: 'u1' }, { userId: 'u2' }] });
  });

  it('returns no members without a groupId', () => {
    const { result } = renderHook(() => useGroupMembers(null));
    expect(result.current).toEqual([]);
    expect(groupsApi.get).not.toHaveBeenCalled();
  });

  it('loads the group members', async () => {
    const { result } = renderHook(() => useGroupMembers('g1'));
    await waitFor(() => expect(result.current).toHaveLength(2));
    expect(groupsApi.get).toHaveBeenCalledWith('g1');
  });

  it('falls back to an empty list when the fetch rejects', async () => {
    groupsApi.get.mockRejectedValueOnce(new Error('403'));
    const { result } = renderHook(() => useGroupMembers('g1'));
    await waitFor(() => expect(groupsApi.get).toHaveBeenCalled());
    expect(result.current).toEqual([]);
  });

  it('defaults to an empty list when the group has no members field', async () => {
    groupsApi.get.mockResolvedValueOnce({ id: 'g1' });
    const { result } = renderHook(() => useGroupMembers('g1'));
    await waitFor(() => expect(groupsApi.get).toHaveBeenCalled());
    expect(result.current).toEqual([]);
  });

  it('resets to empty when the groupId is cleared', async () => {
    const { result, rerender } = renderHook(({ id }) => useGroupMembers(id), {
      initialProps: { id: 'g1' },
    });
    await waitFor(() => expect(result.current).toHaveLength(2));
    rerender({ id: null });
    expect(result.current).toEqual([]);
  });
});