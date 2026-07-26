import { describe, it, expect } from 'vitest';
import { filterPagesByTitle } from './pageTree';

const page = (id, title, parentId = null) => ({
  id, title, parentId, position: 0,
});

// root ─ trip ─ budget
//             └ packing
// other
const pages = [
  page('root', 'Root'),
  page('trip', 'Barcelona Trip', 'root'),
  page('budget', 'Budget', 'trip'),
  page('packing', 'Packing list', 'trip'),
  page('other', 'Groceries'),
];

const ids = (result) => result.pages.map((p) => p.id).sort();

describe('filterPagesByTitle', () => {
  it('returns everything untouched for an empty query', () => {
    const result = filterPagesByTitle(pages, '   ');
    expect(result.pages).toBe(pages);
    expect(result.matchIds).toBeNull();
  });

  it('keeps a match and every ancestor above it', () => {
    const result = filterPagesByTitle(pages, 'budget');
    expect(ids(result)).toEqual(['budget', 'root', 'trip']);
    expect([...result.matchIds]).toEqual(['budget']);
    expect([...result.ancestorIds].sort()).toEqual(['root', 'trip']);
  });

  it('does not pull in the descendants of a matching page', () => {
    const result = filterPagesByTitle(pages, 'barcelona');
    expect(ids(result)).toEqual(['root', 'trip']);
  });

  it('matches case-insensitively on a substring', () => {
    expect(ids(filterPagesByTitle(pages, 'GROCER'))).toEqual(['other']);
  });

  it('returns nothing when there is no match', () => {
    expect(filterPagesByTitle(pages, 'zzz').pages).toEqual([]);
  });

  it('matches an untitled page by its placeholder', () => {
    const withBlank = [...pages, page('blank', '')];
    expect(ids(filterPagesByTitle(withBlank, 'untitled'))).toEqual(['blank']);
  });

  it('terminates on a parent cycle instead of hanging', () => {
    const cyclic = [page('a', 'Alpha', 'b'), page('b', 'Beta', 'a')];
    expect(ids(filterPagesByTitle(cyclic, 'alpha'))).toEqual(['a', 'b']);
  });

  it('ignores a parent id that no longer exists', () => {
    const orphan = [page('x', 'Orphan', 'missing')];
    expect(ids(filterPagesByTitle(orphan, 'orphan'))).toEqual(['x']);
  });
});