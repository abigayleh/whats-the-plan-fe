// Ancestor chain of a page (root-first), used for breadcrumbs. Cycle-guarded.
export function ancestorsOf(id, pages) {
  const byId = new Map(pages.map((p) => [p.id, p]));
  const chain = [];
  const seen = new Set();
  let cursor = byId.get(id)?.parentId;
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    const parent = byId.get(cursor);
    if (!parent) break;
    chain.unshift(parent);
    cursor = parent.parentId;
  }
  return chain;
}

// Narrows a page list to title matches plus every ancestor of a match, so a nested hit
// still renders in place rather than losing its context. Descendants of a match are NOT
// pulled in — a folder matching by name shouldn't drag its whole subtree into the results.
// `ancestorIds` lets the caller force those parents open regardless of stored expansion.
export function filterPagesByTitle(pages, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return { pages, matchIds: null, ancestorIds: new Set() };

  const byId = new Map(pages.map((p) => [p.id, p]));
  const matchIds = new Set(
    pages.filter((p) => (p.title || 'Untitled').toLowerCase().includes(needle)).map((p) => p.id),
  );

  const ancestorIds = new Set();
  matchIds.forEach((id) => {
    let cursor = byId.get(id)?.parentId;
    // Terminates on a cycle too: every id visited is added, so the guard always trips.
    while (cursor && !ancestorIds.has(cursor) && byId.has(cursor)) {
      ancestorIds.add(cursor);
      cursor = byId.get(cursor).parentId;
    }
  });

  return {
    pages: pages.filter((p) => matchIds.has(p.id) || ancestorIds.has(p.id)),
    matchIds,
    ancestorIds,
  };
}

// Siblings under `parentId`, ordered as the tree renders them (position, then title).
function orderedSiblings(parentId, pages) {
  return pages
    .filter((p) => (p.parentId || null) === (parentId || null))
    .sort((a, b) => (a.position - b.position) || (a.title || '').localeCompare(b.title || ''))
    .map((p) => p.id);
}

// Turns a drop (`dragId` released on `overId` with intent `band`: 'before'|'after'|'child')
// into the { parentId, orderedIds } the reorder API wants — or null for a no-op / self-nest.
export function resolveDrop(dragId, overId, band, pages) {
  if (!overId || overId === dragId) return null;
  const byId = new Map(pages.map((p) => [p.id, p]));
  const over = byId.get(overId);
  const drag = byId.get(dragId);
  if (!over || !drag || descendantIds(dragId, pages).has(overId)) return null;

  let parentId;
  let orderedIds;
  if (band === 'child') {
    parentId = overId;
    orderedIds = [...orderedSiblings(overId, pages).filter((id) => id !== dragId), dragId];
  } else {
    parentId = over.parentId || null;
    orderedIds = orderedSiblings(parentId, pages).filter((id) => id !== dragId);
    orderedIds.splice(orderedIds.indexOf(overId) + (band === 'after' ? 1 : 0), 0, dragId);
  }

  // Skip a drop that lands the page exactly where it already sits.
  if ((drag.parentId || null) === parentId && orderedSiblings(parentId, pages).join() === orderedIds.join())
    return null;
  return { parentId, orderedIds };
}

// All descendant ids of a page — a page can't be moved under one of these.
export function descendantIds(id, pages) {
  const childrenOf = new Map();
  pages.forEach((p) => {
    if (!p.parentId) return;
    if (!childrenOf.has(p.parentId)) childrenOf.set(p.parentId, []);
    childrenOf.get(p.parentId).push(p.id);
  });
  const out = new Set();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop();
    (childrenOf.get(cur) || []).forEach((childId) => {
      if (out.has(childId)) return;
      out.add(childId);
      stack.push(childId);
    });
  }
  return out;
}
