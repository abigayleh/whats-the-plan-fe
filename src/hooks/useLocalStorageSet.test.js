import {
  describe, it, expect, beforeEach,
} from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useLocalStorageSet from './useLocalStorageSet';

describe('useLocalStorageSet', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to an empty Set', () => {
    const { result } = renderHook(() => useLocalStorageSet('s'));
    expect(result.current[0]).toBeInstanceOf(Set);
    expect(result.current[0].size).toBe(0);
  });

  it('rehydrates a Set from a stored array', () => {
    localStorage.setItem('s', JSON.stringify(['a', 'b']));
    const { result } = renderHook(() => useLocalStorageSet('s'));
    expect([...result.current[0]]).toEqual(['a', 'b']);
  });

  it('accepts a provided default array', () => {
    const { result } = renderHook(() => useLocalStorageSet('s', ['x']));
    expect(result.current[0].has('x')).toBe(true);
  });

  it('persists as an array when set to a new Set', () => {
    const { result } = renderHook(() => useLocalStorageSet('s'));
    act(() => result.current[1](new Set(['q', 'r'])));
    expect([...result.current[0]]).toEqual(['q', 'r']);
    expect(JSON.parse(localStorage.getItem('s'))).toEqual(['q', 'r']);
  });

  it('supports a functional updater receiving the previous Set', () => {
    localStorage.setItem('s', JSON.stringify(['a']));
    const { result } = renderHook(() => useLocalStorageSet('s'));
    act(() => result.current[1]((prev) => {
      const next = new Set(prev);
      next.add('b');
      return next;
    }));
    expect([...result.current[0]]).toEqual(['a', 'b']);
  });

  it('keeps a stable Set identity across renders when unchanged', () => {
    const { result, rerender } = renderHook(() => useLocalStorageSet('s'));
    const first = result.current[0];
    rerender();
    expect(result.current[0]).toBe(first);
  });
});