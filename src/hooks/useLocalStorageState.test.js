import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useLocalStorageState from './useLocalStorageState';

describe('useLocalStorageState', () => {
  beforeEach(() => localStorage.clear());

  it('uses the default value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorageState('k', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('reads and parses an existing stored value', () => {
    localStorage.setItem('k', JSON.stringify({ a: 1 }));
    const { result } = renderHook(() => useLocalStorageState('k', null));
    expect(result.current[0]).toEqual({ a: 1 });
  });

  it('falls back to the default when the stored value is corrupt JSON', () => {
    localStorage.setItem('k', '{not-json');
    const { result } = renderHook(() => useLocalStorageState('k', 'safe'));
    expect(result.current[0]).toBe('safe');
  });

  it('persists a direct value and updates state', () => {
    const { result } = renderHook(() => useLocalStorageState('k', 0));
    act(() => result.current[1](42));
    expect(result.current[0]).toBe(42);
    expect(JSON.parse(localStorage.getItem('k'))).toBe(42);
  });

  it('supports a functional updater based on previous value', () => {
    const { result } = renderHook(() => useLocalStorageState('k', 1));
    act(() => result.current[1]((prev) => prev + 9));
    expect(result.current[0]).toBe(10);
    expect(JSON.parse(localStorage.getItem('k'))).toBe(10);
  });

  it('swallows write errors and still updates in-memory state', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const { result } = renderHook(() => useLocalStorageState('k', 'x'));
    act(() => result.current[1]('y'));
    expect(result.current[0]).toBe('y');
    spy.mockRestore();
  });
});