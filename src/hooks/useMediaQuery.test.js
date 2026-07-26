import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useMediaQuery from './useMediaQuery';

// jsdom has no matchMedia — install a controllable mock that records listeners.
function installMatchMedia(initialMatches = false) {
  const state = { matches: initialMatches, listeners: new Set() };
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: state.matches,
    media: query,
    addEventListener: (_e, cb) => state.listeners.add(cb),
    removeEventListener: (_e, cb) => state.listeners.delete(cb),
  }));
  state.emit = (matches) => {
    state.matches = matches;
    state.listeners.forEach((cb) => cb({ matches }));
  };
  return state;
}

describe('useMediaQuery', () => {
  let mm;
  beforeEach(() => { mm = installMatchMedia(false); });
  afterEach(() => { delete window.matchMedia; });

  it('reports the initial match state', () => {
    mm = installMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery('(max-width: 600px)'));
    expect(result.current).toBe(true);
  });

  it('updates when the query starts matching', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 600px)'));
    expect(result.current).toBe(false);
    act(() => mm.emit(true));
    expect(result.current).toBe(true);
  });

  it('stops listening after unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(max-width: 600px)'));
    expect(mm.listeners.size).toBe(1);
    unmount();
    expect(mm.listeners.size).toBe(0);
  });

  it('re-subscribes when the query changes', () => {
    const { rerender } = renderHook(({ q }) => useMediaQuery(q), {
      initialProps: { q: '(max-width: 600px)' },
    });
    rerender({ q: '(min-width: 900px)' });
    expect(window.matchMedia).toHaveBeenLastCalledWith('(min-width: 900px)');
  });
});