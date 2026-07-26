import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useResizableSplit from './useResizableSplit';

function drag(clientX) {
  window.dispatchEvent(new MouseEvent('mousemove', { clientX }));
}

describe('useResizableSplit', () => {
  beforeEach(() => localStorage.clear());

  it('returns the default width, a containerRef, and startResize', () => {
    const { result } = renderHook(() => useResizableSplit('split', 400));
    expect(result.current.width).toBe(400);
    expect(result.current.containerRef).toHaveProperty('current');
    expect(typeof result.current.startResize).toBe('function');
  });

  it('reads a persisted width', () => {
    localStorage.setItem('split', JSON.stringify(320));
    const { result } = renderHook(() => useResizableSplit('split', 400));
    expect(result.current.width).toBe(320);
  });

  it('resizes from the container right edge and persists the width', () => {
    const { result } = renderHook(() => useResizableSplit('split', 400));
    result.current.containerRef.current = { getBoundingClientRect: () => ({ right: 1000 }) };
    act(() => result.current.startResize({ preventDefault: vi.fn() }));
    act(() => drag(500)); // 1000 - 500 = 500
    expect(result.current.width).toBe(500);
    expect(JSON.parse(localStorage.getItem('split'))).toBe(500);
  });

  it('clamps to the maximum width', () => {
    const { result } = renderHook(() => useResizableSplit('split', 400));
    result.current.containerRef.current = { getBoundingClientRect: () => ({ right: 1000 }) };
    act(() => result.current.startResize({ preventDefault: vi.fn() }));
    act(() => drag(200)); // 800 -> clamp to 640
    expect(result.current.width).toBe(640);
  });

  it('clamps to the minimum width', () => {
    const { result } = renderHook(() => useResizableSplit('split', 400));
    result.current.containerRef.current = { getBoundingClientRect: () => ({ right: 1000 }) };
    act(() => result.current.startResize({ preventDefault: vi.fn() }));
    act(() => drag(900)); // 100 -> clamp to 260
    expect(result.current.width).toBe(260);
  });

  it('stops resizing after mouseup', () => {
    const { result } = renderHook(() => useResizableSplit('split', 400));
    result.current.containerRef.current = { getBoundingClientRect: () => ({ right: 1000 }) };
    act(() => result.current.startResize({ preventDefault: vi.fn() }));
    act(() => drag(500));
    act(() => window.dispatchEvent(new MouseEvent('mouseup')));
    act(() => drag(600));
    expect(result.current.width).toBe(500);
  });
});