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
