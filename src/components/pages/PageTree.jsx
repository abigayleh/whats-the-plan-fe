import { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import useLocalStorageState from '../../hooks/useLocalStorageState';
import { descendantIds, resolveDrop } from '../../utils/pageTree';
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
  pages, loading, personalSpace, groups, onNewChild, canManagePage, onReorder,
}) {
  const [expanded, setExpanded] = useLocalStorageState('pages-tree-expanded', {});
  const [drag, setDrag] = useState(null); // { activeId, overId, band } during a drag
  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: prev[id] === false }));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Personal first, then one section per group. Each section is its own scope.
  const scopes = [
    { key: 'personal', name: personalSpace.name, pages: pages.filter((p) => !p.groupId) },
    ...groups.map((g) => ({ key: g.id, name: g.name, pages: pages.filter((p) => p.groupId === g.id) })),
  ];

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
    if (band === 'child') setExpanded((prev) => ({ ...prev, [over.id]: true }));
    onReorder(result.parentId, result.orderedIds);
  }

  if (loading) return <p className="page-tree__empty">Loading…</p>;

  return (
    <div className="page-tree">
      {scopes.map((scope) => (
        <div key={scope.key} className="page-tree__scope">
          <p className="page-tree__scope-title">{scope.name}</p>
          {scope.pages.length === 0 ? (
            <p className="page-tree__empty">No pages yet</p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={({ active }) => setDrag({ activeId: active.id })}
              onDragOver={(e) => handleDragOver(scope.pages, e)}
              onDragEnd={(e) => handleDragEnd(scope.pages, e)}
              onDragCancel={() => setDrag(null)}
            >
              <ul className="page-tree__list">
                {buildForest(scope.pages).map((node) => (
                  <PageTreeNode
                    key={node.id}
                    node={node}
                    depth={0}
                    expanded={expanded}
                    onToggle={toggle}
                    onNewChild={onNewChild}
                    canManagePage={canManagePage}
                    drag={drag}
                  />
                ))}
              </ul>
            </DndContext>
          )}
        </div>
      ))}
    </div>
  );
}

export default PageTree;
