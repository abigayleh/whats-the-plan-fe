import { describe, it, expect } from 'vitest';
import { clampImageWidth, MIN_IMAGE_WIDTH } from './imageWidth';

describe('clampImageWidth', () => {
  it('passes a sensible width straight through', () => {
    expect(clampImageWidth(400, 800)).toBe(400);
  });

  it('never goes below the minimum, however far you drag left', () => {
    expect(clampImageWidth(10, 800)).toBe(MIN_IMAGE_WIDTH);
    expect(clampImageWidth(-500, 800)).toBe(MIN_IMAGE_WIDTH);
  });

  it('never exceeds the column width', () => {
    expect(clampImageWidth(5000, 800)).toBe(800);
  });

  it('ignores a missing or unusable column width', () => {
    expect(clampImageWidth(5000, undefined)).toBe(5000);
    expect(clampImageWidth(5000, 0)).toBe(5000);
    expect(clampImageWidth(5000, NaN)).toBe(5000);
  });

  it('falls back to the minimum for a non-numeric width', () => {
    expect(clampImageWidth(NaN, 800)).toBe(MIN_IMAGE_WIDTH);
    expect(clampImageWidth(undefined, 800)).toBe(MIN_IMAGE_WIDTH);
  });
});