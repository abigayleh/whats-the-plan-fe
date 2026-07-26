import { describe, it, expect } from 'vitest';
import { ancestorsOf, resolveDrop, descendantIds } from './pageTree';

// r ─ a ─ a1
//   │   └ a2
//   └ b
const pages = [
  { id: 'r', parentId: null, position: 0, title: 'Root' },
  { id: 'a', parentId: 'r', position: 0, title: 'A' },
  { id: 'a1', parentId: 'a', position: 0, title: 'A1' },
  { id: 'a2', parentId: 'a', position: 1, title: 'A2' },
  { id: 'b', parentId: 'r', position: 1, title: 'B' },
];

describe('ancestorsOf', () => {
  it('returns the root-first ancestor chain', () => {
    expect(ancestorsOf('a1', pages).map((p) => p.id)).toEqual(['r', 'a']);
  });

  it('returns empty for a root page', () => {
    expect(ancestorsOf('r', pages)).toEqual([]);
  });

  it('returns empty for an unknown id', () => {
    expect(ancestorsOf('nope', pages)).toEqual([]);
  });

  it('terminates on a cycle rather than looping forever', () => {
    const cyclic = [
      { id: 'x', parentId: 'y', position: 0, title: 'X' },
      { id: 'y', parentId: 'x', position: 0, title: 'Y' },
    ];
    const chain = ancestorsOf('x', cyclic);
    expect(Array.isArray(chain)).toBe(true);
    expect(chain.length).toBeLessThanOrEqual(2);
  });
});

describe('descendantIds', () => {
  it('collects all transitive descendants', () => {
    expect([...descendantIds('r', pages)].sort()).toEqual(['a', 'a1', 'a2', 'b']);
  });

  it('collects direct children only when there are no grandchildren', () => {
    expect([...descendantIds('a', pages)].sort()).toEqual(['a1', 'a2']);
  });

  it('returns an empty set for a leaf', () => {
    expect(descendantIds('a1', pages).size).toBe(0);
  });

  it('returns an empty set for an unknown id', () => {
    expect(descendantIds('nope', pages).size).toBe(0);
  });
});

describe('resolveDrop', () => {
  it('returns null when dropped on nothing', () => {
    expect(resolveDrop('b', null, 'before', pages)).toBeNull();
  });

  it('returns null when dropped on itself', () => {
    expect(resolveDrop('a', 'a', 'child', pages)).toBeNull();
  });

  it('returns null when the target is a descendant (self-nest)', () => {
    expect(resolveDrop('a', 'a1', 'child', pages)).toBeNull();
  });

  it('returns null for an unknown drag or over id', () => {
    expect(resolveDrop('ghost', 'a', 'child', pages)).toBeNull();
    expect(resolveDrop('a', 'ghost', 'child', pages)).toBeNull();
  });

  it('nests a page as a child, appended after existing children', () => {
    expect(resolveDrop('b', 'a', 'child', pages)).toEqual({
      parentId: 'a',
      orderedIds: ['a1', 'a2', 'b'],
    });
  });

  it('inserts before the target within the target parent', () => {
    expect(resolveDrop('b', 'a1', 'before', pages)).toEqual({
      parentId: 'a',
      orderedIds: ['b', 'a1', 'a2'],
    });
  });

  it('inserts after the target within the target parent', () => {
    expect(resolveDrop('b', 'a1', 'after', pages)).toEqual({
      parentId: 'a',
      orderedIds: ['a1', 'b', 'a2'],
    });
  });

  it('reorders siblings that already share a parent', () => {
    expect(resolveDrop('a2', 'a1', 'before', pages)).toEqual({
      parentId: 'a',
      orderedIds: ['a2', 'a1'],
    });
  });

  it('returns null for a drop that changes nothing', () => {
    // a2 after a1 is already the current order.
    expect(resolveDrop('a2', 'a1', 'after', pages)).toBeNull();
  });

  it('orders siblings by position then title', () => {
    const tied = [
      { id: 'p', parentId: null, position: 0, title: 'P' },
      { id: 'z', parentId: 'p', position: 0, title: 'Zebra' },
      { id: 'm', parentId: 'p', position: 0, title: 'Mango' },
      { id: 'drag', parentId: null, position: 0, title: 'D' },
    ];
    // Same position -> title order Mango, Zebra; drag nests to the end.
    expect(resolveDrop('drag', 'p', 'child', tied).orderedIds).toEqual(['m', 'z', 'drag']);
  });
});