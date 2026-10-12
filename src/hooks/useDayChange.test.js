import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { renderHook } from '@testing-library/react';
import useDayChange from './useDayChange';

const monday = new Date(2026, 9, 12, 22, 0);
const tuesday = new Date(2026, 9, 13, 8, 0);

function setVisibility(state) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('useDayChange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(monday);
  });
  afterEach(() => {
    setVisibility('visible');
    vi.useRealTimers();
  });

  it('stays quiet when the tab is left and returned to on the same day', () => {
    const onDayChange = vi.fn();
    renderHook(() => useDayChange(onDayChange));
    setVisibility('hidden');
    vi.setSystemTime(new Date(2026, 9, 12, 23, 30));
    setVisibility('visible');
    expect(onDayChange).not.toHaveBeenCalled();
  });

  it('fires when the tab is returned to on a later day', () => {
    const onDayChange = vi.fn();
    renderHook(() => useDayChange(onDayChange));
    setVisibility('hidden');
    vi.setSystemTime(tuesday);
    setVisibility('visible');
    expect(onDayChange).toHaveBeenCalledTimes(1);
  });

  it('fires when the window regains focus on a later day', () => {
    const onDayChange = vi.fn();
    renderHook(() => useDayChange(onDayChange));
    window.dispatchEvent(new Event('blur'));
    vi.setSystemTime(tuesday);
    window.dispatchEvent(new Event('focus'));
    expect(onDayChange).toHaveBeenCalledTimes(1);
  });

  it('fires once per day change, not on every later return', () => {
    const onDayChange = vi.fn();
    renderHook(() => useDayChange(onDayChange));
    setVisibility('hidden');
    vi.setSystemTime(tuesday);
    setVisibility('visible');
    setVisibility('hidden');
    setVisibility('visible');
    expect(onDayChange).toHaveBeenCalledTimes(1);
  });

  it('stops listening once unmounted', () => {
    const onDayChange = vi.fn();
    const { unmount } = renderHook(() => useDayChange(onDayChange));
    unmount();
    setVisibility('hidden');
    vi.setSystemTime(tuesday);
    setVisibility('visible');
    expect(onDayChange).not.toHaveBeenCalled();
  });
});
