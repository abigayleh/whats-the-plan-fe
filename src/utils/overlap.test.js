import { describe, it, expect } from 'vitest';
import { computeOverlapLayout } from './overlap';

const item = (id, start, end) => ({ id, scheduledStart: start, scheduledEnd: end });

describe('computeOverlapLayout', () => {
  it('returns an empty map for no items', () => {
    expect(computeOverlapLayout([]).size).toBe(0);
  });

  it('gives a lone item the full width', () => {
    const layout = computeOverlapLayout([item('a', 0, 60)]);
    expect(layout.get('a')).toEqual({ left: 0, width: 1 });
  });

  it('gives sequential (non-overlapping) items full width each', () => {
    const layout = computeOverlapLayout([item('a', 0, 60), item('b', 60, 120)]);
    expect(layout.get('a')).toEqual({ left: 0, width: 1 });
    expect(layout.get('b')).toEqual({ left: 0, width: 1 });
  });

  it('splits two overlapping items into two half-width columns', () => {
    const layout = computeOverlapLayout([item('a', 0, 120), item('b', 60, 180)]);
    expect(layout.get('a')).toEqual({ left: 0, width: 0.5 });
    expect(layout.get('b')).toEqual({ left: 0.5, width: 0.5 });
  });

  it('sorts by start time before laying out', () => {
    const layout = computeOverlapLayout([item('b', 60, 180), item('a', 0, 120)]);
    expect(layout.get('a')).toEqual({ left: 0, width: 0.5 });
    expect(layout.get('b')).toEqual({ left: 0.5, width: 0.5 });
  });

  it('reuses a freed column within a chained cluster', () => {
    // a[0,2] & b[1,4] overlap; c[3,5] joins the cluster and reuses a's column.
    const layout = computeOverlapLayout([
      item('a', 0, 2), item('b', 1, 4), item('c', 3, 5),
    ]);
    expect(layout.get('a')).toEqual({ left: 0, width: 0.5 });
    expect(layout.get('b')).toEqual({ left: 0.5, width: 0.5 });
    expect(layout.get('c')).toEqual({ left: 0, width: 0.5 });
  });

  it('treats an exactly-abutting item as a new cluster (end == next start)', () => {
    const layout = computeOverlapLayout([item('a', 0, 60), item('b', 60, 120)]);
    expect(layout.get('b').width).toBe(1);
  });

  it('caps concurrency at 4 columns and stacks extras into the last', () => {
    const items = [0, 1, 2, 3, 4].map((i) => item(`x${i}`, 0, 100));
    const layout = computeOverlapLayout(items);
    // Five concurrent -> width 1/4, and the 5th shares the last column.
    for (const it of items) expect(layout.get(it.id).width).toBe(0.25);
    expect(layout.get('x4').left).toBe(0.75);
  });

  it('starts a fresh cluster after a gap', () => {
    const layout = computeOverlapLayout([
      item('a', 0, 60), item('b', 30, 90), // cluster 1
      item('c', 200, 260), // separate cluster
    ]);
    expect(layout.get('a').width).toBe(0.5);
    expect(layout.get('c')).toEqual({ left: 0, width: 1 });
  });
});