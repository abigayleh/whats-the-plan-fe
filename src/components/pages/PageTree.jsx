import { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import useLocalStorageSet from '../../hooks/useLocalStorageSet';
import { descendantIds, resolveDrop, filterPagesByTitle } from '../../utils/pageTree';
import PageTreeNode from './PageTreeNode';

// Turns a flat, single-scope page list into a parent→children forest (roots first),
// siblings in manual order (position, then title as a stable tiebreak).
function buildForest(pages) {
  const byId = new Map(pages.map((p) => [p.id, { ...p, children: [] }]));
  const roots = [];
  byId.forEach((node) => {
    const parent = node.parentId && byId.get(node.parentId);
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  const sort = (list) => {
    list.sort((a, b) => (a.position - b.position) || (a.title || '').localeCompare(b.title || ''));
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

// Which third of the target row the dragged row sits over: the outer thirds reorder
// as a sibling (before/after), the middle third nests the page as a child.
function bandFor(active, over) {
  const rect = active.rect.current.translated;
  if (!rect || !over.rect) return 'child';
  const ratio = (rect.top + rect.height / 2 - over.rect.top) / over.rect.height;
  if (ratio < 0.3) return 'before';
  if (ratio > 0.7) return 'after';
  return 'child';
}

function PageTree({
  pages, loading, personalSpace, groups, onNewChild, canManagePage, onReorder, query = '',
}) {
  // Collapsed rather than expanded: rows default to open, so only the exceptions are stored.
  const [collapsed, setCollapsed] = useLocalStorageSet('pages-tree-collapsed');
  const [drag, setDrag] = useState(null); // { activeId, overId, band } during a drag

  // Callers pass the state they want, not a flip, so a row forced open by a search can't
  // toggle the remembered state the wrong way.
  const setOpen = (id, open) => setCollapsed((prev) => {
    const next = new Set(prev);
    if (open) next.delete(id);
    else next.add(id);
    return next;
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const filtering = query.trim().length > 0;

  // Personal first, then one section per group. Each section is its own scope.
  // `all` stays unfiltered: a drop is resolved against the real sibling order, never the
  // narrowed view (drag is off while filtering, but the two must not be conflated).
  const scopes = [
    { key: 'personal', name: personalSpace.name, all: pages.filter((p) => !p.groupId) },
    ...groups.map((g) => ({ key: g.id, name: g.name, all: pages.filter((p) => p.groupId === g.id) })),
  ].map((scope) => {
    const { pages: visible, ancestorIds } = filterPagesByTitle(scope.all, query);
    return { ...scope, pages: visible, ancestorIds };
  });

  const noMatches = filtering && scopes.every((s) => s.pages.length === 0);

  function handleDragOver(scopePages, { active, over }) {
    // Ignore hovering over yourself or your own descendants — those drops can't happen.
    if (!over || over.id === active.id || descendantIds(active.id, scopePages).has(over.id)) {
      setDrag({ activeId: active.id });
      return;
    }
    setDrag({ activeId: active.id, overId: over.id, band: bandFor(active, over) });
  }

  function handleDragEnd(scopePages, { active, over }) {
    setDrag(null);
    if (!over) return;
    const band = bandFor(active, over);
    const result = resolveDrop(active.id, over.id, band, scopePages);
    if (!result) return;
    if (band === 'child') setOpen(over.id, true);
    onReorder(result.parentId, result.orderedIds);
  }

  if (loading) return <p className="page-tree__empty">Loading…</p>;
  if (noMatches) return <p className="page-tree__empty">No pages match “{query.trim()}”.</p>;

  return (
    <div className="page-tree">
      {scopes.map((scope) => {
        // A parent only shows because it leads to a match, so it must be open regardless of
        // what the user last collapsed — forced open for this render only, never written back.
        const shownCollapsed = filtering
          ? new Set([...collapsed].filter((id) => !scope.ancestorIds.has(id)))
          : collapsed;

        const list = (
          <ul className="page-tree__list">
            {buildForest(scope.pages).map((node) => (
              <PageTreeNode
                key={node.id}
                node={node}
                depth={0}
                collapsed={shownCollapsed}
                onToggle={setOpen}
                onNewChild={onNewChild}
                canManagePage={canManagePage}
                drag={drag}
                query={query}
              />
            ))}
          </ul>
        );

        // Scopes with nothing to show drop out during a search rather than each printing
        // "No pages yet", which would read as a claim about the scope, not the query.
        if (filtering && scope.pages.length === 0) return null;

        return (
          <div key={scope.key} className="page-tree__scope">
            <p className="page-tree__scope-title">{scope.name}</p>
            {scope.pages.length === 0 ? (
              <p className="page-tree__empty">No pages yet</p>
            ) : filtering ? list : (
              // Reordering a narrowed tree would compute sibling order from the visible
              // subset, so dragging is off until the search is cleared.
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={({ active }) => setDrag({ activeId: active.id })}
                onDragOver={(e) => handleDragOver(scope.all, e)}
                onDragEnd={(e) => handleDragEnd(scope.all, e)}
                onDragCancel={() => setDrag(null)}
              >
                {list}
              </DndContext>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default PageTree;
