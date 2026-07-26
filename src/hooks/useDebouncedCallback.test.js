import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useDebouncedCallback from './useDebouncedCallback';

describe('useDebouncedCallback', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fires the callback once after the delay', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 200));
    act(() => result.current[0]('a'));
    expect(fn).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(200));
    expect(fn).toHaveBeenCalledExactlyOnceWith('a');
  });

  it('collapses rapid calls into one with the latest args', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 100));
    act(() => {
      result.current[0](1);
      result.current[0](2);
      result.current[0](3);
    });
    act(() => vi.advanceTimersByTime(100));
    expect(fn).toHaveBeenCalledExactlyOnceWith(3);
  });

  it('flush runs a pending call immediately and cancels the timer', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 500));
    act(() => result.current[0]('now'));
    act(() => result.current[1]());
    expect(fn).toHaveBeenCalledExactlyOnceWith('now');
    act(() => vi.advanceTimersByTime(500));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('flush with nothing pending is a no-op', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 500));
    act(() => result.current[1]());
    expect(fn).not.toHaveBeenCalled();
  });

  it('flushes a pending call on unmount', () => {
    const fn = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(fn, 500));
    act(() => result.current[0]('bye'));
    unmount();
    expect(fn).toHaveBeenCalledExactlyOnceWith('bye');
  });

  it('uses the latest callback reference', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ cb }) => useDebouncedCallback(cb, 100), {
      initialProps: { cb: first },
    });
    act(() => result.current[0]('x'));
    rerender({ cb: second });
    act(() => vi.advanceTimersByTime(100));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledExactlyOnceWith('x');
  });
});