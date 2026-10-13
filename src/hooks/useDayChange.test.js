import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { renderHook } from '@testing-library/react';
import { setVisibility } from '../test/utils';
import useDayChange from './useDayChange';

const monday = new Date(2026, 9, 12, 22, 0);
const tuesday = new Date(2026, 9, 13, 8, 0);

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

  // Switching apps blurs the window the evening before; the screen locking hides it the next
  // morning. Both are the same absence, and it began the evening before.
  it('counts from when the tab was first left, not from the last sign it was away', () => {
    const onDayChange = vi.fn();
    renderHook(() => useDayChange(onDayChange));
    window.dispatchEvent(new Event('blur'));
    vi.setSystemTime(tuesday);
    setVisibility('hidden');
    setVisibility('visible');
    window.dispatchEvent(new Event('focus'));
    expect(onDayChange).toHaveBeenCalledTimes(1);
  });

  // The screen locking and unlocking while another app has focus isn't a return: the window
  // is still in the background, so the absence that began at the blur carries on overnight.
  it('is not fooled by the tab flickering visible while the window is still in the background', () => {
    const onDayChange = vi.fn();
    renderHook(() => useDayChange(onDayChange));
    window.dispatchEvent(new Event('blur'));
    setVisibility('hidden');
    setVisibility('visible');
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
