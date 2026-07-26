import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useNow from './useNow';

describe('useNow', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns a Date on mount', () => {
    const { result } = renderHook(() => useNow());
    expect(result.current).toBeInstanceOf(Date);
  });

  it('advances roughly once a minute', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const { result } = renderHook(() => useNow());
    const first = result.current;
    act(() => vi.advanceTimersByTime(60000));
    expect(result.current.getTime()).toBe(first.getTime() + 60000);
  });

  it('does not tick before a full minute elapses', () => {
    const { result } = renderHook(() => useNow());
    const first = result.current;
    act(() => vi.advanceTimersByTime(59000));
    expect(result.current).toBe(first);
  });

  it('clears the interval on unmount', () => {
    const spy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = renderHook(() => useNow());
    unmount();
    expect(spy).toHaveBeenCalled();
  });
});