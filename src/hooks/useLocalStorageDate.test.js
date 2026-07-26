import {
  describe, it, expect, beforeEach,
} from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useLocalStorageDate from './useLocalStorageDate';

describe('useLocalStorageDate', () => {
  beforeEach(() => localStorage.clear());

  it('returns the default date and stores its timestamp', () => {
    const def = new Date('2026-01-15T12:00:00Z');
    const { result } = renderHook(() => useLocalStorageDate('d', def));
    expect(result.current[0]).toBeInstanceOf(Date);
    expect(result.current[0].getTime()).toBe(def.getTime());
  });

  it('rehydrates a Date from a stored timestamp', () => {
    const ts = new Date('2026-03-01T00:00:00Z').getTime();
    localStorage.setItem('d', JSON.stringify(ts));
    const { result } = renderHook(() => useLocalStorageDate('d', new Date()));
    expect(result.current[0].getTime()).toBe(ts);
  });

  it('keeps a stable Date identity while the timestamp is unchanged', () => {
    const { result, rerender } = renderHook(() => useLocalStorageDate('d', new Date(0)));
    const first = result.current[0];
    rerender();
    expect(result.current[0]).toBe(first);
  });

  it('sets a new date via a direct Date value', () => {
    const { result } = renderHook(() => useLocalStorageDate('d', new Date(0)));
    const next = new Date('2026-06-06T06:06:00Z');
    act(() => result.current[1](next));
    expect(result.current[0].getTime()).toBe(next.getTime());
    expect(JSON.parse(localStorage.getItem('d'))).toBe(next.getTime());
  });

  it('supports a functional updater receiving the previous Date', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const { result } = renderHook(() => useLocalStorageDate('d', start));
    act(() => result.current[1]((prev) => new Date(prev.getTime() + 86400000)));
    expect(result.current[0].getTime()).toBe(start.getTime() + 86400000);
  });
});