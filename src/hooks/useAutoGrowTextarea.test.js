import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import useAutoGrowTextarea from './useAutoGrowTextarea';

describe('useAutoGrowTextarea', () => {
  it('returns a ref', () => {
    const { result } = renderHook(() => useAutoGrowTextarea(''));
    expect(result.current).toHaveProperty('current');
  });

  it('sizes the attached element to its scrollHeight when value changes', () => {
    const el = { style: { height: '' }, scrollHeight: 120 };
    const { result, rerender } = renderHook(({ v }) => useAutoGrowTextarea(v), {
      initialProps: { v: 'a' },
    });
    result.current.current = el;
    rerender({ v: 'a longer value' });
    expect(el.style.height).toBe('120px');
  });

  it('does nothing when no element is attached', () => {
    const { rerender } = renderHook(({ v }) => useAutoGrowTextarea(v), {
      initialProps: { v: 'a' },
    });
    // No ref attached — the layout effect must bail without throwing.
    expect(() => rerender({ v: 'b' })).not.toThrow();
  });
});